import {plugin} from './packer';
import {combine} from './combine';

export function combineJS(outfile: string) {
    return plugin(plug => new Promise((resolve, reject) => {
        const files = plug.list.filter(file => file.ext == 'js');
        if (files.length) {
            combine(outfile, plug, files, '__packer(function(requere, module, exports) {\n', '\n}\n', resolve);
        } else {
            plug.log('Nothing to combine js')
        }
    }));
}