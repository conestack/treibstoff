import {Ajax} from '../src/treibstoff.js';

QUnit.module('treibstoff.ajax', hooks => {

    hooks.before(() => {
        console.log('Set up treibstoff.ajax tests');
    });

    hooks.after(() => {
        console.log('Tear down treibstoff.ajax tests');
    });

    QUnit.module('stub', hooks => {

        hooks.before(assert => {
            console.log('Set up treibstoff.ajax stub tests');
        });

        hooks.after(() => {
            console.log('Tear down treibstoff.ajax stub tests');
        });

        QUnit.test('dummy', assert => {
            assert.ok(new Ajax() instanceof Ajax);
        });
    });
});
