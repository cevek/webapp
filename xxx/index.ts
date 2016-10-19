import {Packer} from './packer';
import {ts} from './ts';
import {combineJS} from './combineJS';
import {dest} from './dest';
new Packer({context: __dirname + '/../src/'}, promise => promise
        .then(ts())
        .then(combineJS('dist/vendor.js'))
        .then(dest())
    /* .then(scss())
     .then(postcss())
     .then(combineJS('dist/vendor.js', ['react', 'mobx']))
     .then(combineCSS('dist/style.css'))
     .then(hash())
     .then(jade())
     .then(dest())*/
).process().then(() => {
    console.log("Done");
}, (err) => {
    console.error(err.stack)
});
