import Events from '../src/events.js';
import Property from '../src/properties.js';

QUnit.module('treibstoff.events', hooks => {

    QUnit.test('Test Events', assert => {
        let res;
        let ob = new Events();
        assert.deepEqual(Object.keys(ob._subscribers), [], 'No subscribers yet');

        ob.default = function(opts) {
            res = opts;
        }
        ob.trigger('default', 'opts');
        assert.strictEqual(res, 'opts', 'Default subscriber called');

        let subscriber = function(opts) {
            res = 'subscriber';
        }
        ob.on('evt', subscriber);
        ob.trigger('evt');
        assert.strictEqual(res, 'subscriber', 'Subscriber for evt called');

        assert.deepEqual(
            Object.keys(ob._subscribers),
            ['evt'],
            'Object contains one subscriber'
        );
        assert.strictEqual(
            ob._contains_subscriber('evt', subscriber),
            true,
            'Object contains specific subscriber for evt'
        );

        let other_subscriber = function(opts) {
        }
        assert.strictEqual(
            ob._contains_subscriber('evt', other_subscriber),
            false,
            'Other subscriber not registered for evt on object'
        );

        ob.on('evt', other_subscriber);
        assert.strictEqual(
            ob._subscribers.evt.length,
            2,
            'Object contains two subscribers for the same event'
        );
        ob.off('evt', other_subscriber);
        assert.strictEqual(
            ob._subscribers.evt.length,
            1,
            'Dedicated subscriber for evt unregistered'
        );
        ob.off('evt');
        assert.strictEqual(
            ob._subscribers.evt,
            undefined,
            'All subscribers for evt unregistered'
        );

        class Klass extends Events {
            constructor() {
                super();
                new Property(this, 'flag');
                this.on_flag_called = false;
            }
            on_flag(val) {
                this.on_flag_called = true;
            }
            do_suppressed() {
                this.suppress_events(() => {
                    this.flag = true;
                });
            }
            do_unsuppressed() {
                this.flag = true;
            }
        }
        ob = new Klass();
        ob.do_suppressed();
        assert.strictEqual(ob.flag, true, 'Flag was set properly');
        assert.strictEqual(ob.on_flag_called, false, 'Event suppressed');

        ob = new Klass();
        ob.do_unsuppressed();
        assert.strictEqual(ob.flag, true, 'Flag was set properly');
        assert.strictEqual(ob.on_flag_called, true, 'Event triggered');
    });

});
