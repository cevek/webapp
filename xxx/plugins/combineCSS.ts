import {plugin} from '../packer';
import {combine} from '../utils/combine';
import {logger} from '../utils/logger';

export function combineCSS(outfile: string) {
    return plugin(async plug => {
        const files = plug.list.filter(file => file.ext == 'css');
        if (files.length) {
            await combine('', '', outfile, plug, files, () => '', () => '\n');
        } else {
            logger.warning('Nothing to combine css');
        }
    });
}