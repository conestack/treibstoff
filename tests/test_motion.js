import $ from 'jquery';
import {Motion} from '../src/motion.js';

QUnit.module('treibstoff.motion', hooks => {

    QUnit.test('Test Motion', assert => {
        let m = new Motion();

        assert.strictEqual(m._down_handle, null, 'No down handle');
        assert.strictEqual(m._down_scope, null, 'No down scope');
        assert.strictEqual(m._move_scope, null, 'No move scope');

        assert.strictEqual(m._move_handle, undefined, 'Move handle undefined');
        assert.strictEqual(m._up_handle, undefined, 'Up handle undefined');
        assert.strictEqual(m._prev_pos, undefined, 'Prev position undefined');
        assert.strictEqual(m._motion, undefined, 'Motion undefined');

        let down_scope = $('<span />');
        let move_scope = $('<span />');
        m.set_scope(down_scope, move_scope);

        assert.strictEqual(m._move_handle, null, 'No move handle');
        assert.strictEqual(m._up_handle, null, 'No up handle');
        assert.strictEqual(m._prev_pos, null, 'No prev position');
        assert.strictEqual(m._motion, null, 'No motion');

        assert.strictEqual(m._down_handle.name, 'bound _mousedown', 'Down handle set');
        assert.strictEqual(Object.is(m._down_scope, down_scope), true, 'Down scope set');
        assert.strictEqual(Object.is(m._move_scope, move_scope), true, 'Move scope set');

        let down_evt, down = function(inst, evt) {
            down_evt = evt;
        }
        m.on('down', down);
        let evt = $.Event('mousedown', {pageX: 0, pageY: 0});
        $(down_scope).trigger(evt);

        assert.strictEqual(Object.is(evt, down_evt), true, 'Down subscriber called');
        assert.strictEqual(m._move_handle.name, 'bound _mousemove', 'Move handle set');
        assert.strictEqual(m._up_handle.name, 'bound _mouseup', 'Up handle set');
        assert.strictEqual(m._prev_pos.x, 0, 'Prev position set');
        assert.strictEqual(m._motion, false, 'Motion is false');

        let move_evt, move_ppos, move = function(inst, evt) {
            move_evt = evt;
            move_ppos = {
                x: evt.prev_pos.x,
                y: evt.prev_pos.y,
            };
        }
        m.on('move', move);
        evt = $.Event('mousemove', {pageX: 1, pageY: 1});
        $(move_scope).trigger(evt);

        assert.strictEqual(Object.is(evt, move_evt), true, 'Move subscriber called');
        assert.strictEqual(m._motion, true, 'Motion is true');
        assert.strictEqual(move_evt.motion, true, 'Motion is set on event');
        assert.strictEqual(move_ppos.x, 0, 'Prev position is set on event');
        assert.strictEqual(m._prev_pos.x, 1, 'New prev position is set on instance');

        let up_evt, up_motion, up = function(inst, evt) {
            up_evt = evt;
            up_motion = evt.motion;
        }
        m.on('up', up);
        evt = $.Event('mouseup', {pageX: 2, pageY: 2});
        $(document).trigger(evt);

        assert.strictEqual(Object.is(evt, up_evt), true, 'Up subscriber called');
        assert.strictEqual(up_motion, true, 'Motion is set on event');
        assert.strictEqual(m._move_handle, null, 'Move handle reset');
        assert.strictEqual(m._up_handle, null, 'Up handle reset');
        assert.strictEqual(m._prev_pos, null, 'Prev position reset');
        assert.strictEqual(m._motion, null, 'Motion reset');
    });

});
