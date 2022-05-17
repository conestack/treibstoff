import $ from 'jquery';
import {Events} from '../src/events.js';
import {
    ClickListener,
    clickListener
} from '../src/listener.js';

QUnit.module('treibstoff.listener', hooks => {

    QUnit.test('Test listener base class', assert => {
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

    QUnit.test('Test listener mixin class', assert => {
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
