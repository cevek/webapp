import {plugin} from './packer';

export function hmr() {
    return plugin(plug => new Promise((resolve, reject) => {
        resolve();
    }));
}