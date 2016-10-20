import {plugin} from './packer';

export function dest() {
    return plugin(plug => new Promise((resolve, reject) => {
        const files = plug.list.filter(f => !f.fromFileSystem && f.updated && !f.isSourceMap);
        const newFiles = files.slice();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.sourcemapFile) {
                newFiles.push(file.sourcemapFile);
            }
        }
        Promise.all(newFiles.map(file => file.writeFileToFS()))
            .then(resolve, reject);
    }));
}