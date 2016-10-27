import {JSScanner} from '../utils/jsParser/jsScanner';
import {plugin} from '../packer';

export function scanner() {
    return plugin(async plug => {
        const jsScanner = new JSScanner(plug);
        for (let i = 0; i < plug.jsEntries.length; i++) {
            const file = plug.jsEntries[i];
            await jsScanner.scan(file, file.dirname);
        }
    });
}