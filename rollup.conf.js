import {terser} from 'rollup-plugin-terser';

const outro = `var old_ts = window.ts;

exports.noConflict = function() {
    window.ts = old_ts;
    return this;
}

window.ts = exports;

// bdajax B/C
window.bdajax = exports.ajax;
$.fn.bdajax = $.fn.tsajax;
`;

export default {
    input: 'src/treibstoff.js',
    output: [
        {
            file: 'treibstoff/static/treibstoff.bundle.js',
            format: 'iife',
            name: 'ts',
            outro: outro,
            globals: {
                jquery: 'jQuery'
            },
            interop: 'default',
            sourcemap: true,
            sourcemapExcludeSources: true
        },
        // {
        //     file: 'treibstoff/static/treibstoff.bundle.min.js',
        //     format: 'iife',
        //     name: 'ts',
        //     plugins: [
        //         terser()
        //     ],
        //     outro: outro,
        //     globals: {
        //         jquery: 'jQuery'
        //     },
        //     interop: 'default',
        //     sourcemap: true,
        //     sourcemapExcludeSources: true
        // }
    ],
    external: [
        'jquery'
    ],
};
