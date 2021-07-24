import $ from 'jquery';
import {
    ajax,
    Ajax,
    AjaxParser,
    AjaxSpinner,
    parse_ajax
} from '../src/ajax.js';

QUnit.module('treibstoff.ajax', hooks => {
    let container;

    hooks.beforeEach(() => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('Test AjaxSpinner', assert => {
        let spinner = new AjaxSpinner();

        let body = $('body');
        assert.strictEqual($('#ajax-spinner', body).length, 0);
        assert.strictEqual(spinner._request_count, 0);

        spinner.show();
        assert.strictEqual($('#ajax-spinner', body).length, 1);
        assert.strictEqual(spinner._request_count, 1);

        spinner.show();
        assert.strictEqual($('#ajax-spinner', body).length, 1);
        assert.strictEqual(spinner._request_count, 2);

        spinner.hide();
        assert.strictEqual($('#ajax-spinner', body).length, 1);
        assert.strictEqual(spinner._request_count, 1);

        spinner.hide();
        assert.strictEqual($('#ajax-spinner', body).length, 0);
        assert.strictEqual(spinner._request_count, 0);

        spinner.show();
        spinner.show();
        assert.strictEqual($('#ajax-spinner', body).length, 1);
        assert.strictEqual(spinner._request_count, 2);

        spinner.hide(true);
        assert.strictEqual($('#ajax-spinner', body).length, 0);
        assert.strictEqual(spinner._request_count, 0);
    });

    QUnit.test('Test AjaxParser', assert => {
        class TestAjax extends Ajax {
            bind_dispatcher(node, evts) {
                assert.step('bind_dispatcher(): ' + evts);
            }
            prepare_ajax_form(form) {
                assert.step('prepare_ajax_form()');
            }
        }

        let parser = new AjaxParser(new TestAjax());

        // no ajax attributes, nothing gets bound
        container.append($('<span></span>'));
        parser.walk(container.get(0));
        assert.verifySteps([]);
        container.empty();

        // ajax:bind defined, but nothing associated, nothing gets bound
        container.append($('<span ajax:bind="click"></span>'));
        parser.walk(container.get(0));
        assert.verifySteps([]);
        container.empty();

        // ajax action gets bound to DOM events
        container.append($(`
          <span ajax:bind="click custom"
                ajax:action="action:selector:replace">
          </span>
        `.trim()));
        parser.walk(container.get(0));
        assert.verifySteps(['bind_dispatcher(): click custom']);
        container.empty();

        // ajax event gets bound tom DOM events
        container.append($(`
          <span ajax:bind="click"
                ajax:event="event:selector">
          </span>
        `.trim()));
        parser.walk(container.get(0));
        assert.verifySteps(['bind_dispatcher(): click']);
        container.empty();

        // ajax overlay gets bound to DOM events
        container.append($(`
          <span ajax:bind="click"
                ajax:overlay="actionname">
          </span>
        `.trim()));
        parser.walk(container.get(0));
        assert.verifySteps(['bind_dispatcher(): click']);
        container.empty();

        // ajax form gets bound
        container.append($('<form ajax:form="true"></form>'));
        parser.walk(container.get(0));
        assert.verifySteps(['prepare_ajax_form()']);
        container.empty();
    });
});
