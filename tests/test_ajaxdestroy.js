import $ from 'jquery';
import {AjaxDestroy} from '../src/ajax.js';
import {spinner} from '../src/spinner.js';
import {ajax_destroy} from '../src/ajaxdestroy.js';

QUnit.module('treibstoff.ajaxdestroy', hooks => {
    let container;
    let ajax_orgin = $.ajax;

    hooks.beforeEach(() => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.afterEach(() => {
        container.remove();
        // Ajax binds popstate
        $(window).off('popstate');
        // Reset $.ajax patch if any
        $.ajax = ajax_orgin;
        // Force hide spinner
        spinner.hide(true);
    });

    QUnit.test('Test AjaxDestroy', assert => {
        class Inst {
            constructor() {
                this.destroyed = false;
            }
            destroy() {
                this.destroyed = true;
            }
        }

        let inst = new Inst();
        let elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        assert.deepEqual(inst.destroyed, false);
        let parser = new AjaxDestroy();
        assert.strictEqual(window.bootstrap, undefined);
        assert.strictEqual(parser.callbacks.length, 0);
        parser.walk(container[0]);
        assert.deepEqual(inst.destroyed, true);
    });

    QUnit.test('Test AjaxDestroy bootstrap callback', assert => {
        class Inst {
            constructor() {
                this.destroyed = false;
            }
            destroy() {
                this.destroyed = true;
            }
        }

        // bootstrap callback - patch window.bootstrap
        window.bootstrap = {
            Dropdown: {
                getInstance: function() {assert.step('get Dropdown instance')}
            },
            Tooltip: {
                getInstance: function() {assert.step('get Tooltip instance')}
            }
        }
        let inst = new Inst();
        let elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        assert.deepEqual(inst.destroyed, false);
        let parser = new AjaxDestroy();
        assert.strictEqual(parser.callbacks.length, 1);
        parser.walk(elem[0]);
        assert.deepEqual(inst.destroyed, true);

        assert.verifySteps(['get Dropdown instance', 'get Tooltip instance']);
        window.bootstrap = undefined;
    });

    QUnit.test('Test AjaxDestroy custom callbacks', assert => {
        class Inst {
            constructor() {
                // ...
            }
            destroy() {
                assert.step('destroy');
            }
        }
        let inst = new Inst();
        let elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        // custom callback 1
        function custom_callback1(node) {
            assert.step('custom1');
        }
        // custom callback 2
        function custom_callback2(node) {
            assert.step('custom2');
        }

        // vanilla destroy
        let parser = new AjaxDestroy();
        assert.strictEqual(parser.callbacks.length, 0);
        parser.walk(elem[0]);
        assert.verifySteps(['destroy']);

        // register callbacks
        elem[0]._ajax_attached = [inst]; // reattach instance
        parser.register_cb(custom_callback1);
        parser.register_cb(custom_callback2);
        assert.strictEqual(parser.callbacks.length, 2);
        parser.walk(elem[0]);
        assert.verifySteps(['destroy', 'custom1', 'custom2']);

        // unregister cb 1
        elem[0]._ajax_attached = [inst]; // reattach instance
        parser.unregister_cb(custom_callback1);
        assert.strictEqual(parser.callbacks.length, 1);
        parser.walk(elem[0]);
        assert.verifySteps(['destroy', 'custom2']);

        // unregister cb 2
        elem[0]._ajax_attached = [inst]; // reattach instance
        parser.unregister_cb(custom_callback2);
        assert.strictEqual(parser.callbacks.length, 0);
        parser.walk(elem[0]);
        assert.verifySteps(['destroy']);
    });

    QUnit.test('Test AjaxDestroy utility', assert => {
        class Inst {
            constructor() {
                // ...
            }
            destroy() {
                assert.step('destroy');
            }
        }
        let inst = new Inst();
        let elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        // custom callback 1
        function custom_callback1(node) {
            assert.step('custom1');
        }
        // custom callback 2
        function custom_callback2(node) {
            assert.step('custom2');
        }

        // vanilla destroy
        ajax_destroy(elem);
        assert.verifySteps(['destroy']);

        // register callbacks
        elem[0]._ajax_attached = [inst]; // reattach instance
        ajax_destroy(elem, [custom_callback1, custom_callback2]);
        assert.verifySteps(['destroy', 'custom1', 'custom2']);
    });
});
