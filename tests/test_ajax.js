import {ajax} from '../src/treibstoff.js';


QUnit.module('treibstoff.ajax', hooks => {

    QUnit.test('dummy', assert => {
        assert.ok(ajax !== undefined);
    });
});

