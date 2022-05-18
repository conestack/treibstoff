import {Events} from '../src/events.js';
import {Property} from '../src/properties.js';

QUnit.module('treibstoff.events', hooks => {

    QUnit.test('Test Events', assert => {
        let res;
        let ob = new Events();
        // No subscribers yet
        assert.deepEqual(Object.keys(ob._subscribers), []);

        ob.default = function(opts) {
            res = opts;
        }
        ob.trigger('default', 'opts');
        // Default subscriber called
        assert.strictEqual(res, 'opts');

        let subscriber = function(opts) {
            res = 'subscriber';
        }
        ob.on('evt', subscriber);
        ob.trigger('evt');
        // Subscriber for evt called
        assert.strictEqual(res, 'subscriber');

        // Object contains one subscriber
        assert.deepEqual(Object.keys(ob._subscribers), ['evt']);
        // Object contains specific subscriber for evt
        assert.strictEqual(ob._contains_subscriber('evt', subscriber), true);

        let other_subscriber = function(opts) {}
        // Other subscriber not registered for evt on object
        assert.strictEqual(
            ob._contains_subscriber('evt', other_subscriber),
            false
        );

        ob.on('evt', other_subscriber);
        // Object contains two subscribers for the same event
        assert.strictEqual(ob._subscribers.evt.length, 2);
        ob.off('evt', other_subscriber);
        // Dedicated subscriber for evt unregistered
        assert.strictEqual(ob._subscribers.evt.length, 1);
        ob.off('evt');
        // All subscribers for evt unregistered
        assert.strictEqual(ob._subscribers.evt, undefined);

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
        // Flag was set properly
        assert.strictEqual(ob.flag, true);
        // Event suppressed
        assert.strictEqual(ob.on_flag_called, false);

        ob = new Klass();
        ob.do_unsuppressed();
        // Flag was set properly
        assert.strictEqual(ob.flag, true);
        // Event triggered
        assert.strictEqual(ob.on_flag_called, true);
    });
});
