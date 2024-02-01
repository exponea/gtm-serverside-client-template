import 'dotenv/config';
const GTM_SERVER = process.env.GTM_SERVER;
const GTM_PREVIEW = process.env.GTM_PREVIEW;
const TARGET_API = process.env.TARGET_API;
const PROJECT_TOKEN = process.env.PROJECT_TOKEN;

import urlJoin from 'url-join';
import fetch from 'node-fetch';

describe('Static JS files', () => {

    const staticFilePaths = [
        '/js/exponea.min.js',
        '/js/exponea.min.js.map'
    ]

    const headers = {
    }
    if (GTM_PREVIEW) headers['x-gtm-server-preview'] = GTM_PREVIEW

    it('should be claimed and served from targetAPI', () => {
        return Promise.all(staticFilePaths.map(path => {
            return fetch(urlJoin(GTM_SERVER, path),{headers}).then(resp => {
                expect(resp.status).toEqual(200)
            })
        }));
    })
})

describe('modifications.min.js', () => {

    it('script should be claimed and served from targetAPI', () => {
        const url = urlJoin(
            GTM_SERVER,
            '/webxp/script/',
            PROJECT_TOKEN,
            '/a0e13a92-0fe4-4dd8-a414-a5f5e26269d2',
            '/modifications.min.js?http-referer=https://localhost:4000/'
        );
        return fetch(url).then(resp => {
            return expect(resp.status).toEqual(200)
        })
        
    })
    it('script-async should be claimed and served from targetAPI', () => {
        const url = urlJoin(
            GTM_SERVER,
            '/webxp/script-async/',
            PROJECT_TOKEN,
            '/a0e13a92-0fe4-4dd8-a414-a5f5e26269d2',
            '/modifications.min.js?http-referer=https://localhost:4000/&timeout=4000ms'
        );
        return fetch(url).then(resp => {
            return expect(resp.status).toEqual(200)
        })
        
    })
})

describe('proxying valid requests made by JS SDK', () => {

    it('GET /bundle', () => {
        const url = urlJoin(
            GTM_SERVER,
            '/webxp/projects/',
            PROJECT_TOKEN,
            '/bundle'
        );
        return fetch(url).then(resp => {
            expect(resp.status).toEqual(200);
            return resp.json()
        }).then(data => {
            expect(data['constantManagedTags']).toBeDefined()
        })
        
    })
    it('POST /bulk', () => {
        const url = urlJoin(
            GTM_SERVER,
            '/bulk'
        );
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify({"sdk": "js-client", "sdk_snippet_version": "v1.0.0", "sdk_version": "v2.20.0"}),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(resp => {
            expect(resp.status).toEqual(400);
            return resp.json()
        }).then(data => {
            expect(data['success']).toBeFalsy()
            expect(data['message']).toEqual("No commands")
        })
        
    })
    it('POST /managed-tags/show', () => {
        const url = urlJoin(
            GTM_SERVER,
            '/managed-tags/show'
        );
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(resp => {
            expect(resp.status).toEqual(400);
            return resp.json()
        }).then(data => {
            expect(data['success']).toBeFalsy()
            expect(data['errors']['customer_ids']).toBeDefined()
        })
        
    })
    it('POST /campaigns/banners/show', () => {
        const url = urlJoin(
            GTM_SERVER,
            '/campaigns/banners/show'
        );
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(resp => {
            expect(resp.status).toEqual(400);
            return resp.json()
        }).then(data => {
            expect(data['success']).toBeFalsy()
            expect(data['errors']).toBeDefined()
        })
        
    })
})