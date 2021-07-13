import $ from 'jquery';
import {KeyState} from '../src/keystate.js';


QUnit.module('treibstoff.keystate', hooks => {

    QUnit.test('Test KeyState', assert => {
        let ks = new KeyState();
        assert.strictEqual(ks.ctrl, false, 'Control key released');

        $(window).trigger($.Event('keydown', {keyCode: 17}));
        assert.strictEqual(ks.ctrl, true, 'Control key pressed');

        $(window).trigger($.Event('keyup', {keyCode: 17}));
        assert.strictEqual(ks.ctrl, false, 'Control key released');

        let res;
        let keydown = function(inst, evt) {
            res = evt.keyCode;
        }
        ks.on('keydown', keydown);
        $(window).trigger($.Event('keydown', {keyCode: 18}));
        assert.strictEqual(res, 18, 'Keydown subscriber called');

        let keyup = function(inst, evt) {
            res = evt.keyCode;
        }
        ks.on('keyup', keyup);
        $(window).trigger($.Event('keyup', {keyCode: 27}));
        assert.strictEqual(res, 27, 'Keyup subscriber called');

        res = undefined;
        ks.filter_keyevent = function(evt) {
            return evt.keyCode === 18;
        }
        $(window).trigger($.Event('keydown', {keyCode: 18}));
        assert.strictEqual(
            res,
            undefined,
            'Keydown event filtered by filter_keyevent callback'
        );

        $(window).trigger($.Event('keydown', {keyCode: 19}));
        assert.strictEqual(
            res,
            19,
            'Keydown event not filtered by filter_keyevent callback'
        );
    });

});
