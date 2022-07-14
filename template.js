const claimRequest = require('claimRequest');
const getCookieValues = require('getCookieValues');
const getRequestBody = require('getRequestBody');
const getRequestHeader = require('getRequestHeader');
const getRequestMethod = require('getRequestMethod');
const getRequestPath = require('getRequestPath');
const getRequestQueryString = require('getRequestQueryString');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const returnResponse = require('returnResponse');
const setCookie = require('setCookie');
const templateDataStorage = require('templateDataStorage');
const sendHttpGet = require('sendHttpGet');
const getTimestampMillis = require('getTimestampMillis');
const sendHttpRequest = require('sendHttpRequest');
const setResponseBody = require('setResponseBody');
const setResponseHeader = require('setResponseHeader');
const setResponseStatus = require('setResponseStatus');
const getContainerVersion = require('getContainerVersion');
const getRemoteAddress = require('getRemoteAddress');
const path = getRequestPath();

// Check if this Client should serve exponea.js file
if (path === data.proxyJsFilePath) {
    claimRequest();

    const now = getTimestampMillis();
    const thirty_minutes_ago = now - (30 * 60 * 1000);

    if (templateDataStorage.getItemCopy('exponea_js') == null || templateDataStorage.getItemCopy('exponea_stored_at') < thirty_minutes_ago) {
        sendHttpGet('https://api.exponea.com/js/exponea.min.js', {headers: {'X-Forwarded-For': getRemoteAddress()}}).then((result) => {
            if (result.statusCode === 200) {
                templateDataStorage.setItemCopy('exponea_js', result.body);
                templateDataStorage.setItemCopy('exponea_headers', result.headers);
                templateDataStorage.setItemCopy('exponea_stored_at', now);
            }
            sendProxyResponse(result.body, result.headers, result.statusCode);
        });
    } else {
        sendProxyResponse(
            templateDataStorage.getItemCopy('exponea_js'),
            templateDataStorage.getItemCopy('exponea_headers'),
            200
        );
    }
}

// Check if this Client should serve exponea.js.map file (Just only to avoid annoying error in console)
if (path === '/exponea.min.js.map' || path === '/js/exponea.min.js.map') {
    sendProxyResponse('{"version": 1, "mappings": "", "sources": [], "names": [], "file": ""}', {'Content-Type': 'application/json'}, 200);
}

// Check if this Client should claim request
if (path !== '/bulk' && path !== '/managed-tags/show' && path !== '/campaigns/banners/show' && path !== ('/webxp/projects/'+data.projectToken+'/bundle')) {
    return;
}

claimRequest();


const cookieWhiteList = ['xnpe_' + data.projectToken, '__exponea_etc__', '__exponea_time2__'];
const headerWhiteList = ['referer', 'user-agent', 'etag'];

const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

const requestOrigin = getRequestHeader('Origin');
const requestMethod = getRequestMethod();
const requestBody = getRequestBody();
const requestUrl = generateRequestUrl();
const requestHeaders = generateRequestHeaders();

if (isLoggingEnabled) {
    logToConsole(JSON.stringify({
        'Name': 'Exponea',
        'Type': 'Request',
        'TraceId': traceId,
        'RequestOrigin': requestOrigin,
        'RequestMethod': requestMethod,
        'RequestUrl': requestUrl,
        'RequestHeaders': requestHeaders,
        'RequestBody': requestBody,
    }));
}

sendHttpRequest(requestUrl, {method: requestMethod, headers: requestHeaders}, requestBody).then((result) => {
    if (isLoggingEnabled) {
        logToConsole(JSON.stringify({
            'Name': 'Exponea',
            'Type': 'Response',
            'TraceId': traceId,
            'ResponseStatusCode': result.statusCode,
            'ResponseHeaders': result.headers,
            'ResponseBody': result.body,
        }));
    }

    for (const key in result.headers) {
        if (key === 'set-cookie') {
            setResponseCookies(result.headers[key]);
        } else {
            setResponseHeader(key, result.headers[key]);
        }
    }

    setResponseBody(result.body);
    setResponseStatus(result.statusCode);

    if (requestOrigin) {
        setResponseHeader('access-control-allow-origin', requestOrigin);
        setResponseHeader('access-control-allow-credentials', 'true');
    }

    returnResponse();
});


function generateRequestUrl() {
    let url = data.targetAPI + getRequestPath();
    const queryParams = getRequestQueryString();

    if (queryParams) url = url + '?' + queryParams;

    return url;
}

function generateRequestHeaders() {
    let headers = {};
    let cookies = [];

    for (let i = 0; i < headerWhiteList.length; i++) {
        let headerName = headerWhiteList[i];
        let headerValue = getRequestHeader(headerName);

        if (headerValue) {
            headers[headerName] = getRequestHeader(headerName);
        }
    }

    headers.cookie = '';

    for (let i = 0; i < cookieWhiteList.length; i++) {
        let cookieName = cookieWhiteList[i];
        let cookieValue = getCookieValues(cookieName);

        if (cookieValue && cookieValue.length) {
            cookies.push(cookieName + '=' + cookieValue[0]);
        }
    }

    headers.cookie = cookies.join('; ');
    headers['X-Forwarded-For'] = getRemoteAddress();

    return headers;
}

function setResponseCookies(setCookieHeader) {
    for (let i = 0; i < setCookieHeader.length; i++) {
        let setCookieArray = setCookieHeader[i].split('; ').map(pair => pair.split('='));
        let setCookieJson = '';

        for (let j = 1; j < setCookieArray.length; j++) {
            if (j === 1) setCookieJson += '{';
            if (setCookieArray[j].length > 1) setCookieJson += '"' + setCookieArray[j][0] + '": "' + setCookieArray[j][1] + '"'; else setCookieJson += '"' + setCookieArray[j][0] + '": ' + true;
            if (j + 1 < setCookieArray.length) setCookieJson += ','; else setCookieJson += '}';
        }

        setCookie(setCookieArray[0][0], setCookieArray[0][1], JSON.parse(setCookieJson));
    }
}

function sendProxyResponse(response, headers, statusCode) {
    setResponseStatus(statusCode);
    setResponseBody(response);

    for (const key in headers) {
        setResponseHeader(key, headers[key]);
    }

    returnResponse();
}

function determinateIsLoggingEnabled() {
    if (!data.logType) {
        return isDebug;
    }

    if (data.logType === 'no') {
        return false;
    }

    if (data.logType === 'debug') {
        return isDebug;
    }

    return data.logType === 'always';
}
