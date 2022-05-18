import $ from 'jquery';
import {Events} from '../src/events.js';
import {create_listener} from '../src/listener.js';

QUnit.module('treibstoff.listener', hooks => {

    QUnit.test('Test listener constructor', assert => {
        let ClickListener = create_listener('click');
        class TestClickListener extends ClickListener {}

        try {
            new TestClickListener();
        } catch (error) {
            assert.step(error);
        }
        assert.verifySteps(['No options given']);

        try {
            new TestClickListener({});
        } catch (error) {
            assert.step(error);
        }
        assert.verifySteps(['No element given']);

        let elem = $('<div />');
        let listener = new TestClickListener({elem: elem});
        assert.ok(elem === listener.elem);

        let clickListener = Base => create_listener('click', Base);
        class Superclass extends Events {
            constructor(opts) {
                super();
                assert.step(`Superclass called with expected ${opts.opt}`);
            }
        }
        class MixedInClickEventHandle extends clickListener(Superclass) {}

        listener = new MixedInClickEventHandle({elem: elem, opt: 'option'});
        assert.verifySteps(['Superclass called with expected option']);
    });

    QUnit.test('Test listener as base class', assert => {
        let ClickListener = create_listener('click');
        class TestClickListener extends ClickListener {
            on_click(evt) {
                assert.step('on_click triggered');
            }
        }

        let elem = $('<div />');
        let listener = new TestClickListener({elem: elem});
        elem.trigger('click');
        assert.verifySteps(['on_click triggered']);

        listener.on('on_click', function(evt) {
            assert.step('external on_click triggered');
        });
        elem.trigger('click');
        assert.verifySteps([
            'on_click triggered',
            'external on_click triggered'
        ]);
    });

    QUnit.test('Test listener as mixin class', assert => {
        let clickListener = Base => create_listener('click', Base);
        class TestMixinClickListener extends clickListener(Events) {
            on_click(evt) {
                assert.step('on_click triggered');
            }
        }

        let elem = $('<div />');
        let listener = new TestMixinClickListener({elem: elem});
        elem.trigger('click');
        assert.verifySteps(['on_click triggered']);

        listener.on('on_click', function(evt) {
            assert.step('external on_click triggered');
        });
        elem.trigger('click');
        assert.verifySteps([
            'on_click triggered',
            'external on_click triggered'
        ]);
    });
});
