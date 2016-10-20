import {plugin} from './packer';
import {combine} from './combine';

export function combineCSS(outfile: string) {
    return plugin(plug => new Promise((resolve, reject) => {
        const files = plug.list.filter(file => file.ext == 'css');
        if (files.length) {
            combine(outfile, plug, files, '', '\n', resolve);
        } else {
            plug.log('Nothing to combine css');
        }
    }));
}