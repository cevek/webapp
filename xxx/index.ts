import {Packer} from './packer';
import {/*scss, postcss, combineJS, combineCSS, hash, jade, dest, */ts} from './plugs';
new Packer({context: __dirname + '/../src/'}, promise => promise
        .then(ts(null, ['-p', __dirname + '/../tsconfig.json']))
    /* .then(scss())
     .then(postcss())
     .then(combineJS('dist/vendor.js', ['react', 'mobx']))
     .then(combineCSS('dist/style.css'))
     .then(hash())
     .then(jade())
     .then(dest())*/
).process().then(() => {
    
}, (err) => {
    console.error(err)
});
