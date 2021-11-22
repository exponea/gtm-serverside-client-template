___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "CLIENT",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "Exponea Analytics Client",
  "brand": {
    "id": "brand_dummy",
    "displayName": "",
    "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAM1BMVEX/zQAcFzP/0gAAADSohyH/1gClhCL/zwAAADehgSPWrBWwjSD/2wAPDTSsiiD/3wBxWyvoA5xkAAABPUlEQVR4nO3cW26DMBRF0WAgDSWPzn+0/bdV0JUq2TdZawTeUfIBB3K5AAAAAAAAAAAAAAAAAAAAwLjWqNL7xEHrbY65bckS13mKmReFg1GocHwKFY5PocLxKVQ4vqbwcXb5dE1e+Ph5Loeu31+9zxxTF87PtRxLFtgWZvuZnVKYn8L8FOanMD+F+SnM7/0KS7V3vurC/Z57IS1bvYhOlewLaVmi92WaT2Dwr7FChQr7U6hQYX8KFSrs7xMLg4+XDr+QNoXzfjyIpltI28L7ySCabSFtC9feR/pnCvNTmJ/C/BTmpzA/hfm9YWE1b973uvCV/B3S9hXRqRK9xB9tIQ0/qH5qtPs0ChUq7E+hQoX9KVSosL8PKIz+wc65wRbSsgUH0HwLaXT/TL+QAgAAAAAAAAAAAAAAAAAA/O0Xm1MdrfEGnRgAAAAASUVORK5CYII\u003d"
  },
  "description": "Exponea helps you maximize profits and drive customer loyalty by targeting the right customers with the right message at the perfect time.",
  "containerContexts": [
    "SERVER"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "TEXT",
    "name": "projectToken",
    "displayName": "Project token",
    "simpleValueType": true
  },
  {
    "type": "TEXT",
    "name": "targetAPI",
    "displayName": "API endpoint",
    "simpleValueType": true
  }
]


___SANDBOXED_JS_FOR_SERVER___

const claimRequest = require('claimRequest');
const getCookieValues = require('getCookieValues');
const getRequestBody = require('getRequestBody');
const getRequestHeader = require('getRequestHeader');
const getRequestMethod = require('getRequestMethod');
const getRequestPath = require('getRequestPath');
const getRequestQueryString = require('getRequestQueryString');
const JSON = require('JSON');
const log = require('logToConsole');
const makeString = require('makeString');
const returnResponse = require('returnResponse');
const setCookie = require('setCookie');
const sendHttpRequest = require('sendHttpRequest');
const setResponseBody = require('setResponseBody');
const setResponseHeader = require('setResponseHeader');
const setResponseStatus = require('setResponseStatus');

//Exponea Analytics Client: Logs
log("Exponea Analytics Client - Incoming request method: ", getRequestMethod());
log("Exponea Analytics Client - Incoming request path: ", getRequestPath());

log("Exponea Analytics Client: Valid REQUEST "+ getRequestPath() +" request claimed");
claimRequest();

//Exponea Analytics Client: Helper preventing CORS errors
const sendResponse = () => {
  const origin = getRequestHeader('Origin');
  if (origin) {
	setResponseHeader('access-control-allow-origin', origin);
	setResponseHeader('access-control-allow-credentials', 'true');
  }
  returnResponse();
};

//Exponea Analytics Client: Helper parsing and setting set-cookie header
const setCookieHeader = (setCookieHeader) => {
  for (var i = 0; i < setCookieHeader.length; i++) {
	var setCookieArray = setCookieHeader[i].split('; ').map(pair => pair.split('='));
	var setCookieJson = "";
	for (var j = 1; j < setCookieArray.length; j++) {
	  if (j == 1) {
		setCookieJson += '{';
	  }
      
	  if (setCookieArray[j].length > 1)
		setCookieJson += '"' + setCookieArray[j][0] + '": "' + setCookieArray[j][1] + '"';
	  else 
		setCookieJson += '"' + setCookieArray[j][0] + '": ' + true;
      
	  if (j + 1 < setCookieArray.length) 
		setCookieJson += ',';
	  else 
		setCookieJson += '}';
	}
	setCookie(setCookieArray[0][0], setCookieArray[0][1], JSON.parse(setCookieJson));
  }
};

//Exponea Analytics Client: Sending HTTP request to Exponea and response back to the browser 
var postBody = getRequestBody();
log('Post Body', postBody);

var headerWhiteList = ['referer', 'user-agent', 'etag'];
var headers = {};

for (var i = 0; i < headerWhiteList.length; i++) {
  const headerName = headerWhiteList[i];
  const headerValue = getRequestHeader(headerName);
  if (headerValue) {
    headers[headerName] = getRequestHeader(headerName);
  }
}

var cookieWhiteList = ['xnpe_' + data.projectToken, '__exponea_etc__', '__exponea_time2__'];
var cookies = [];
headers.cookie = '';
for (var i = 0; i < cookieWhiteList.length; i++) {
  const cookieName = cookieWhiteList[i];
  const cookieValue = getCookieValues(cookieName);
  if (cookieValue && cookieValue.length) {
    cookies.push(cookieName + '=' + cookieValue[0]);    
  }
}
headers.cookie = cookies.join('; ');

log('Request Headers', headers);
let url = data.targetAPI + getRequestPath();
const queryParams = getRequestQueryString();
if (queryParams) {
  url = url + '?' + queryParams;
}

sendHttpRequest(url, (statusCode, headers, body) => {
  //Exponea Analytics Client: Set response headers
  log('Response Headers', headers);
  for (const key in headers) {
	log(key, headers[key]);
	if (key === 'set-cookie') {
	  setCookieHeader(headers[key]);
	} else {
	  setResponseHeader(key, headers[key]);
	}
  }
  setResponseBody(body);
  setResponseStatus(statusCode);
  log('Exponea Analytics Client: REQUEST processed. Sending response ...');
  sendResponse();
}, {method: getRequestMethod(), headers: headers}, postBody);


___SERVER_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "logging",
        "versionId": "1"
      },
      "param": [
        {
          "key": "environments",
          "value": {
            "type": 1,
            "string": "debug"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "read_request",
        "versionId": "1"
      },
      "param": [
        {
          "key": "requestAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "headerAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "queryParameterAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "return_response",
        "versionId": "1"
      },
      "param": []
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_response",
        "versionId": "1"
      },
      "param": [
        {
          "key": "writeResponseAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "writeHeaderAccess",
          "value": {
            "type": 1,
            "string": "specific"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "send_http",
        "versionId": "1"
      },
      "param": [
        {
          "key": "allowedUrls",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "set_cookies",
        "versionId": "1"
      },
      "param": [
        {
          "key": "allowedCookies",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "name"
                  },
                  {
                    "type": 1,
                    "string": "domain"
                  },
                  {
                    "type": 1,
                    "string": "path"
                  },
                  {
                    "type": 1,
                    "string": "secure"
                  },
                  {
                    "type": 1,
                    "string": "session"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "*"
                  },
                  {
                    "type": 1,
                    "string": "*"
                  },
                  {
                    "type": 1,
                    "string": "*"
                  },
                  {
                    "type": 1,
                    "string": "any"
                  },
                  {
                    "type": 1,
                    "string": "any"
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "get_cookies",
        "versionId": "1"
      },
      "param": [
        {
          "key": "cookieAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]


___TESTS___

scenarios: []


___NOTES___

Created on 24. 8. 2021, 13:27:38


