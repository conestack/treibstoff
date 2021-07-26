import $ from 'jquery';
import {
    ajax,
    Ajax,
    AjaxDispatcher,
    AjaxParser,
    AjaxSpinner,
    parse_ajax
} from '../src/ajax.js';

QUnit.module('treibstoff.ajax', hooks => {
    let container;
    let ajax_orgin = $.ajax;

    hooks.beforeEach(() => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.afterEach(() => {
        container.remove();
        // Ajax binds popstate
        $(window).off('popstate');
        // Reset $.ajax patch if any
        $.ajax = ajax_orgin;
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
        class TestAjaxDispatcher extends AjaxDispatcher {
            bind(node, evts) {
                assert.step('bind_dispatcher(): ' + evts);
            }
        }
        class TestAjax extends Ajax {
            constructor() {
                super();
                this.dispatcher = new TestAjaxDispatcher();
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

    QUnit.test('Test Ajax.register', assert => {
        let ajax = new Ajax();

        let binder = function(context) {
            assert.step('binder called');
        }

        ajax.register(binder);
        assert.verifySteps([]);
        let count = 0;
        for (let func_name in ajax.binders) {
            count++;
            assert.true(func_name.indexOf('binder_') > -1);
        }
        assert.deepEqual(count, 1);

        ajax.register(binder, true);
        assert.verifySteps(['binder called']);
        count = 0;
        for (let func_name in ajax.binders) {
            count++;
        }
        assert.deepEqual(count, 2);
    });

    QUnit.test('Test Ajax.parse_target', assert => {
        let ajax = new Ajax();

        assert.deepEqual(ajax.parse_target(''), {
            url: undefined,
            params: {},
            path: undefined,
            query: undefined
        });

        assert.deepEqual(ajax.parse_target('https://tld.com'), {
            url: 'https://tld.com',
            params: {},
            path: '',
            query: ''
        });

        assert.deepEqual(ajax.parse_target('https://tld.com/sub?foo=bar'), {
            url: 'https://tld.com/sub',
            params: {foo: 'bar'},
            path: '/sub',
            query: '?foo=bar'
        });
    });

    QUnit.test('Test AjaxDeprecated', assert => {
        let ajax = new Ajax();

        assert.deepEqual(
            ajax.parseurl('https://tld.com/'),
            'https://tld.com'
        );

        assert.deepEqual(
            ajax.parsequery('https://tld.com?foo=bar'),
            {foo: 'bar'}
        );
        assert.deepEqual(
            ajax.parsequery('https://tld.com?foo=bar', true),
            '?foo=bar'
        );

        assert.deepEqual(ajax.parsepath('https://tld.com/sub'), '/sub');
        assert.deepEqual(
            ajax.parsepath('https://tld.com/sub?foo=bar', true),
            '/sub?foo=bar'
        );

        assert.deepEqual(ajax.parsetarget('https://tld.com/sub?foo=bar'), {
            url: 'https://tld.com/sub',
            params: {foo: 'bar'},
            path: '/sub',
            query: '?foo=bar'
        });
    });

    QUnit.test('Test Ajax.request defaults', assert => {
        let ajax = new Ajax();

        $.ajax = function(opts) {
            assert.step(`url: ${opts.url}`);
            assert.step(`params: ${JSON.stringify(opts.data)}`);
            assert.step(`type: ${opts.dataType}`);
            assert.step(`method: ${opts.method}`);
            assert.step(`cache: ${opts.cache}`);
            ajax.spinner.hide();
        }

        // defaults
        ajax.request({url: 'https://tld.com'});
        assert.verifySteps([
            'url: https://tld.com',
            'params: {}',
            'type: html',
            'method: GET',
            'cache: false'
        ]);

        // override defaults
        ajax.request({
            url: 'https://tld.com',
            type: 'json',
            method: 'POST',
            cache: true
        });
        assert.verifySteps([
            'url: https://tld.com',
            'params: {}',
            'type: json',
            'method: POST',
            'cache: true'
        ]);

        // params from url
        ajax.request({url: 'https://tld.com?foo=bar'});
        assert.verifySteps([
            'url: https://tld.com',
            'params: {"foo":"bar"}',
            'type: html',
            'method: GET',
            'cache: false'
        ]);

        // params from object
        ajax.request({
            url: 'https://tld.com',
            params: {foo: 'bar'}
        });
        assert.verifySteps([
            'url: https://tld.com',
            'params: {"foo":"bar"}',
            'type: html',
            'method: GET',
            'cache: false'
        ]);

        // params from object take precedencs over url params
        ajax.request({
            url: 'https://tld.com?foo=bar',
            params: {foo: 'baz'}
        });
        assert.verifySteps([
            'url: https://tld.com',
            'params: {"foo":"baz"}',
            'type: html',
            'method: GET',
            'cache: false'
        ]);
    });

    QUnit.test('Test Ajax.request success callback', assert => {
        let ajax = new Ajax();

        $.ajax = function(opts) {
            assert.step(`request count: ${ajax.spinner._request_count}`);
            opts.success('<span />', '200', {});
        }

        ajax.request({
            url: 'https://tld.com',
            success: function(data, status, request) {
                assert.step(`data: ${data}`);
                assert.step(`status: ${status}`);
                assert.step(`request: ${JSON.stringify(request)}`);
            }
        });
        assert.verifySteps([
            'request count: 1',
            'data: <span />',
            'status: 200',
            'request: {}'
        ]);
        assert.deepEqual(ajax.spinner._request_count, 0);
    });

    QUnit.test('Test Ajax.request error callback', assert => {
        let ajax = new Ajax();

        let err_opts = {
            request: { status: 0 },
            status: 0,
            error: ''
        }

        $.ajax = function(opts) {
            assert.step(`request count: ${ajax.spinner._request_count}`);
            opts.error(err_opts.request, err_opts.status, err_opts.error);
        }

        let err_cb = function(request, status, error) {
            assert.step(`status: ${status}`);
            assert.step(`error: ${error}`);
        }

        // case status 0
        ajax.request({
            url: 'https://tld.com',
            error: err_cb
        });
        assert.verifySteps(['request count: 1']);
        assert.deepEqual(ajax.spinner._request_count, 0);

        // case status and error from request
        err_opts.request.status = 507;
        err_opts.request.statusText = 'Insufficient Storage'
        ajax.request({
            url: 'https://tld.com',
            error: err_cb
        });
        assert.verifySteps([
            'request count: 1',
            'status: 507',
            'error: Insufficient Storage'
        ]);
        assert.deepEqual(ajax.spinner._request_count, 0);

        // case status and error from function arguments
        err_opts.request = {};
        err_opts.status = '501';
        err_opts.error = 'Not Implemented';

        ajax.request({
            url: 'https://tld.com',
            error: err_cb
        });
        assert.verifySteps([
            'request count: 1',
            'status: 501',
            'error: Not Implemented'
        ]);
        assert.deepEqual(ajax.spinner._request_count, 0);
    });

    QUnit.test('Test Ajax.request default error callback', assert => {
        let err_opts = {
            request: {},
            status: 0,
            error: ''
        }

        $.ajax = function(opts) {
            assert.step(`request count: ${ajax.spinner._request_count}`);
            opts.error(err_opts.request, err_opts.status, err_opts.error);
        }

        class TestLocation {
            set hash(val) {
                assert.step(`hash: ${val}`);
            }
            set pathname(val) {
                assert.step(`pathname: ${val}`);
            }
        }

        let ajax = new Ajax({
            location: new TestLocation()
        });

        // case redirect to login
        err_opts.status = '403';
        err_opts.error = 'Forbidden';
        ajax.request({url: 'https://tld.com'});
        assert.verifySteps([
            'request count: 1',
            'hash: ',
            'pathname: /login'
        ]);
        assert.deepEqual(ajax.spinner._request_count, 0);

        // case show error message
        err_opts.status = '501';
        err_opts.error = 'Not Implemented';
        ajax.request({url: 'https://tld.com'});
        assert.verifySteps(['request count: 1']);
        let err_msg = $('.modal.error').data('overlay');
        assert.strictEqual(
            err_msg.content,
            '<strong>501</strong>Not Implemented'
        );
        err_msg.close();
    });

    QUnit.test('Test Ajax.path', assert => {
        class TestHistory {
            pushState(state, title, url) {
                assert.step('pushState');
                assert.step(`state: ${JSON.stringify(state)}`);
                assert.step(`url: ${url}`);
            }
            replaceState(state, title, url) {
                assert.step('replaceState');
                assert.step(`state: ${JSON.stringify(state)}`);
                assert.step(`url: ${url}`);
            }
        }
        let ajax = new Ajax({
            history: {},
            location: {
                origin: 'https://tld.com'
            }
        })

        // nothing happens if history not provides pushState, call for coverage.
        ajax.path({});

        ajax.win.history = new TestHistory();

        // if no target given, window.location.origin is used
        ajax.path({
            path: 'foo'
        });
        assert.verifySteps([
            'pushState',
            'state: {"target":"https://tld.com/foo"}',
            'url: /foo'
        ]);

        ajax.path({
            path: '/some/path',
            target: 'http://tld.com/some/path',
            action: 'layout:#layout:replace',
            event: 'contextchanged:#layout',
            overlay: 'actionname',
            overlay_css: 'additional-overlay-css-class'
        });
        assert.verifySteps([
            'pushState',
            'state: {' +
                '"target":"http://tld.com/some/path",' +
                '"action":"layout:#layout:replace",' +
                '"event":"contextchanged:#layout",' +
                '"overlay":"actionname",' +
                '"overlay_css":"additional-overlay-css-class"' +
            '}',
            'url: /some/path'
        ]);

        ajax.path({
            path: '/some/path',
            target: 'http://example.com/some/path',
            action: 'layout:#layout:replace',
            replace: true
        });
        assert.verifySteps([
            'replaceState',
            'state: {' +
                '"target":"http://example.com/some/path",' +
                '"action":"layout:#layout:replace"' +
            '}',
            'url: /some/path'
        ]);
    });
});
