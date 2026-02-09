import $ from 'jquery';
import { Motion } from '../src/motion.js';

QUnit.module('treibstoff.motion', (_hooks) => {
    QUnit.test('Test Motion set_scope while handling throws', (assert) => {
        const m = new Motion();
        const down_scope = $('<span />');
        m.set_scope(down_scope);

        // Simulate mousedown to set _up_handle
        const evt = $.Event('mousedown', { pageX: 0, pageY: 0 });
        $(down_scope).trigger(evt);
        assert.ok(m._up_handle !== null, 'Up handle is set');

        // Attempt to set_scope while handling should throw
        assert.throws(() => {
            m.set_scope($('<span />'));
        }, 'Attempt to set motion scope while handling');

        // Clean up — trigger mouseup to release the handler
        $(document).trigger($.Event('mouseup', { pageX: 0, pageY: 0 }));
    });

    QUnit.test('Test Motion set_scope rebind previous', (assert) => {
        const m = new Motion();
        const scope1 = $('<span />');
        const scope2 = $('<span />');

        m.set_scope(scope1);
        const first_handle = m._down_handle;
        assert.ok(first_handle, 'First down handle set');

        // Set scope again — should unbind from scope1 and bind to scope2
        m.set_scope(scope2);
        assert.notStrictEqual(m._down_handle, first_handle, 'New down handle created');

        // Verify scope1 no longer triggers
        let triggered = false;
        m.on('down', () => {
            triggered = true;
        });
        $(scope1).trigger($.Event('mousedown', { pageX: 0, pageY: 0 }));
        assert.false(triggered, 'Old scope no longer triggers events');

        // Verify scope2 triggers
        $(scope2).trigger($.Event('mousedown', { pageX: 0, pageY: 0 }));
        assert.true(triggered, 'New scope triggers events');

        // Clean up
        $(document).trigger($.Event('mouseup', { pageX: 0, pageY: 0 }));
    });

    QUnit.test('Test Motion', (assert) => {
        const m = new Motion();

        assert.strictEqual(m._down_handle, null, 'No down handle');
        assert.strictEqual(m._down_scope, null, 'No down scope');
        assert.strictEqual(m._move_scope, null, 'No move scope');

        assert.strictEqual(m._move_handle, undefined, 'Move handle undefined');
        assert.strictEqual(m._up_handle, undefined, 'Up handle undefined');
        assert.strictEqual(m._prev_pos, undefined, 'Prev position undefined');
        assert.strictEqual(m._motion, undefined, 'Motion undefined');

        const down_scope = $('<span />');
        const move_scope = $('<span />');
        m.set_scope(down_scope, move_scope);

        assert.strictEqual(m._move_handle, null, 'No move handle');
        assert.strictEqual(m._up_handle, null, 'No up handle');
        assert.strictEqual(m._prev_pos, null, 'No prev position');
        assert.strictEqual(m._motion, null, 'No motion');

        assert.strictEqual(m._down_handle.name, 'bound _mousedown', 'Down handle set');
        assert.strictEqual(Object.is(m._down_scope, down_scope), true, 'Down scope set');
        assert.strictEqual(Object.is(m._move_scope, move_scope), true, 'Move scope set');

        let down_evt,
            down = (_inst, evt) => {
                down_evt = evt;
            };
        m.on('down', down);
        let evt = $.Event('mousedown', { pageX: 0, pageY: 0 });
        $(down_scope).trigger(evt);

        assert.strictEqual(Object.is(evt, down_evt), true, 'Down subscriber called');
        assert.strictEqual(m._move_handle.name, 'bound _mousemove', 'Move handle set');
        assert.strictEqual(m._up_handle.name, 'bound _mouseup', 'Up handle set');
        assert.strictEqual(m._prev_pos.x, 0, 'Prev position set');
        assert.strictEqual(m._motion, false, 'Motion is false');

        let move_evt,
            move_ppos,
            move = (_inst, evt) => {
                move_evt = evt;
                move_ppos = {
                    x: evt.prev_pos.x,
                    y: evt.prev_pos.y,
                };
            };
        m.on('move', move);
        evt = $.Event('mousemove', { pageX: 1, pageY: 1 });
        $(move_scope).trigger(evt);

        assert.strictEqual(Object.is(evt, move_evt), true, 'Move subscriber called');
        assert.strictEqual(m._motion, true, 'Motion is true');
        assert.strictEqual(move_evt.motion, true, 'Motion is set on event');
        assert.strictEqual(move_ppos.x, 0, 'Prev position is set on event');
        assert.strictEqual(m._prev_pos.x, 1, 'New prev position is set on instance');

        let up_evt,
            up_motion,
            up = (_inst, evt) => {
                up_evt = evt;
                up_motion = evt.motion;
            };
        m.on('up', up);
        evt = $.Event('mouseup', { pageX: 2, pageY: 2 });
        $(document).trigger(evt);

        assert.strictEqual(Object.is(evt, up_evt), true, 'Up subscriber called');
        assert.strictEqual(up_motion, true, 'Motion is set on event');
        assert.strictEqual(m._move_handle, null, 'Move handle reset');
        assert.strictEqual(m._up_handle, null, 'Up handle reset');
        assert.strictEqual(m._prev_pos, null, 'Prev position reset');
        assert.strictEqual(m._motion, null, 'Motion reset');
    });
});
