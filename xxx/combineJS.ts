import {plugin} from './packer';
import {combine} from './combine';

export function combineJS(outfile: string) {
    return plugin(plug => new Promise((resolve, reject) => {
        plug.findFiles('**/*.js').then(files => {
            combine(plug.normalizeName(outfile), plug, files, '', '', resolve);
        });
    }));
}