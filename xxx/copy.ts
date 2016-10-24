import {plugin, Glob} from './packer';

export function copy(globFiles: Glob) {
    return plugin(plug => new Promise((resolve, reject) => {
        plug.findFiles(globFiles).then(files => {
            files.forEach(file => plug.addDistFile(file.relativeName, file.content));
            resolve();
        });
    }));
}