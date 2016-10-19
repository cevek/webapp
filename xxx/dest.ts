import {plugin} from './packer';

export function dest() {
    return plugin(plug => new Promise((resolve, reject) => {
        Promise.all(plug.getChangedFSFiles().map(file => file.writeFileToFS()))
            .then(resolve, reject);
    }));
}