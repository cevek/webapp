import {plugin} from '../packer';
import {combine} from '../utils/combine';

export function combineCSS(outfile: string) {
    return plugin(async plug => {
        const files = plug.list.filter(file => file.ext == 'css');
        if (files.length) {
            await combine('', '', outfile, plug, files, () => '', () => '\n');
        } else {
            plug.log('Nothing to combine css');
        }
    });
}