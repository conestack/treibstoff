import $ from 'jquery';
import { spinner } from '../src/spinner.js';
import {
    AjaxDestroy,
    ajax_destroy,
    register_ajax_destroy_handle,
    unregister_ajax_destroy_handle,
} from '../src/ssr/destroy.js';

QUnit.module('treibstoff.ajaxdestroy', (hooks) => {
    let container;
    const ajax_orgin = $.ajax;

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

    QUnit.test('Test AjaxDestroy', (assert) => {
        class Inst {
            constructor() {
                this.destroyed = false;
            }
            destroy() {
                this.destroyed = true;
            }
        }

        const inst = new Inst();
        const elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        assert.deepEqual(inst.destroyed, false);
        const parser = new AjaxDestroy();
        assert.strictEqual(window.bootstrap, undefined);
        parser.walk(container[0]);
        assert.deepEqual(inst.destroyed, true);
    });

    QUnit.test.skip('Test AjaxDestroy bootstrap callback', (assert) => {
        // XXX: window.bootstrap must be defined initally.
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
                getInstance: () => {
                    assert.step('get Dropdown instance');
                },
            },
            Tooltip: {
                getInstance: () => {
                    assert.step('get Tooltip instance');
                },
            },
        };
        const inst = new Inst();
        const elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        assert.deepEqual(inst.destroyed, false);
        const parser = new AjaxDestroy();
        parser.walk(elem[0]);
        assert.deepEqual(inst.destroyed, true);

        assert.verifySteps(['get Dropdown instance', 'get Tooltip instance']);
        window.bootstrap = undefined;
    });

    QUnit.test('Test AjaxDestroy custom callbacks', (assert) => {
        class Inst {
            destroy() {
                assert.step('destroy');
            }
        }
        const inst = new Inst();
        const elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        // custom callback 1
        function custom_callback1(_node) {
            assert.step('custom1');
        }
        // custom callback 2
        function custom_callback2(_node) {
            assert.step('custom2');
        }

        // vanilla destroy
        const parser = new AjaxDestroy();
        parser.walk(elem[0]);
        assert.verifySteps(['destroy']);

        // register callbacks
        elem[0]._ajax_attached = [inst]; // reattach instance
        register_ajax_destroy_handle(custom_callback1);
        register_ajax_destroy_handle(custom_callback2);
        parser.walk(elem[0]);
        assert.verifySteps(['destroy', 'custom1', 'custom2']);
        // unregister callbacks
        elem[0]._ajax_attached = [inst]; // reattach instance
        unregister_ajax_destroy_handle(custom_callback1);
        unregister_ajax_destroy_handle(custom_callback2);
        parser.walk(elem[0]);
        assert.verifySteps(['destroy']);
    });

    QUnit.test('Test AjaxDestroy no destroy method warning', (assert) => {
        const warn_origin = console.warn;
        let warn_msg;
        console.warn = (msg) => {
            warn_msg = msg;
        };

        const inst = { constructor: { name: 'NoDestroyInst' } };
        const elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        const parser = new AjaxDestroy();
        parser.walk(elem[0]);
        assert.ok(warn_msg.indexOf('NoDestroyInst') > -1, 'Warning mentions class name');
        console.warn = warn_origin;
    });

    QUnit.test('Test register duplicate handle warning', (assert) => {
        const warn_origin = console.warn;
        let warn_msg;
        console.warn = (msg) => {
            warn_msg = msg;
        };

        function my_callback(_node) {}
        register_ajax_destroy_handle(my_callback);
        register_ajax_destroy_handle(my_callback); // duplicate
        assert.ok(
            warn_msg.indexOf('already registered') > -1,
            'Warning about duplicate registration',
        );

        // Clean up
        unregister_ajax_destroy_handle(my_callback);
        console.warn = warn_origin;
    });

    QUnit.test('Test unregister non-registered handle warning', (assert) => {
        const warn_origin = console.warn;
        let warn_msg;
        console.warn = (msg) => {
            warn_msg = msg;
        };

        function unknown_callback(_node) {}
        unregister_ajax_destroy_handle(unknown_callback);
        assert.ok(warn_msg.indexOf('not registered') > -1, 'Warning about non-registered callback');

        console.warn = warn_origin;
    });

    QUnit.test('Test AjaxDestroy utility', (assert) => {
        class Inst {
            destroy() {
                assert.step('destroy');
            }
        }
        const inst = new Inst();
        const elem = $('<span />').appendTo(container);
        elem[0]._ajax_attached = [inst];

        // custom callback 1
        function custom_callback1(_node) {
            assert.step('custom1');
        }
        // custom callback 2
        function custom_callback2(_node) {
            assert.step('custom2');
        }

        // vanilla destroy
        ajax_destroy(elem);
        assert.verifySteps(['destroy']);

        // register callbacks
        elem[0]._ajax_attached = [inst]; // reattach instance
        register_ajax_destroy_handle(custom_callback1);
        register_ajax_destroy_handle(custom_callback2);
        ajax_destroy(elem);
        assert.verifySteps(['destroy', 'custom1', 'custom2']);
        // unregister callbacks
        elem[0]._ajax_attached = [inst]; // reattach instance
        unregister_ajax_destroy_handle(custom_callback1);
        unregister_ajax_destroy_handle(custom_callback2);
        ajax_destroy(elem);
        assert.verifySteps(['destroy']);
    });
});
