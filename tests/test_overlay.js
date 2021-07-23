import $ from 'jquery';
import {
    Overlay,
    Message,
    Dialog
} from '../src/overlay.js';

QUnit.module('treibstoff.overlay', hooks => {
    let container;

    hooks.before(assert => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.after(() => {
        container.remove();
    });

    QUnit.test('Overlay rendering', assert => {
        let ol = new Overlay({
            uid: '1234',
            css: 'some-class',
            title: 'Overlay Title',
            content: 'Overlay Content',
            container: container
        });

        assert.deepEqual(ol.uid, '1234');
        assert.deepEqual(ol.css, 'some-class');
        assert.deepEqual(ol.title, 'Overlay Title');
        assert.deepEqual(ol.content, 'Overlay Content');

        let elem = ol.elem;
        assert.deepEqual(elem.attr('class'), 'modal some-class');
        assert.deepEqual(elem.attr('id'), '1234');
        assert.deepEqual($('.modal-title', elem).text(), 'Overlay Title');
        assert.deepEqual($('.modal-body', elem).text(), 'Overlay Content');
    });

    QUnit.test('Overlay visibility', assert => {
        let ol = new Overlay({
            container: container
        });

        assert.deepEqual(container.children().length, 0);
        assert.false(ol.elem.is(':visible'));

        ol.open();
        assert.deepEqual(container.children().length, 1);
        assert.true(ol.elem.is(':visible'));

        let body = $('body');
        assert.true(body.hasClass('modal-open'));
        assert.deepEqual(body.css('padding-right'), '13px');
        assert.deepEqual(body.css('overflow-x'), 'hidden');

        ol.close();
        assert.deepEqual(container.children().length, 0);
        assert.false(ol.elem.is(':visible'));

        assert.false(body.hasClass('modal-open'));
        assert.deepEqual(body.css('padding-right'), '0px');
        assert.deepEqual(body.css('overflow-x'), 'auto');
    });

    QUnit.test('Overlay events', assert => {
        let ol = new Overlay({
            title: 'Bound Overlay',
            container: container,
            on_open: function(inst) {
                assert.step(inst.title + ': on_open from opts');
            },
            on_close: function(inst) {
                assert.step(inst.title + ': on_close from opts');
            },
        });

        ol.on('on_open', function(inst) {
            assert.step(inst.title + ': on_open after Overlay creation');
        });
        ol.on('on_close', function(inst) {
            assert.step(inst.title + ': on_close after Overlay creation');
        });

        ol.open();
        assert.verifySteps([
            "Bound Overlay: on_open from opts",
            "Bound Overlay: on_open after Overlay creation"
        ]);

        ol.close();
        assert.verifySteps([
            "Bound Overlay: on_close from opts",
            "Bound Overlay: on_close after Overlay creation"
        ]);
    })
});
