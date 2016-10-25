import {plugin, Glob} from '../packer';

export function copy(globFiles: Glob) {
    return plugin(async plug => {
        const files = await plug.findFiles(globFiles);
        files.forEach(file =>
            plug.addDistFile(file.relativeName, file.content));
    });
}