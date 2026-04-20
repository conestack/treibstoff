import $ from 'jquery';
import { Events } from '../src/events.js';
import { ChangeListener, changeListener, clickListener, create_listener } from '../src/listener.js';

QUnit.module('treibstoff.listener', (_hooks) => {
    QUnit.test('Test listener constructor', (assert) => {
        try {
            create_listener('click', {});
        } catch (error) {
            assert.step(error);
        }
        assert.verifySteps(['Base class must be subclass of or Events']);

        const ClickListener = create_listener('click');
        class TestClickListener extends ClickListener {}

        try {
            new TestClickListener();
        } catch (error) {
            assert.step(error);
        }
        assert.verifySteps(['No element found']);

        try {
            new TestClickListener({});
        } catch (error) {
            assert.step(error);
        }
        assert.verifySteps(['No element found']);

        const elem = $('<div />');
        let listener = new TestClickListener({ elem: elem });
        assert.ok(elem === listener.elem);

        const clickListener = (Base) => create_listener('click', Base);
        class Superclass extends Events {
            constructor(opts) {
                super();
                this.elem = elem;
                assert.step(`Superclass called with expected ${opts.opt}`);
            }
        }
        class MixedInClickEventHandle extends clickListener(Superclass) {}

        listener = new MixedInClickEventHandle({ opt: 'option' });
        assert.verifySteps(['Superclass called with expected option']);
    });

    QUnit.test('Test listener as base class', (assert) => {
        const ClickListener = create_listener('click');
        class TestClickListener extends ClickListener {
            on_click(_evt) {
                assert.step('on_click triggered');
            }
        }

        const elem = $('<div />');
        const listener = new TestClickListener({ elem: elem });
        elem.trigger('click');
        assert.verifySteps(['on_click triggered']);

        listener.on('on_click', (_evt) => {
            assert.step('external on_click triggered');
        });
        elem.trigger('click');
        assert.verifySteps(['on_click triggered', 'external on_click triggered']);
    });

    QUnit.test('Test listener destroy', (assert) => {
        const ClickListener = create_listener('click');
        class TestClickListener extends ClickListener {
            on_click(_evt) {
                assert.step('on_click');
            }
        }

        const elem = $('<div />');
        const listener = new TestClickListener({ elem: elem });

        // Event fires before destroy
        elem.trigger('click');
        assert.verifySteps(['on_click']);

        // After destroy, event no longer fires
        listener.destroy();
        elem.trigger('click');
        assert.verifySteps([]);

        // Multiple destroy calls are safe (idempotent)
        listener.destroy();
        assert.ok(true, 'double destroy did not throw');
    });

    QUnit.test('Test ChangeListener', (assert) => {
        class TestChangeListener extends ChangeListener {
            on_change(_evt) {
                assert.step('on_change');
            }
        }

        const elem = $('<input type="text" />');
        const listener = new TestChangeListener({ elem: elem });

        elem.trigger('change');
        assert.verifySteps(['on_change']);

        listener.destroy();
        elem.trigger('change');
        assert.verifySteps([]);
    });

    QUnit.test('Test exported clickListener mixin', (assert) => {
        class TestMixinClickListener extends clickListener(Events) {
            on_click(_evt) {
                assert.step('on_click');
            }
        }

        const elem = $('<div />');
        const _listener = new TestMixinClickListener({ elem: elem });
        elem.trigger('click');
        assert.verifySteps(['on_click']);
    });

    QUnit.test('Test changeListener mixin', (assert) => {
        class TestMixinChangeListener extends changeListener(Events) {
            on_change(_evt) {
                assert.step('on_change');
            }
        }

        const elem = $('<input type="text" />');
        const _listener = new TestMixinChangeListener({ elem: elem });
        elem.trigger('change');
        assert.verifySteps(['on_change']);
    });

    QUnit.test('Test listener as mixin class', (assert) => {
        const localClickListener = (Base) => create_listener('click', Base);
        class TestMixinClickListener extends localClickListener(Events) {
            on_click(_evt) {
                assert.step('on_click triggered');
            }
        }

        const elem = $('<div />');
        const listener = new TestMixinClickListener({ elem: elem });
        elem.trigger('click');
        assert.verifySteps(['on_click triggered']);

        listener.on('on_click', (_evt) => {
            assert.step('external on_click triggered');
        });
        elem.trigger('click');
        assert.verifySteps(['on_click triggered', 'external on_click triggered']);
    });
});
