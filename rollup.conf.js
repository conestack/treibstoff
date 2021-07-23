import cleanup from 'rollup-plugin-cleanup';
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

export default args => {
    let conf = {
        input: 'src/treibstoff.js',
        plugins: [
            cleanup()
        ],
        output: [{
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
        }],
        external: [
            'jquery'
        ]
    };
    if (args.configDebug !== true) {
        conf.output.push({
            file: 'treibstoff/static/treibstoff.bundle.min.js',
            format: 'iife',
            name: 'ts',
            plugins: [
                terser()
            ],
            outro: outro,
            globals: {
                jquery: 'jQuery'
            },
            interop: 'default',
            sourcemap: true,
            sourcemapExcludeSources: true
        });
    }
    return conf;
};
