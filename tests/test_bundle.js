import $ from 'jquery';
import * as bundle from '../src/bundle.js';
import { ajax } from '../src/ssr/ajax.js';
import ts from '../src/treibstoff.js';

QUnit.module('treibstoff.bundle', () => {
    QUnit.test('Test bundle exports', (assert) => {
        assert.deepEqual(Object.keys(bundle).sort(), Object.keys(ts).sort());
    });

    QUnit.test('Test bundle binds document on ready', async (assert) => {
        await new Promise((resolve) => $(resolve));
        assert.true(ajax._is_bound);
    });
});
