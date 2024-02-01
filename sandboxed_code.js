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
const sendHttpGet = require('sendHttpGet');
const sendHttpRequest = require('sendHttpRequest');
const setResponseBody = require('setResponseBody');
const setResponseHeader = require('setResponseHeader');
const setResponseStatus = require('setResponseStatus');
const getContainerVersion = require('getContainerVersion');
const getRemoteAddress = require('getRemoteAddress');
const getType = require('getType');
const path = getRequestPath();

const cookieWhiteList = ['xnpe_' + data.projectToken, '__exponea_etc__', '__exponea_time2__'];
const headerWhiteList = ['referer', 'user-agent', 'etag'];

log({
    'Name': 'Exponea',
    'Type': 'Processing',
    'data': data,
    'path': path
});

// Check if this Client should proxy static files
if (splitAndSanitize(data.proxyStaticFilePaths).reduce((res,proxyPath)=>res || equalOrStartsOrEnds(path,proxyPath), false)) {
    claimRequest();
    const resultUrl = combineURLs(data.targetAPI, path);
    log({
        'Name': 'Exponea',
        'Type': 'Serving JS',
        'targetAPI': data.targetAPI,
        'path': path,
        'resultUrl': resultUrl
    });
    sendHttpGet(resultUrl, {headers: {'X-Forwarded-For': getRemoteAddress()}}).then((result) => {
      sendProxyResponse(result.body, result.headers, result.statusCode);
    });
    return;
}

const validPaths = [
  '/bulk',
  '/managed-tags/show',
  '/campaigns/banners/show',
  '/campaigns/experiments/show',
  '/campaigns/html/get',
  '/optimization/recommend/user',
  '/webxp/projects/',
  '/webxp/data/modifications/',
  '/webxp/bandits/reward',
  '/webxp/script-async/',
  '/webxp/script/'
];

let isValidPath = false; 

// Check if this Client should claim request
if (validPaths.reduce((res,validPath)=>res || equalOrStartsOrEnds(path,validPath,true), false)) {
    log({
        'Name': 'Exponea',
        'Type': 'Valid path',
        'path': path
    });
    isValidPath = true;
}


if (!isValidPath) {
  return;
} else {

    claimRequest();

    const traceId = getRequestHeader('trace-id');
    const requestOrigin = getRequestHeader('Origin');
    const requestMethod = getRequestMethod();
    const requestBody = getRequestBody();
    const requestUrl = generateRequestUrl();
    const requestHeaders = generateRequestHeaders();

    log({
        'Name': 'Exponea',
        'Type': 'Request',
        'TraceId': traceId,
        'RequestOrigin': requestOrigin,
        'RequestMethod': requestMethod,
        'RequestUrl': requestUrl,
        'RequestHeaders': requestHeaders,
        'RequestBody': requestBody,
    });
    sendHttpRequest(requestUrl, {method: requestMethod, headers: requestHeaders}, requestBody).then((result) => {
        log({
        'Name': 'Exponea',
        'Type': 'Response',
        'TraceId': traceId,
        'ResponseStatusCode': result.statusCode,
        'ResponseHeaders': result.headers,
        'ResponseBody': result.body,
        });

        for (const key in result.headers) {
            if (key === 'set-cookie') {
                setResponseCookies(result.headers[key]);
            } else {
                setResponseHeader(key, result.headers[key]);
            }
        }

        setResponseBody(result.body||"");
        setResponseStatus(result.statusCode);

        if (requestOrigin) {
            setResponseHeader('access-control-allow-origin', requestOrigin);
            setResponseHeader('access-control-allow-credentials', 'true');
        }

        returnResponse();
    });
}


function generateRequestUrl() {
    let url = combineURLs(data.targetAPI, getRequestPath());
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
    const containerVersion = getContainerVersion();
    const isDebug = containerVersion.debugMode;
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

function log(data) {
    const isLoggingEnabled = determinateIsLoggingEnabled();
    if (isLoggingEnabled) {
        logToConsole(JSON.stringify(data));
    }
}

function startsWith(string, substring) {
    return string.indexOf(substring) === 0;
}

function endsWith(string, substring) {
    const lastIndex = string.lastIndexOf(substring);
    return lastIndex > -1 && (string.length === (lastIndex + substring.length));
}


function equalOrStartsOrEnds(string, substring, withWildcard) {
    if (substring.length === 0) return false;
    
    const containWildcard = substring.indexOf("*") > -1;
    const eq = string === substring;
    if (eq) return true;
    log({
        'Name': 'Exponea',
        'Type': 'EqualOrStartsOrEnds',
        'string': string,
        'substring': substring,
        'withWildcard': withWildcard,
        'containWildcard': containWildcard
    });
    if (!withWildcard || !containWildcard) {
        return startsWith(string, substring) || endsWith(string, substring);
    } else {
        const parsedSubstring = withWildcard ? substring.split("*", 2) : [substring];
        return startsWith(string, parsedSubstring[0]) && endsWith(string, parsedSubstring[1]); 
    }
}

function splitAndSanitize(arr) {
    if (getType(arr) !== 'string') return [];
    return arr.split(',').map(a=>a.trim()).filter(a=>a);
}

function removeEndSlash(string) {
    if (endsWith(string, '/')) return string.slice(0,-1);
    return string;
}
function removeStartSlash(string) {
    if (startsWith(string, '/')) return string.slice(1);
    return string;
}

function combineURLs(baseURL, relativeURL) {
    return (
        relativeURL ?
            removeEndSlash(baseURL) + '/' + removeStartSlash(relativeURL) :
            baseURL
    );
}