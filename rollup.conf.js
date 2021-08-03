import cleanup from 'rollup-plugin-cleanup';
import {terser} from 'rollup-plugin-terser';

const outro = `
window.treibstoff = exports;

// bdajax B/C
window.bdajax = exports.ajax;
$.fn.bdajax = $.fn.tsajax;
`;

export default args => {
    let conf = {
        input: 'src/bundle.js',
        plugins: [
            cleanup()
        ],
        output: [{
            file: 'treibstoff/bundle/treibstoff.bundle.js',
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
            file: 'treibstoff/bundle/treibstoff.bundle.min.js',
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
