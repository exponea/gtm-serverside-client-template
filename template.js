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
const makeString = require('makeString');
const path = getRequestPath();
const queryString = getRequestQueryString();

// Check if this Client should serve exponea.js file
if (path === data.proxyJsFilePath) {
    claimRequest();

    const now = getTimestampMillis();
    const thirty_minutes_ago = now - 1800000;

    if (templateDataStorage.getItemCopy('exponea_js') == null || templateDataStorage.getItemCopy('exponea_stored_at') < thirty_minutes_ago) {
        sendHttpGet(data.targetAPI+'/js/exponea.min.js', {headers: {'X-Forwarded-For': getRemoteAddress()}}).then((result) => {
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

// Check if this Client should serve modifications.min.js file
if (endsWith(path, '/modifications.min.js')) {
    claimRequest();

    sendHttpGet(data.targetAPI+path+'?'+queryString, {headers: {'X-Forwarded-For': getRemoteAddress()}}).then((result) => {
        sendProxyResponse(result.body, result.headers, result.statusCode);
    });
}

// Check if this Client should serve editor files
if (startsWith(path, '/editor/')) {
    claimRequest();

    sendHttpGet(data.targetAPI+path, {headers: {'X-Forwarded-For': getRemoteAddress()}}).then((result) => {
        sendProxyResponse(result.body, result.headers, result.statusCode);
    });
}

// Check if this Client should serve exponea.js.map file (Just only to avoid annoying error in console)
if (path === '/exponea.min.js.map' || path === '/js/exponea.min.js.map') {
    sendProxyResponse('{"version": 1, "mappings": "", "sources": [], "names": [], "file": ""}', {'Content-Type': 'application/json'}, 200);
}

// Check if this Client should claim request
if (path !== '/bulk' && path !== '/managed-tags/show' && path !== '/campaigns/banners/show' && path !== '/campaigns/experiments/show' && path !== ('/webxp/projects/'+data.projectToken+'/bundle')) {
    return;
}

claimRequest();


const cookieWhiteList = ['xnpe_' + data.projectToken, '__exponea_etc__', '__exponea_time2__'];
const headerWhiteList = ['referer', 'user-agent', 'etag'];

const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = isLoggingEnabled ? getRequestHeader('trace-id') : undefined;

const requestOrigin = getRequestHeader('Origin');
const requestMethod = getRequestMethod();
const requestBody = getRequestBody();
const requestUrl = generateRequestUrl();
const requestHeaders = generateRequestHeaders();

if (isLoggingEnabled) {
    logToConsole(JSON.stringify({
        'Name': 'Bloomreach',
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
            'Name': 'Bloomreach',
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
        let cookieArray = setCookieHeader[i].split('; ').map(pair => pair.split('='));
        let cookieOptions = cookieArray.reduce((options, pair) => {
            let key = makeString(pair[0]).trim().toLowerCase();
            let value = pair[1];

            if (['samesite', 'same-site'].indexOf(key) >= 0) {
                options['sameSite'] = value;
            } else if (['httponly', 'http-only'].indexOf(key) >= 0) {
                options['httpOnly'] = value;
            } else if (['domain', 'expires', 'max-age', 'path'].indexOf(key) >= 0) {
                options[key] = value;
            } else if (key === 'secure') {
                options[key] = true;
            }

            return options;
        }, {});

        setCookie(cookieArray[0][0], cookieArray[0][1], cookieOptions);
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
    const containerVersion = getContainerVersion();
    const isDebug = !!(
        containerVersion &&
        (containerVersion.debugMode || containerVersion.previewMode)
    );

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

function endsWith(str, search) {
    return str.indexOf(search, str.length - search.length) !== -1;
}

function startsWith(str, search) {
    return str.indexOf(search, 0) === 0;
}