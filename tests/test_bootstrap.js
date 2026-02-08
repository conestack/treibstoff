import $ from 'jquery';
import {AjaxDestroy} from '../src/ssr/destroy.js';

QUnit.module('treibstoff.bootstrap', hooks => {
    let container;

    hooks.beforeEach(() => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('Test bootstrap destroy handle registration', async assert => {
        // Mock window.bootstrap BEFORE importing the module.
        // bootstrap.js registers destroy_bootstrap via jQuery ready callback
        // only when window.bootstrap is defined.
        window.bootstrap = {
            Dropdown: {
                getInstance: function() { return null; }
            },
            Tooltip: {
                getInstance: function() { return null; }
            }
        };

        // Dynamic import triggers module execution and jQuery ready callback
        await import('../src/bootstrap.js');
        // Ensure jQuery ready callback has fired
        await new Promise(resolve => $(resolve));

        // Walk a node — destroy_bootstrap should be called without error
        // even when getInstance returns null
        let elem = $('<span />').appendTo(container);
        let parser = new AjaxDestroy();
        parser.walk(container[0]);

        assert.ok(true, 'destroy_bootstrap registered and executed without error');
    });

    QUnit.test('Test bootstrap dropdown disposal', assert => {
        // destroy_bootstrap is already registered from previous test.
        // It reads window.bootstrap at call time.
        let disposed = false;
        window.bootstrap = {
            Dropdown: {
                getInstance: function(node) {
                    return {
                        dispose: function() { disposed = true; }
                    };
                }
            },
            Tooltip: {
                getInstance: function() { return null; }
            }
        };

        let elem = $('<span />').appendTo(container);
        let parser = new AjaxDestroy();
        parser.walk(container[0]);

        assert.true(disposed, 'Dropdown.dispose() was called');
    });

    QUnit.test('Test bootstrap tooltip disposal', assert => {
        let disposed = false;
        window.bootstrap = {
            Dropdown: {
                getInstance: function() { return null; }
            },
            Tooltip: {
                getInstance: function(node) {
                    return {
                        dispose: function() { disposed = true; }
                    };
                }
            }
        };

        let elem = $('<span />').appendTo(container);
        let parser = new AjaxDestroy();
        parser.walk(container[0]);

        assert.true(disposed, 'Tooltip.dispose() was called');
    });

    QUnit.test('Test bootstrap both dropdown and tooltip disposal', assert => {
        let dd_disposed = false;
        let tt_disposed = false;
        window.bootstrap = {
            Dropdown: {
                getInstance: function(node) {
                    return {
                        dispose: function() { dd_disposed = true; }
                    };
                }
            },
            Tooltip: {
                getInstance: function(node) {
                    return {
                        dispose: function() { tt_disposed = true; }
                    };
                }
            }
        };

        let elem = $('<span />').appendTo(container);
        let parser = new AjaxDestroy();
        parser.walk(container[0]);

        assert.true(dd_disposed, 'Dropdown.dispose() was called');
        assert.true(tt_disposed, 'Tooltip.dispose() was called');
    });
});
