import {terser} from 'rollup-plugin-terser';

const outro = `var old_ts = window.ts;

exports.noConflict = function() {
    window.ts = old_ts;
    return this;
}

window.ts = exports;`;

export default {
    input: 'src/treibstoff.js',
    output: [{
        file: 'treibstoff/treibstoff.bundle.js',
        format: 'iife',
        name: 'ts',
        outro: outro,
        globals: {
            jquery: 'jQuery'
        },
        interop: 'default'
    }, {
        file: 'treibstoff/treibstoff.bundle.min.js',
        format: 'iife',
        name: 'ts',
        plugins: [
            terser()
        ],
        outro: outro,
        globals: {
            jquery: 'jQuery'
        },
        interop: 'default'
    }],
    external: [
        'jquery'
    ],
};
