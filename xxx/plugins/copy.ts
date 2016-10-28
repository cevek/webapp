import {plugin} from '../packer';
import {Glob} from '../utils/fs';

export function copy(globFiles: Glob) {
    return plugin('copy', async plug => {
        const files = await plug.findFiles(globFiles);
        files.forEach(file =>
            plug.addDistFile(file.fullName, file.content, file));
    });
}