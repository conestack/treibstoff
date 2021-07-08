var ts = (function (exports) {
    'use strict';

    class Ajax {

        constructor() {
            console.log('Hello Ajax');
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

}({}));
//# sourceMappingURL=treibstoff.bundle.js.map
