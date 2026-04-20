import { clock } from '../src/clock.js';

QUnit.module('treibstoff.clock', (_hooks) => {
    QUnit.test('Test schedule_frame', (assert) => {
        const done = assert.async();
        const callback = (_timestamp, arg1, arg2) => {
            assert.strictEqual(arg1, 'arg1');
            assert.strictEqual(arg2, 'arg2');
            done();
        };
        clock.schedule_frame(callback, 'arg1', 'arg2');

        const evt = clock.schedule_frame(() => {});
        assert.true(evt._request_id !== null);
        evt.cancel();
        assert.true(evt._request_id === null);
    });

    QUnit.test('Test schedule_timeout', (assert) => {
        const done = assert.async();
        const callback = (_timestamp, arg1, arg2) => {
            assert.strictEqual(arg1, 'arg1');
            assert.strictEqual(arg2, 'arg2');
            done();
        };
        clock.schedule_timeout(callback, 1, 'arg1', 'arg2');

        const evt = clock.schedule_timeout(() => {}, 1);
        assert.true(evt._timeout_id !== null);
        evt.cancel();
        assert.true(evt._timeout_id === null);
    });

    QUnit.test('Test schedule_interval', (assert) => {
        let called = 0;
        const done = assert.async();
        const callback = (_timestamp, event, arg1, arg2) => {
            called += 1;
            assert.strictEqual(arg1, 'arg1');
            assert.strictEqual(arg2, 'arg2');
            if (called === 2) {
                event.cancel();
                done();
            }
        };
        clock.schedule_interval(callback, 1, 'arg1', 'arg2');

        const evt = clock.schedule_interval(() => {}, 1);
        assert.true(evt._interval_id !== null);
        evt.cancel();
        assert.true(evt._interval_id === null);
    });
});
