import $ from 'jquery';
import { spinner } from '../src/spinner.js';

QUnit.module('treibstoff.spinner', (_hooks) => {
    QUnit.test('Test LoadingSpinner', (assert) => {
        const body = $('body');
        assert.strictEqual($('#t-loading-spinner', body).length, 0);
        assert.strictEqual(spinner._count, 0);

        spinner.show();
        assert.strictEqual($('#t-loading-spinner', body).length, 1);
        assert.strictEqual(spinner._count, 1);

        spinner.show();
        assert.strictEqual($('#t-loading-spinner', body).length, 1);
        assert.strictEqual(spinner._count, 2);

        spinner.hide();
        assert.strictEqual($('#t-loading-spinner', body).length, 1);
        assert.strictEqual(spinner._count, 1);

        spinner.hide();
        assert.strictEqual($('#t-loading-spinner', body).length, 0);
        assert.strictEqual(spinner._count, 0);

        spinner.show();
        spinner.show();
        assert.strictEqual($('#t-loading-spinner', body).length, 1);
        assert.strictEqual(spinner._count, 2);

        spinner.hide(true);
        assert.strictEqual($('#t-loading-spinner', body).length, 0);
        assert.strictEqual(spinner._count, 0);
    });
});
