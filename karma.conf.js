// chromium binary
process.env.CHROME_BIN = '/usr/bin/chromium';

// relative resource paths
let src_files = '../src';
let test_files = '../tests';

// files to include in test run
let files = [
    {pattern: `${src_files}/*.js`, type: 'module', included: false},
    {pattern: `${test_files}/test_*.js`, type: 'module'}
];

// files to include for test coverage
let preprocessors = {};
preprocessors[`${src_files}/ajax.js`] = 'coverage';

module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: ['qunit'],
        files: files,
        browsers: ['ChromeHeadless'],
        singlerun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: preprocessors
    });
};
