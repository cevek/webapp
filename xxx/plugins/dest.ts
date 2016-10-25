import {plugin} from '../packer';

export function dest() {
    return plugin(async plug => {
        const files = plug.list.filter(f => !f.fromFileSystem && f.updated && !f.isSourceMap);
        const newFiles = files.slice();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.sourcemapFile) {
                newFiles.push(file.sourcemapFile);
            }
        }
        for (let i = 0; i < newFiles.length; i++) {
            const file = newFiles[i];
            await file.writeFileToFS();
        }
    });
}