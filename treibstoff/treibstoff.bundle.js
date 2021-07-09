var ts = (function (exports, $) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var $__default = /*#__PURE__*/_interopDefaultLegacy($);

    class Ajax {

        constructor() {
            console.log('Hello Ajax');
            console.log($__default['default']('<div></div>'));
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
