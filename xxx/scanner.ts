import {JSScanner} from './jsScanner';


import {plugin} from './packer';

let jsScanner: JSScanner;
export function scanner() {
    return plugin(plug => new Promise((resolve, reject) => {
        if (!jsScanner) {
            jsScanner = new JSScanner(plug);
        }
        const promises = plug.jsEntries.map(file => () => jsScanner.scan(file));
        promises.reduce((p, fn) => p.then(fn), Promise.resolve(null)).then(resolve, reject);
    }));
}