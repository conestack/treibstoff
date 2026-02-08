import $ from 'jquery';
import {
    Overlay,
    Message,
    Dialog,
    get_overlay
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

    QUnit.test('Test Overlay rendering', assert => {
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
        assert.deepEqual(elem.attr('class'), 'modal  some-class');
        assert.deepEqual(elem.attr('id'), '1234');
        assert.deepEqual($('.modal-title', elem).text(), 'Overlay Title');
        assert.deepEqual($('.modal-body', elem).text(), 'Overlay Content');
    });

    QUnit.test('Test Overlay visibility', assert => {
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

        ol.close();
        assert.deepEqual(container.children().length, 0);
        assert.false(ol.elem.is(':visible'));

        assert.false(body.hasClass('modal-open'));
    });

    QUnit.test('Test Overlay events', assert => {
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
    });

    QUnit.test('Test get_overlay', assert => {
        // Non-existent element returns null
        assert.strictEqual(
            get_overlay('nonexistent-uid'),
            null,
            'Returns null for non-existent element'
        );

        // Element exists but has no overlay data
        let elem = $('<div id="no-overlay-data"></div>');
        container.append(elem);
        assert.strictEqual(
            get_overlay('no-overlay-data'),
            null,
            'Returns null when element has no overlay data'
        );
        elem.remove();

        // Element exists with overlay data
        let ol = new Overlay({
            uid: 'test-get-overlay',
            container: container
        });
        ol.open();
        let found = get_overlay('test-get-overlay');
        assert.ok(found === ol, 'Returns the overlay instance');
        ol.close();
    });

    QUnit.test('Test Message', assert => {
        let msg = new Message({
            message: 'Message Content',
            flavor: 'info'
        });

        assert.true(msg instanceof Overlay);
        assert.deepEqual(msg.flavor, 'info');
        assert.deepEqual(msg.content, 'Message Content');
        assert.true(msg.f_close_btn !== undefined);

        msg.open();
        assert.true(msg.elem.is(':visible'));

        let btn = $('button', msg.footer);
        btn.click();
        assert.false(msg.elem.is(':visible'));
    });

    QUnit.test('Test Dialog', assert => {
        let on_confirm = function(inst) {
            assert.step(inst.title + ': on_confirm');
        }

        let dial = new Dialog({
            title: 'Dialog',
            on_confirm: on_confirm
        });
        assert.true(dial instanceof Overlay);

        dial.open();
        assert.true(dial.elem.is(':visible'));

        let cancel_btn = $('button.cancel', dial.footer);
        cancel_btn.click();
        assert.false(dial.elem.is(':visible'));

        assert.verifySteps([]);

        dial = new Dialog({
            title: 'Dialog',
            on_confirm: on_confirm
        });

        dial.open();
        assert.true(dial.elem.is(':visible'));

        let ok_btn = $('button.ok', dial.footer);
        ok_btn.click();
        assert.false(dial.elem.is(':visible'));

        assert.verifySteps(['Dialog: on_confirm']);
    });
});
