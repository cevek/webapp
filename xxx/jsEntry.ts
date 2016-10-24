import {plugin} from './packer';

export function jsEntry(filename: string) {
    return plugin(plug => new Promise((resolve, reject) => {
        filename = plug.normalizeDestName(filename);
        // console.log(plug.list.map(f => f.fullName));
        const file = plug.getFileByName(filename);
        if (!file) {
            throw new Error(`jsEntry: file ${filename} doesn't exist`);
        }
        plug.jsEntries.push(file);
        // console.log('add entry', filename);
        resolve();
    }));
}