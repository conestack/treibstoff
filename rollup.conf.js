const outro = `var old_ts = window.ts;
exports.noConflict = function() {
    window.ts = old_ts;
    return this;
}
window.ts = exports;`;

export default {
    input: 'src/treibstoff.js',
    output: {
        file: 'treibstoff/treibstoff.bundle.js',
        name: 'ts',
        format: 'iife',
        outro: outro,
        sourcemap: true
    }
};
