var ts = (function (exports, $) {
    'use strict';

    class Ajax {

        constructor() {
            console.log('Hello Ajax');
            console.log($);
        }
    }

    exports.Ajax = Ajax;

    Object.defineProperty(exports, '__esModule', { value: true });

    var old_ts = window.ts;

    exports.noConflict = function() {
        window.ts = old_ts;
        return this;
    }

    window.ts = exports;

    return exports;

}({}, jQuery));
