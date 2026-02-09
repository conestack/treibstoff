import $ from 'jquery';
import {DnD} from '../src/dnd.js';

QUnit.module('treibstoff.dnd', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div id="dnd-test-container">');
        $('body').append(container);
        DnD._drag_source = null;
    });

    hooks.afterEach(() => {
        container.remove();
        DnD._drag_source = null;
    });

    QUnit.module('set_scope', () => {

        QUnit.test('binds dragstart/dragend on drag element', assert => {
            let drag_elem = $('<div class="drag">');
            container.append(drag_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, null);

            assert.strictEqual(
                drag_elem.attr('draggable'), 'true',
                'draggable attribute set'
            );

            let events = [];
            dnd.on('dragstart', () => events.push('dragstart'));
            dnd.on('dragend', () => events.push('dragend'));

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.deepEqual(events, ['dragstart'], 'dragstart event triggered');

            drag_elem.trigger('dragend');
            assert.deepEqual(
                events, ['dragstart', 'dragend'],
                'dragend event triggered'
            );

            dnd.reset_scope();
            drag_elem.remove();
        });

        QUnit.test('binds dragover/dragleave/drop on drop element', assert => {
            let drop_elem = $('<div class="drop">');
            container.append(drop_elem);

            let dnd = new DnD();
            dnd.set_scope(null, drop_elem);

            let events = [];
            dnd.on('dragover', () => events.push('dragover'));
            dnd.on('dragleave', () => events.push('dragleave'));
            dnd.on('drop', () => events.push('drop'));

            drop_elem.trigger($.Event('dragover', {
                originalEvent: {preventDefault: () => {}}
            }));
            assert.deepEqual(events, ['dragover'], 'dragover triggered');

            drop_elem.trigger('dragleave');
            assert.deepEqual(
                events, ['dragover', 'dragleave'],
                'dragleave triggered'
            );

            drop_elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));
            assert.deepEqual(
                events, ['dragover', 'dragleave', 'drop'],
                'drop triggered'
            );

            dnd.reset_scope();
            drop_elem.remove();
        });

        QUnit.test('drag and drop on same element', assert => {
            let elem = $('<div>');
            container.append(elem);

            let dnd = new DnD();
            dnd.set_scope(elem, elem);

            let events = [];
            dnd.on('dragstart', () => events.push('dragstart'));
            dnd.on('dragover', () => events.push('dragover'));
            dnd.on('drop', () => events.push('drop'));
            dnd.on('dragend', () => events.push('dragend'));

            elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            elem.trigger($.Event('dragover', {
                originalEvent: {preventDefault: () => {}}
            }));
            elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));
            elem.trigger('dragend');

            assert.deepEqual(
                events,
                ['dragstart', 'dragover', 'drop', 'dragend'],
                'all events triggered on same element'
            );

            dnd.reset_scope();
            elem.remove();
        });

        QUnit.test('only drag scope (drop = null)', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, null);

            assert.strictEqual(
                drag_elem.attr('draggable'), 'true',
                'draggable set'
            );
            assert.strictEqual(dnd._drop_scope, null, 'no drop scope');

            let triggered = false;
            dnd.on('dragstart', () => triggered = true);

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.ok(triggered, 'dragstart fires without drop scope');

            dnd.reset_scope();
            drag_elem.remove();
        });

        QUnit.test('only drop scope (drag = null)', assert => {
            let drop_elem = $('<div>');
            container.append(drop_elem);

            let dnd = new DnD();
            dnd.set_scope(null, drop_elem);

            assert.strictEqual(dnd._drag_scope, null, 'no drag scope');

            let triggered = false;
            dnd.on('drop', () => triggered = true);

            drop_elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));
            assert.ok(triggered, 'drop fires without drag scope');

            dnd.reset_scope();
            drop_elem.remove();
        });
    });

    QUnit.module('reset_scope', () => {

        QUnit.test('unbinds all event handlers', assert => {
            let drag_elem = $('<div>');
            let drop_elem = $('<div>');
            container.append(drag_elem, drop_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, drop_elem);

            let events = [];
            dnd.on('dragstart', () => events.push('dragstart'));
            dnd.on('drop', () => events.push('drop'));

            dnd.reset_scope();

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            drop_elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));

            assert.deepEqual(events, [], 'no events after reset_scope');
            assert.strictEqual(dnd._drag_scope, null, 'drag scope cleared');
            assert.strictEqual(dnd._drop_scope, null, 'drop scope cleared');

            drag_elem.remove();
            drop_elem.remove();
        });

        QUnit.test('removes draggable attribute', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, null);
            assert.strictEqual(drag_elem.attr('draggable'), 'true');

            dnd.reset_scope();
            assert.strictEqual(
                drag_elem.attr('draggable'), undefined,
                'draggable attribute removed'
            );

            drag_elem.remove();
        });

        QUnit.test('safe to call without prior set_scope', assert => {
            let dnd = new DnD();
            dnd.reset_scope();
            assert.ok(true, 'no error thrown');
        });

        QUnit.test('set_scope calls reset_scope first', assert => {
            let drag_a = $('<div>');
            let drag_b = $('<div>');
            container.append(drag_a, drag_b);

            let dnd = new DnD();
            dnd.set_scope(drag_a, null);

            let events = [];
            dnd.on('dragstart', () => events.push('dragstart'));

            // set new scope — old bindings should be gone
            dnd.set_scope(drag_b, null);

            drag_a.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.deepEqual(events, [], 'old scope unbound');

            drag_b.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.deepEqual(events, ['dragstart'], 'new scope bound');

            dnd.reset_scope();
            drag_a.remove();
            drag_b.remove();
        });
    });

    QUnit.module('_drag_source', () => {

        QUnit.test('dragstart sets DnD._drag_source', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, null);

            assert.strictEqual(DnD._drag_source, null, 'initially null');

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.strictEqual(
                DnD._drag_source, dnd,
                'set to dnd instance on dragstart'
            );

            dnd.reset_scope();
            drag_elem.remove();
        });

        QUnit.test('dragend clears DnD._drag_source', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, null);

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.strictEqual(DnD._drag_source, dnd);

            drag_elem.trigger('dragend');
            assert.strictEqual(
                DnD._drag_source, null,
                'cleared on dragend'
            );

            dnd.reset_scope();
            drag_elem.remove();
        });

        QUnit.test('dragover evt.source references drag source', assert => {
            let drag_elem = $('<div>');
            let drop_elem = $('<div>');
            container.append(drag_elem, drop_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, drop_elem);

            let received_source = 'not_set';
            dnd.on('dragover', (inst, evt) => {
                received_source = evt.source;
            });

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));

            drop_elem.trigger($.Event('dragover', {
                originalEvent: {preventDefault: () => {}}
            }));

            assert.strictEqual(
                received_source, dnd,
                'evt.source is the drag source instance'
            );

            dnd.reset_scope();
            drag_elem.remove();
            drop_elem.remove();
        });

        QUnit.test('drop evt.source references drag source', assert => {
            let drag_elem = $('<div>');
            let drop_elem = $('<div>');
            container.append(drag_elem, drop_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, drop_elem);

            let received_source = 'not_set';
            dnd.on('drop', (inst, evt) => {
                received_source = evt.source;
            });

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));

            drop_elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));

            assert.strictEqual(
                received_source, dnd,
                'evt.source is the drag source instance'
            );

            dnd.reset_scope();
            drag_elem.remove();
            drop_elem.remove();
        });
    });

    QUnit.module('cross-instance', () => {

        QUnit.test('drag on instance A, drop on instance B', assert => {
            let drag_elem = $('<div class="item-a">');
            let drop_elem = $('<div class="item-b">');
            container.append(drag_elem, drop_elem);

            let dnd_a = new DnD();
            dnd_a.set_scope(drag_elem, null);

            let dnd_b = new DnD();
            dnd_b.set_scope(null, drop_elem);

            let drop_source = null;
            dnd_b.on('drop', (inst, evt) => {
                drop_source = evt.source;
            });

            // drag from A
            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.strictEqual(DnD._drag_source, dnd_a, 'source is A');

            // drop on B
            drop_elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));

            assert.strictEqual(
                drop_source, dnd_a,
                'evt.source on B is dnd_a'
            );

            dnd_a.reset_scope();
            dnd_b.reset_scope();
            drag_elem.remove();
            drop_elem.remove();
        });

        QUnit.test('dragover on B shows source from A', assert => {
            let drag_elem = $('<div>');
            let drop_elem = $('<div>');
            container.append(drag_elem, drop_elem);

            let dnd_a = new DnD();
            dnd_a.set_scope(drag_elem, null);

            let dnd_b = new DnD();
            dnd_b.set_scope(null, drop_elem);

            let over_source = null;
            dnd_b.on('dragover', (inst, evt) => {
                over_source = evt.source;
            });

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));

            drop_elem.trigger($.Event('dragover', {
                originalEvent: {preventDefault: () => {}}
            }));

            assert.strictEqual(
                over_source, dnd_a,
                'dragover evt.source on B references A'
            );

            dnd_a.reset_scope();
            dnd_b.reset_scope();
            drag_elem.remove();
            drop_elem.remove();
        });
    });

    QUnit.module('default handler methods', () => {

        QUnit.test('dragstart() method called as default handler', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            let called = false;
            dnd.dragstart = function(evt) {
                called = true;
            };
            dnd.set_scope(drag_elem, null);

            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {dataTransfer: {setData: () => {}}}
            }));
            assert.ok(called, 'dragstart() default handler called');

            dnd.reset_scope();
            drag_elem.remove();
        });

        QUnit.test('drop() method called as default handler', assert => {
            let drop_elem = $('<div>');
            container.append(drop_elem);

            let dnd = new DnD();
            let received_evt = null;
            dnd.drop = function(evt) {
                received_evt = evt;
            };
            dnd.set_scope(null, drop_elem);

            DnD._drag_source = dnd;
            drop_elem.trigger($.Event('drop', {
                originalEvent: {preventDefault: () => {}}
            }));

            assert.ok(received_evt !== null, 'drop() default handler called');
            assert.strictEqual(
                received_evt.source, dnd,
                'evt.source set before default handler'
            );

            dnd.reset_scope();
            drop_elem.remove();
        });

        QUnit.test('dragover() method called as default handler', assert => {
            let drop_elem = $('<div>');
            container.append(drop_elem);

            let dnd = new DnD();
            let called = false;
            dnd.dragover = function(evt) {
                called = true;
            };
            dnd.set_scope(null, drop_elem);

            drop_elem.trigger($.Event('dragover', {
                originalEvent: {preventDefault: () => {}}
            }));
            assert.ok(called, 'dragover() default handler called');

            dnd.reset_scope();
            drop_elem.remove();
        });

        QUnit.test('dragleave() method called as default handler', assert => {
            let drop_elem = $('<div>');
            container.append(drop_elem);

            let dnd = new DnD();
            let called = false;
            dnd.dragleave = function(evt) {
                called = true;
            };
            dnd.set_scope(null, drop_elem);

            drop_elem.trigger('dragleave');
            assert.ok(called, 'dragleave() default handler called');

            dnd.reset_scope();
            drop_elem.remove();
        });

        QUnit.test('dragend() method called as default handler', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            let called = false;
            dnd.dragend = function(evt) {
                called = true;
            };
            dnd.set_scope(drag_elem, null);

            drag_elem.trigger('dragend');
            assert.ok(called, 'dragend() default handler called');

            dnd.reset_scope();
            drag_elem.remove();
        });
    });

    QUnit.module('dataTransfer', () => {

        QUnit.test('dragstart sets empty dataTransfer for Firefox', assert => {
            let drag_elem = $('<div>');
            container.append(drag_elem);

            let dnd = new DnD();
            dnd.set_scope(drag_elem, null);

            let dt_calls = [];
            drag_elem.trigger($.Event('dragstart', {
                originalEvent: {
                    dataTransfer: {
                        setData: (type, val) => {
                            dt_calls.push({type, val});
                        }
                    }
                }
            }));

            assert.strictEqual(dt_calls.length, 1, 'setData called once');
            assert.strictEqual(dt_calls[0].type, 'text/plain', 'type is text/plain');
            assert.strictEqual(dt_calls[0].val, '', 'value is empty string');

            dnd.reset_scope();
            drag_elem.remove();
        });
    });
});
