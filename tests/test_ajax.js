import $ from 'jquery';
import {
    Ajax,
    AjaxAction,
    AjaxDispatcher,
    AjaxEvent,
    AjaxForm,
    AjaxHandle,
    AjaxOperation,
    AjaxOverlay,
    AjaxParser,
    AjaxPath,
    AjaxRequest,
    AjaxSpinner,
    AjaxUtil
} from '../src/ajax.js';
import {uuid4} from '../src/utils.js';

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

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxSpinner
    ///////////////////////////////////////////////////////////////////////////

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

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxRequest
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxRequest defaults', assert => {
        let spinner = new AjaxSpinner();
        let request = new AjaxRequest({spinner: spinner});

        let ajax_opts;

        $.ajax = function(opts) {
            ajax_opts = {
                url: opts.url,
                params: opts.data,
                type: opts.dataType,
                method: opts.method,
                cache: opts.cache
            };
            spinner.hide();
        }

        // defaults
        request.execute({url: 'https://tld.com'});
        assert.deepEqual(ajax_opts, {
            url: 'https://tld.com',
            params: {},
            type: 'html',
            method: 'GET',
            cache: false
        })

        // override defaults
        request.execute({
            url: 'https://tld.com',
            type: 'json',
            method: 'POST',
            cache: true
        });
        assert.deepEqual(ajax_opts, {
            url: 'https://tld.com',
            params: {},
            type: 'json',
            method: 'POST',
            cache: true
        })

        // params from url
        request.execute({url: 'https://tld.com?foo=bar'});
        assert.deepEqual(ajax_opts.url, 'https://tld.com');
        assert.deepEqual(ajax_opts.params, {foo: 'bar'});

        // params from object
        request.execute({
            url: 'https://tld.com',
            params: {foo: 'foo'}
        });
        assert.deepEqual(ajax_opts.url, 'https://tld.com');
        assert.deepEqual(ajax_opts.params, {foo: 'foo'});

        // params from object take precedencs over url params
        request.execute({
            url: 'https://tld.com?foo=bar',
            params: {foo: 'baz'}
        });
        assert.deepEqual(ajax_opts.url, 'https://tld.com');
        assert.deepEqual(ajax_opts.params, {foo: 'baz'});
    });

    QUnit.test('Test AjaxRequest success callback', assert => {
        let spinner = new AjaxSpinner();
        let request = new AjaxRequest({spinner: spinner});

        $.ajax = function(opts) {
            assert.step(`request count: ${spinner._request_count}`);
            opts.success('<span />', '200', {});
        }

        request.execute({
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
        assert.deepEqual(spinner._request_count, 0);
    });

    QUnit.test('Test AjaxRequest error callback', assert => {
        let spinner = new AjaxSpinner();
        let request = new AjaxRequest({spinner: spinner});

        let err_opts = {
            request: { status: 0 },
            status: 0,
            error: ''
        }

        $.ajax = function(opts) {
            assert.step(`request count: ${spinner._request_count}`);
            opts.error(err_opts.request, err_opts.status, err_opts.error);
        }

        let err_cb = function(request, status, error) {
            assert.step(`status: ${status}`);
            assert.step(`error: ${error}`);
        }

        // case status 0
        request.execute({
            url: 'https://tld.com',
            error: err_cb
        });
        assert.verifySteps(['request count: 1']);
        assert.deepEqual(spinner._request_count, 0);

        // case status and error from request
        err_opts.request.status = 507;
        err_opts.request.statusText = 'Insufficient Storage'
        request.execute({
            url: 'https://tld.com',
            error: err_cb
        });
        assert.verifySteps([
            'request count: 1',
            'status: 507',
            'error: Insufficient Storage'
        ]);
        assert.deepEqual(spinner._request_count, 0);

        // case status and error from function arguments
        err_opts.request = {};
        err_opts.status = '501';
        err_opts.error = 'Not Implemented';

        request.execute({
            url: 'https://tld.com',
            error: err_cb
        });
        assert.verifySteps([
            'request count: 1',
            'status: 501',
            'error: Not Implemented'
        ]);
        assert.deepEqual(spinner._request_count, 0);
    });

    QUnit.test('Test AjaxRequest default error callback', assert => {
        let spinner = new AjaxSpinner();
        let err_opts = {
            request: {},
            status: 0,
            error: ''
        }

        $.ajax = function(opts) {
            assert.step(`request count: ${spinner._request_count}`);
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

        let request = new AjaxRequest({
            spinner: spinner,
            win: {
            location: new TestLocation()
        }
        });

        // case redirect to login
        err_opts.status = '403';
        err_opts.error = 'Forbidden';
        request.execute({url: 'https://tld.com'});
        assert.verifySteps([
            'request count: 1',
            'hash: ',
            'pathname: /login'
        ]);
        assert.deepEqual(spinner._request_count, 0);

        // case show error message
        err_opts.status = '501';
        err_opts.error = 'Not Implemented';
        request.execute({url: 'https://tld.com'});
        assert.verifySteps(['request count: 1']);
        let err_msg = $('.modal.error').data('overlay');
        assert.strictEqual(
            err_msg.content,
            '<strong>501</strong>Not Implemented'
        );
        err_msg.close();
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxUtil
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxUtil.parse_target', assert => {
        let util = new AjaxUtil();

        assert.deepEqual(util.parse_target(''), {
            url: undefined,
            params: {},
            path: undefined,
            query: undefined
        });

        assert.deepEqual(util.parse_target('https://tld.com'), {
            url: 'https://tld.com',
            params: {},
            path: '',
            query: ''
        });

        assert.deepEqual(util.parse_target('https://tld.com/sub?foo=bar'), {
            url: 'https://tld.com/sub',
            params: {foo: 'bar'},
            path: '/sub',
            query: '?foo=bar'
        });
    });

    QUnit.test('Test AjaxUtil.parse_definition', assert => {
        let util = new AjaxUtil();

        assert.deepEqual(
            util.parse_definition('action:.selector:inner'),
            ['action:.selector:inner']
        )

        assert.deepEqual(
            util.parse_definition('a1:.sel1:inner a2:.sel2:replace'),
            ['a1:.sel1:inner', 'a2:.sel2:replace']
        )

        assert.deepEqual(
            util.parse_definition('event:.selector'),
            ['event:.selector']
        )

        assert.deepEqual(
            util.parse_definition('e1:.sel1 e2:sel2'),
            ['e1:.sel1', 'e2:sel2']
        )
    });

    QUnit.test('Test AjaxUtil.action_target', assert => {
        let util = new AjaxUtil();

        let elem = $('<span />');
        let evt = $.Event();
        evt.ajaxtarget = util.parse_target('https://tld.com?param=value');
        assert.deepEqual(util.action_target(elem, evt), {
            params: {param: 'value'},
            path: '',
            query: '?param=value',
            url: 'https://tld.com'
        });

        elem = $('<span ajax:target="https://tld.com?param=value" />');
        evt = $.Event();
        assert.deepEqual(util.action_target(elem, evt), {
            params: {param: 'value'},
            path: '',
            query: '?param=value',
            url: 'https://tld.com'
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxOperation
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxOperation', assert => {
        let op = new AjaxOperation({
            event: 'on_operation',
            dispatcher: new AjaxDispatcher()
        });

        assert.deepEqual(op.dispatcher._subscribers['on_operation'].length, 1);
        assert.throws(function() {
            op.execute({})
        });
        assert.throws(function() {
            op.dispatcher.trigger('on_operation', {})
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxPath
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxPath.execute', assert => {
        let pushed_path,
            pushed_state,
            replaced_path,
            replaced_state;

        class TestHistory {
            pushState(state, title, url) {
                pushed_state = state;
                pushed_path = url;
            }
            replaceState(state, title, url) {
                replaced_state = state;
                replaced_path = url;
            }
        }

        class TestWindow {
            constructor() {
                this.history = {};
                this.location = {origin: 'https://tld.com'};
            }
        }

        let dispatcher = new AjaxDispatcher();
        let win = new TestWindow();
        let path = new AjaxPath({
            dispatcher: dispatcher,
            win: win
        });

        // nothing happens if history not provides pushState, call for coverage.
        path.execute({});
        let history = win.history = new TestHistory();

        // if no target given, window.location.origin is used
        path.execute({path: 'foo'});
        assert.deepEqual(pushed_path, '/foo');
        assert.deepEqual(pushed_state, {
            target: 'https://tld.com/foo',
            _t_ajax: true
        });

        path.execute({
            path: '/some/path',
            target: 'http://tld.com/some/path',
            action: 'layout:#layout:replace',
            event: 'contextchanged:#layout',
            overlay: 'actionname',
            overlay_css: 'someclass',
            overlay_uid: '1234',
            overlay_title: 'Overlay Title'
        });
        assert.deepEqual(pushed_path, '/some/path');
        assert.deepEqual(pushed_state, {
            target: 'http://tld.com/some/path',
            action: 'layout:#layout:replace',
            event: 'contextchanged:#layout',
            overlay: 'actionname',
            overlay_css: 'someclass',
            overlay_uid: '1234',
            overlay_title: 'Overlay Title',
            _t_ajax: true
        });

        path.execute({
            path: '/some/path',
            target: 'http://example.com/some/path',
            action: 'layout:#layout:replace',
            replace: true
        });
        assert.deepEqual(replaced_path, '/some/path');
        assert.deepEqual(replaced_state, {
            target: 'http://example.com/some/path',
            action: 'layout:#layout:replace',
            _t_ajax: true
        });
    });

    QUnit.test('Test AjaxPath.handle_state', assert => {
        // dummy window for dispatching events to
        let win = $('<win />');
        win.loaction = null;

        let preventDefault = function() {
            assert.step('evt.preventDefault()');
        }
        let trigger_popstate = function(state) {
            let evt = $.Event('popstate', {preventDefault:preventDefault});
            evt.originalEvent = {state: state};
            win.trigger(evt);
        }

        let handler_opts;

        let handler = function(inst, opts) {
            handler_opts = opts;
        }

        let dispatcher = new AjaxDispatcher();
        dispatcher.on('on_action', handler);
        dispatcher.on('on_event', handler);
        dispatcher.on('on_overlay', handler);

        let path = new AjaxPath({
            dispatcher: dispatcher,
            win: win
        });

        // no state, nothing happens
        trigger_popstate(undefined);
        assert.verifySteps([]);

        // state not ajax related, nothing happens
        trigger_popstate({});
        assert.verifySteps([]);

        // Case window location gets set, target set as parsed target
        trigger_popstate({
            _t_ajax: true,
            target: path.parse_target('https://tld.com?param=value'),
        });
        assert.verifySteps(['evt.preventDefault()']);
        assert.deepEqual(win.location, 'https://tld.com');
        win.location = null;

        // Case window location gets set, target set as string
        trigger_popstate({
            _t_ajax: true,
            target: 'https://tld.com?param=value',
        });
        assert.verifySteps(['evt.preventDefault()']);
        assert.deepEqual(win.location, 'https://tld.com');
        win.location = null;

        // Case window location gets set. Action, event and overlay operations
        // empty.
        trigger_popstate({
            _t_ajax: true,
            target: 'https://tld.com?param=value',
            action: null,
            event: null,
            overlay: null
        });
        assert.verifySteps(['evt.preventDefault()']);
        assert.deepEqual(win.location, 'https://tld.com');
        win.location = null;

        let target_res = {
            url: 'https://tld.com',
            params: {
                param: 'value',
                popstate: '1'
            },
            path: '',
            query: '?param=value'
        };

        // Case action operation
        trigger_popstate({
            _t_ajax: true,
            target: 'https://tld.com?param=value',
            action: 'name:.selector:replace'
        });
        assert.verifySteps(['evt.preventDefault()']);
        assert.deepEqual(handler_opts, {
            target: target_res,
            action: 'name:.selector:replace'
        });
        assert.deepEqual(win.location, null);

        // Case event operation
        trigger_popstate({
            _t_ajax: true,
            target: 'https://tld.com?param=value',
            event: 'name:.selector'
        });
        assert.verifySteps(['evt.preventDefault()']);
        assert.deepEqual(handler_opts, {
            target: target_res,
            event: 'name:.selector'
        });
        assert.deepEqual(win.location, null);

        // Case overlay operation
        trigger_popstate({
            _t_ajax: true,
            target: 'https://tld.com?param=value',
            overlay: 'name',
            overlay_css: 'css',
            overlay_uid: '1234',
            overlay_title: 'Overlay Title'
        });
        assert.verifySteps(['evt.preventDefault()']);
        assert.deepEqual(handler_opts, {
            target: target_res,
            overlay: 'name',
            css: 'css',
            uid: '1234',
            title: 'Overlay Title'
        });
        assert.deepEqual(win.location, null);
    });

    QUnit.test('Test AjaxPath.has_attr', assert => {
        let path = new AjaxPath({
            dispatcher: new AjaxDispatcher(),
            win: $('<win />')
        });

        let elem = $('<span />');
        assert.notOk(path.has_attr(elem, 'ajax:path'));

        elem = $('<span ajax:path=""/>');
        assert.ok(path.has_attr(elem, 'ajax:path'));
    });

    QUnit.test('Test AjaxPath.attr_val', assert => {
        let path = new AjaxPath({
            dispatcher: new AjaxDispatcher(),
            win: $('<win />')
        });

        let elem = $('<span />');
        assert.deepEqual(path.attr_val(elem, 'a', 'b'), undefined);

        elem = $('<span a="a" b="b" />');
        assert.deepEqual(path.attr_val(elem, 'a', 'b'), 'a');

        elem = $('<span a="" b="b" />');
        assert.deepEqual(path.attr_val(elem, 'a', 'b'), '');

        elem = $('<span b="b" />');
        assert.deepEqual(path.attr_val(elem, 'a', 'b'), 'b');
    });

    QUnit.test('Test AjaxPath.handle', assert => {
        let execute_opts;

        class TestAjaxPath extends AjaxPath {
            execute(opts) {
                execute_opts = opts;
            }
        }

        let dispatcher = new AjaxDispatcher();
        let path = new TestAjaxPath({
            dispatcher: dispatcher,
            win: $('<win />')
        });

        // path from ajax:path as is
        let elem = $('<a ajax:path="/some/path" ajax:target="http://tld.com" />');
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.path, '/some/path');

        // path from target
        elem = $('<a ajax:path="target" ajax:target="http://tld.com/sub" />');
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.path, '/sub');

        // path from href
        elem = $(
            `<a href="https://tld.com/other"
                ajax:path="href"
                ajax:target="http://tld.com/sub" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.path, '/other');

        // target from ajax:target
        elem = $(
            `<a ajax:path="target"
                ajax:target="http://tld.com/sub" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.path, '/sub');
        assert.deepEqual(execute_opts.target, {
            url: 'http://tld.com/sub',
            params: {},
            path: '/sub',
            query: ''
        });

        // target from ajax:path-target
        elem = $(
            `<a ajax:path="target"
                ajax:target="http://tld.com/sub"
                ajax:path-target="http://tld.com/other" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.path, '/sub');
        assert.deepEqual(execute_opts.target, {
            url: 'http://tld.com/other',
            params: {},
            path: '/other',
            query: ''
        });

        // suppress ajax:target with empty ajax:path-target
        elem = $(
            `<a ajax:path="target"
                ajax:target="http://tld.com/sub"
                ajax:path-target="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.path, '/sub');
        assert.deepEqual(execute_opts.target, undefined);

        // action from ajax:action
        elem = $(
            `<a ajax:path="/sub"
                ajax:action="name:.selector:replace" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.action, 'name:.selector:replace');

        // action from ajax:path-action
        elem = $(
            `<a ajax:path="/sub"
                ajax:action="name:.selector:replace"
                ajax:path-action="other:.selector:replace" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.action, 'other:.selector:replace');

        // suppress ajax:action with empty ajax:path-action
        elem = $(
            `<a ajax:path="/sub"
                ajax:action="name:.selector:replace"
                ajax:path-action="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.action, '');

        // event from ajax:event
        elem = $(
            `<a ajax:path="/sub"
                ajax:event="name:.selector" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.event, 'name:.selector');

        // event from ajax:path-event
        elem = $(
            `<a ajax:path="/sub"
                ajax:event="name:.selector"
                ajax:path-event="other:.selector" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.event, 'other:.selector');

        // suppress ajax:event with empty ajax:path-event
        elem = $(
            `<a ajax:path="/sub"
                ajax:event="name:.selector"
                ajax:path-event="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.event, '');

        // overlay from ajax:overlay
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay, 'name');

        // overlay from ajax:path-overlay
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:path-overlay="other" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay, 'other');

        // suppress ajax:overlay with empty ajax:path-overlay
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:path-overlay="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay, '');

        // overlay CSS from ajax:overlay-css
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-css="css" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_css, 'css');

        // overlay CSS from ajax:path-overlay-css
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-css="css"
                ajax:path-overlay-css="other" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_css, 'other');

        // suppress ajax:overlay-css with empty ajax:path-overlay-css
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-css="css"
                ajax:path-overlay-css="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_css, '');

        // overlay uid from ajax:overlay-uid
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-uid="1234" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_uid, '1234');

        // overlay uid from ajax:path-overlay-uid
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-uid="1234"
                ajax:path-overlay-uid="5678" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_uid, '5678');

        // suppress ajax:overlay-uid with empty ajax:path-overlay-uid
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-uid="1234"
                ajax:path-overlay-uid="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_uid, '');

        // overlay title from ajax:overlay-title
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-title="Title" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_title, 'Title');

        // overlay title from ajax:path-overlay-title
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-title="Title"
                ajax:path-overlay-title="Other" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_title, 'Other');

        // suppress ajax:overlay-title with empty ajax:path-overlay-title
        elem = $(
            `<a ajax:path="/sub"
                ajax:overlay="name"
                ajax:overlay-title="Title"
                ajax:path-overlay-title="" />`
        );
        dispatcher.trigger('on_path', {elem: elem, event: $.Event('click')});
        assert.deepEqual(execute_opts.overlay_title, '');
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxAction
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxAction.execute', assert => {
        let execute_opts;

        class TestAjaxRequest extends AjaxRequest {
            execute(opts) {
                this.spinner.show();
                execute_opts = opts;
            }
        }

        let win = {};
        let ajax = new Ajax(win);
        let spinner = ajax.spinner;
        let request = new TestAjaxRequest({
            spinner: spinner,
            win: win
        });
        let handle = new AjaxHandle({
            ajax: ajax,
            spinner: spinner
        });
        let dispatcher = new AjaxDispatcher();
        let action = new AjaxAction({
            dispatcher: dispatcher,
            win: {},
            handle: handle,
            spinner: ajax.spinner,
            request: request
        })

        action.execute({
            name: 'name',
            selector: '.selector',
            mode: 'inner',
            url: 'https://tld.com',
            params: {}
        });
        assert.deepEqual(spinner._request_count, 1);
        spinner.hide();
        assert.deepEqual(spinner._request_count, 0);
        assert.deepEqual(execute_opts.url, 'https://tld.com/ajaxaction');
        assert.deepEqual(execute_opts.type, 'json');
        assert.deepEqual(execute_opts.params, {
            'ajax.action': 'name',
            'ajax.mode': 'inner',
            'ajax.selector': '.selector'
        });
    });

    QUnit.test('Test AjaxAction.complete', assert => {
        let response_data;

        class TestAjaxRequest extends AjaxRequest {
            execute(opts) {
                this.spinner.show();
                opts.success(response_data);
            }
        }

        let update_opts,
            next_operations;

        class TestAjaxHandle extends AjaxHandle {
            update(opts) {
                update_opts = opts;
            }
            next(operations) {
                next_operations = operations;
            }
        }

        let win = {};
        let ajax = new Ajax(win);
        let spinner = ajax.spinner;
        let request = new TestAjaxRequest({
            spinner: spinner,
            win: win
        });
        let handle = new TestAjaxHandle({
            ajax: ajax,
            spinner: spinner
        });
        let dispatcher = new AjaxDispatcher();
        let action = new AjaxAction({
            dispatcher: dispatcher,
            win: win,
            handle: handle,
            spinner: ajax.spinner,
            request: request
        })

        // No response data, error is displayed
        response_data = null;
        action.execute({
            name: 'name',
            selector: '.selector',
            mode: 'inner',
            url: 'https://tld.com',
            params: {}
        });
        assert.deepEqual(spinner._request_count, 0);
        assert.notOk(update_opts);
        assert.notOk(next_operations);

        let err = $('body .modal.error').data('overlay');
        assert.deepEqual(err.content, 'Empty Response');
        err.close();

        // Response data given, ajax handle ``update`` and ``next`` gets called
        response_data = {
            payload: '<div>Response Payload</div>',
            continuation: []
        }
        action.execute({
            name: 'name',
            selector: '.selector',
            mode: 'inner',
            url: 'https://tld.com',
            params: {}
        });
        assert.deepEqual(update_opts.payload, '<div>Response Payload</div>');
        assert.deepEqual(next_operations, []);
    });

    QUnit.test('Test AjaxAction.handle', assert => {
        let execute_opts = [];

        class TestAjaxAction extends AjaxAction {
            execute(opts) {
                execute_opts.push(opts);
            }
        }

        let win = {};
        let ajax = new Ajax(win);
        let spinner = ajax.spinner;
        let request = new AjaxRequest({
            spinner: spinner,
            win: win
        });
        let handle = new AjaxHandle({
            ajax: ajax,
            spinner: spinner
        });
        let dispatcher = new AjaxDispatcher();
        let action = new TestAjaxAction({
            dispatcher: dispatcher,
            win: win,
            handle: handle,
            spinner: ajax.spinner,
            request: request
        })

        assert.deepEqual(dispatcher._subscribers['on_action'].length, 1);

        dispatcher.trigger('on_action', {
            target: action.parse_target('https://tld.com'),
            action: 'name:.selector:replace',
        });
        assert.deepEqual(execute_opts.length, 1);
        assert.deepEqual(execute_opts[0], {
            name: 'name',
            selector: '.selector',
            mode: 'replace',
            url: 'https://tld.com',
            params: {}
        });
        execute_opts = [];

        dispatcher.trigger('on_action', {
            target: action.parse_target('https://tld.com?param=value'),
            action: 'name1:.sel1:replace name2:.sel2:inner',
        });
        assert.deepEqual(execute_opts.length, 2);
        assert.deepEqual(execute_opts[0], {
            name: 'name1',
            selector: '.sel1',
            mode: 'replace',
            url: 'https://tld.com',
            params: {param: 'value'}
        });
        assert.deepEqual(execute_opts[1], {
            name: 'name2',
            selector: '.sel2',
            mode: 'inner',
            url: 'https://tld.com',
            params: {param: 'value'}
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxEvent
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxEvent.create_event', assert => {
        let dispatcher = new AjaxDispatcher();
        let event = new AjaxEvent({dispatcher: dispatcher});

        let evt = event.create_event('name', 'https://tld.com', {});
        assert.ok(evt instanceof $.Event);
        assert.deepEqual(evt.type, 'name');
        assert.deepEqual(evt.ajaxtarget, {
            url: 'https://tld.com',
            params:{},
            path: '',
            query: ''
        });
        assert.deepEqual(evt.ajaxdata, {});

        let target = event.parse_target('https://tld.com/sub?param=value');
        evt = event.create_event('name', target, {key: 'val'});
        assert.deepEqual(evt.ajaxtarget, {
            url: 'https://tld.com/sub',
            params:{param: 'value'},
            path: '/sub',
            query: '?param=value'
        });
        assert.deepEqual(evt.ajaxdata, {key: 'val'});
    });

    QUnit.test('Test AjaxEvent.execute', assert => {
        let dispatcher = new AjaxDispatcher();
        let event = new AjaxEvent({dispatcher: dispatcher});

        let elem = $(`<div class="testevent-listener"></div>`);
        $('body').append(elem);

        let test_event;

        elem.on('testevent', function(e) {
            test_event = e;
        });

        event.execute({
            name: 'testevent',
            selector: '.testevent-listener',
            target: 'http://tld.com',
            data: {key: 'val'}
        });
        assert.deepEqual(test_event.type, 'testevent');
        assert.deepEqual(test_event.ajaxtarget, {
            url: 'http://tld.com',
            params: {},
            path: '',
            query: ''
        });
        assert.deepEqual(test_event.ajaxdata, {key: 'val'});

        elem.remove();
    });

    QUnit.test('Test AjaxEvent.handle', assert => {
        let execute_opts = [];

        class TestAjaxEvent extends AjaxEvent {
            execute(opts) {
                execute_opts.push(opts);
            }
        }

        let dispatcher = new AjaxDispatcher();
        let event = new TestAjaxEvent({dispatcher: dispatcher});

        assert.deepEqual(dispatcher._subscribers['on_event'].length, 1);

        dispatcher.trigger('on_event', {
            target: 'https://tld.com',
            event: 'name:.sel',
        });
        assert.deepEqual(execute_opts.length, 1);
        assert.deepEqual(execute_opts[0], {
            name: 'name',
            selector: '.sel',
            target: 'https://tld.com'
        });
        execute_opts = [];

        dispatcher.trigger('on_event', {
            target: 'https://tld.com',
            event: 'name1:.sel1 name2:.sel2',
        });
        assert.deepEqual(execute_opts.length, 2);
        assert.deepEqual(execute_opts[0], {
            name: 'name1',
            selector: '.sel1',
            target: 'https://tld.com'
        });
        assert.deepEqual(execute_opts[1], {
            name: 'name2',
            selector: '.sel2',
            target: 'https://tld.com'
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxOverlay
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxOverlay.execute', assert => {
        let execute_opts;
        let response_data;
        let call_success = false;

        class TestAjaxRequest extends AjaxRequest {
            execute(opts) {
                execute_opts = opts;
                if (call_success) {
                    opts.success(response_data);
                }
            }
        }

        let complete_data;

        class TestAjaxOverlay extends AjaxOverlay {
            complete(data) {
                complete_data = data;
            }
        }

        let win = {};
        let ajax = new Ajax(win);
        let spinner = ajax.spinner;
        let request = new TestAjaxRequest({
            spinner: spinner,
            win: win
        });
        let handle = new AjaxHandle({
            ajax: ajax,
            spinner: spinner
        });
        let dispatcher = new AjaxDispatcher();
        let overlay = new TestAjaxOverlay({
            dispatcher: dispatcher,
            win: {},
            handle: handle,
            spinner: ajax.spinner,
            request: request
        })

        assert.ok(overlay instanceof AjaxAction);

        // Case target passed as url and params
        let ol = overlay.execute({
            action: 'name',
            url: 'https://tld.com',
            params: {param: 'value'}
        });
        assert.deepEqual(execute_opts.url, 'https://tld.com/ajaxaction');
        assert.deepEqual(execute_opts.params, {
            'ajax.action': 'name',
            'ajax.mode': 'inner',
            'ajax.selector': `#${ol.uid} .modal-body`,
            'ajax.overlay-uid': ol.uid,
            'param': 'value'
        });

        // Case target passed as string
        ol = overlay.execute({
            action: 'name',
            target: 'https://tld.com?param=value'
        });
        assert.deepEqual(execute_opts.url, 'https://tld.com/ajaxaction');
        assert.deepEqual(execute_opts.params, {
            'ajax.action': 'name',
            'ajax.mode': 'inner',
            'ajax.selector': `#${ol.uid} .modal-body`,
            'ajax.overlay-uid': ol.uid,
            'param': 'value'
        });

        // Case target passed as object
        ol = overlay.execute({
            action: 'name',
            target: {
                url: 'https://tld.com',
                params: {param: 'value'}
            }
        });
        assert.deepEqual(execute_opts.url, 'https://tld.com/ajaxaction');
        assert.deepEqual(execute_opts.params, {
            'ajax.action': 'name',
            'ajax.mode': 'inner',
            'ajax.selector': `#${ol.uid} .modal-body`,
            'ajax.overlay-uid': ol.uid,
            'param': 'value'
        });

        // Case uid given
        let uid = uuid4();
        ol = overlay.execute({
            action: 'name',
            target: 'https://tld.com?param=value',
            uid: uid
        });
        assert.deepEqual(ol.uid, uid);

        // Case overlay not displayed if no payload received
        call_success = true;
        response_data = {};
        ol = overlay.execute({
            action: 'name',
            url: 'https://tld.com',
            params: {}
        });
        assert.deepEqual(execute_opts.url, 'https://tld.com/ajaxaction');
        assert.deepEqual(execute_opts.params, {
            'ajax.action': 'name',
            'ajax.mode': 'inner',
            'ajax.selector': `#${ol.uid} .modal-body`,
            'ajax.overlay-uid': ol.uid
        });
        assert.notOk(ol.is_open);
        assert.deepEqual(complete_data, {});

        // Case overlay displayed if payload received
        response_data = {payload: 'Overlay Content'};
        ol = overlay.execute({
            action: 'name',
            url: 'https://tld.com',
            params: {}
        });
        assert.deepEqual(execute_opts.url, 'https://tld.com/ajaxaction');
        assert.deepEqual(execute_opts.params, {
            'ajax.action': 'name',
            'ajax.mode': 'inner',
            'ajax.selector': `#${ol.uid} .modal-body`,
            'ajax.overlay-uid': ol.uid
        });
        assert.deepEqual(complete_data, {payload: 'Overlay Content'});
        assert.ok(ol.is_open);

        // Case close overlay
        ol = overlay.execute({
            close: true,
            uid: ol.uid
        });
        assert.notOk(ol.is_open);

        // Case close overlay, overlay not exists
        ol = overlay.execute({
            close: true,
            uid: 'inexistent'
        });
        assert.deepEqual(ol, null);
    });

    QUnit.test('Test AjaxOverlay.handle', assert => {
        let execute_opts;

        class TestAjaxOverlay extends AjaxOverlay {
            execute(opts) {
                execute_opts = opts;
            }
        }

        let dispatcher = new AjaxDispatcher();
        let overlay = new TestAjaxOverlay({dispatcher: dispatcher});

        assert.deepEqual(dispatcher._subscribers['on_overlay'].length, 1);

        dispatcher.trigger('on_overlay', {
            target: overlay.parse_target('https://tld.com?param=value'),
            overlay: 'name',
            css: 'someclass',
            uid: '1234',
            title: 'Title'
        });
        assert.deepEqual(execute_opts, {
            url: 'https://tld.com',
            params: {param: 'value'},
            action: 'name',
            css: 'someclass',
            uid: '1234',
            title: 'Title'
        });

        dispatcher.trigger('on_overlay', {
            overlay: 'CLOSE',
            uid: '1234'
        });
        assert.deepEqual(execute_opts, {
            uid: '1234',
            close: true
        });

        dispatcher.trigger('on_overlay', {overlay: 'CLOSE:1234'});
        assert.deepEqual(execute_opts, {
            uid: '1234',
            close: true
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxForm
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxForm', assert => {
        let update_opts,
            next_operations;

        class TestAjaxHandle extends AjaxHandle {
            update(opts) {
                update_opts = opts;
            }
            next(operations) {
                next_operations = operations;
            }
        }

        let win = {};
        let ajax = new Ajax(win);
        let spinner = ajax.spinner;
        let handle = new TestAjaxHandle(ajax);
        let form = new AjaxForm({
            handle: handle,
            spinner: spinner
        });

        // no hidden iframe yet
        assert.deepEqual(form.afr, null);

        // bind form element
        let form_elem = $('<form />');
        form.bind(form_elem.get(0));

        // hidden iframe has been created and added to body
        let hidden_iframe = $('body > #ajaxformresponse');
        assert.deepEqual(hidden_iframe.length, 1);
        assert.deepEqual(hidden_iframe.get(0), form.afr.get(0));
        assert.deepEqual(hidden_iframe.attr('id'), 'ajaxformresponse');
        assert.deepEqual(hidden_iframe.attr('name'), 'ajaxformresponse');
        assert.deepEqual(hidden_iframe.attr('src'), 'about:blank');
        assert.deepEqual(
            hidden_iframe.attr('style'),
            'width:0px;height:0px;display:none'
        );

        // form element target is hidden iframe
        assert.deepEqual(form_elem.attr('target'), 'ajaxformresponse');

        // hidden input added for marking form as ajax form
        let hidden_input = $(form_elem.children()[0]);
        assert.deepEqual(hidden_input.attr('type'), 'hidden');
        assert.deepEqual(hidden_input.attr('name'), 'ajax');
        assert.deepEqual(hidden_input.attr('value'), '1');

        // submit displays spinner
        form_elem.trigger('submit');
        assert.deepEqual(spinner._request_count, 1);

        // render response, case error, hidden iframe not gets removed, to avoid
        // case form gets re submitted to missing frame, causing the browser to
        // open a new tab. this is annoying when browser testing ajax forms.
        form.render({error: true});
        assert.notOk(update_opts);
        assert.notOk(next_operations);
        assert.ok(form.afr !== null);
        assert.deepEqual(spinner._request_count, 0);

        // render response, case payload
        form_elem = $('<form />');
        form.render({
            payload: form_elem.get(0),
            selector: '#form',
            mode: 'replace',
            next: [],
            error: false
        });
        assert.deepEqual(update_opts, {
            payload: form_elem.get(0),
            selector: '#form',
            mode: 'replace',
            next: [],
            error: false
        });
        assert.deepEqual(next_operations, []);
        assert.ok(form.afr === null);
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxDispatcher
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxDispatcher.dispatch_handle', assert => {
        let dispatch_opts;

        class TestAjaxDispatcher extends AjaxDispatcher {
            dispatch(opts) {
                dispatch_opts = opts;
            }
        }

        let dispatcher = new TestAjaxDispatcher();

        let elem = $('<span />');
        dispatcher.bind(elem.get(0), 'click');
        elem.trigger('click');
        assert.deepEqual(dispatch_opts.elem, elem);
        assert.deepEqual(dispatch_opts.event.type, 'click');
        dispatch_opts = null;

        elem = $('<span ajax:confirm="Really?" />');
        dispatcher.bind(elem.get(0), 'click');

        elem.trigger('click');
        let dialog = $('body > .modal.dialog').data('overlay');
        assert.deepEqual(dialog.content, 'Really?');
        assert.ok(dialog.is_open);

        $('button.cancel', dialog.elem).trigger('click');
        assert.notOk(dialog.is_open);
        assert.deepEqual(dispatch_opts, null);

        elem.trigger('click');
        dialog = $('body > .modal.dialog').data('overlay');
        assert.ok(dialog.is_open);

        $('button.ok', dialog.elem).trigger('click');
        assert.notOk(dialog.is_open);
        assert.deepEqual(dispatch_opts.elem, elem);
        assert.deepEqual(dispatch_opts.event.type, 'click');
    });

    QUnit.test('Test AjaxDispatcher.dispatch', assert => {
        let dispatcher = new AjaxDispatcher();

        let action_opts;
        dispatcher.on('on_action', function(inst, opts) {
            action_opts = opts;
        });

        let event_opts;
        dispatcher.on('on_event', function(inst, opts) {
            event_opts = opts;
        });

        let overlay_opts;
        dispatcher.on('on_overlay', function(inst, opts) {
            overlay_opts = opts;
        });

        let path_opts;
        dispatcher.on('on_path', function(inst, opts) {
            path_opts = opts;
        });

        // dispatch action
        let elem = $(
            `<span ajax:target="https://tld.com"
                   ajax:action="name:.selector:target" />`
        );
        let event = $.Event();
        dispatcher.dispatch({
            elem: elem,
            event: event
        })
        assert.deepEqual(action_opts, {
            action: 'name:.selector:target',
            target: {
                params: {},
                path: '',
                query: '',
                url: 'https://tld.com'
              }
        });

        // dispatch event
        elem = $(
            `<span ajax:target="https://tld.com"
                   ajax:event="name:.selector" />`
        );
        event = $.Event();
        dispatcher.dispatch({
            elem: elem,
            event: event
        })
        assert.deepEqual(event_opts, {
            event: 'name:.selector',
            target: 'https://tld.com'
        });

        // dispatch overlay
        elem = $(
            `<span ajax:target="https://tld.com"
                   ajax:overlay="name"
                   ajax:overlay-css="css"
                   ajax:overlay-uid="1234"
                   ajax:overlay-title="" />`
        );
        event = $.Event();
        dispatcher.dispatch({
            elem: elem,
            event: event
        })
        assert.deepEqual(overlay_opts, {
            css: 'css',
            overlay: 'name',
            target: {
                params: {},
                path: '',
                query: '',
                url: 'https://tld.com'
            },
            title: '',
            uid: '1234'
        });

        // dispatch path
        elem = $(
            `<span ajax:target="https://tld.com"
                   ajax:path="/sub" />`
        );
        event = $.Event();
        event.type = 'click';
        dispatcher.dispatch({
            elem: elem,
            event: event
        })
        assert.deepEqual(path_opts.elem, elem);
        assert.deepEqual(path_opts.event.type, 'click');
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxHandle
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxHandle.update', assert => {
        let bind_context;

        class TestAjax extends Ajax {
            bind(context) {
                bind_context = context;
            }
        }

        let handle = new AjaxHandle(new TestAjax({}));
        let body = $('body');

        // mode inner
        let container = $('<div class="ajax-container" />').appendTo(body);
        handle.update({
            payload: '<span>Payload</span>',
            selector: '.ajax-container',
            mode: 'inner'
        });
        assert.deepEqual(bind_context.attr('class'), 'ajax-container');
        assert.deepEqual($('span', bind_context).html(), 'Payload');
        container.remove();

        // mode replace, case selector works on replaced payload
        container = $(`
            <div class="ajax-container">
              <span class="to-replace">Replace me</span>
            </div>
        `).appendTo(body);
        handle.update({
            payload: '<span class="to-replace">Replaced</span>',
            selector: '.to-replace',
            mode: 'replace'
        });
        assert.deepEqual(bind_context.attr('class'), 'ajax-container');
        assert.deepEqual($('span', bind_context).html(), 'Replaced');
        container.remove();

        // mode replace, case selector not works on replaced payload, in this
        // case bind context is the whole document.
        container = $(`
            <div class="ajax-container">
              <span class="to-replace">Replace me</span>
            </div>
        `).appendTo(body);
        handle.update({
            payload: '<span id="to-replace">Replaced</span>',
            selector: '.to-replace',
            mode: 'replace'
        });
        assert.deepEqual(bind_context.get(0), document);
        assert.deepEqual($('span#to-replace', bind_context).html(), 'Replaced');
        container.remove();

        // case unknown mode
        bind_context = null;
        handle.update({
            payload: '<span>Ends up in Limbo</span>',
            selector: '#not-matters-gets-ignored',
            mode: 'invalid'
        });
        assert.deepEqual(bind_context, null);
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test AjaxParser
    ///////////////////////////////////////////////////////////////////////////

    QUnit.test('Test AjaxParser', assert => {
        class TestAjaxDispatcher extends AjaxDispatcher {
            bind(node, evts) {
                assert.step('bind dispatcher: ' + evts);
            }
        }
        class TestAjaxForm extends AjaxForm {
            bind(form) {
                assert.step('bind form');
            }
        }

        let parser = new AjaxParser({
            dispatcher: new TestAjaxDispatcher(),
            form: new TestAjaxForm({})
        });

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
        assert.verifySteps(['bind dispatcher: click custom']);
        container.empty();

        // ajax event gets bound tom DOM events
        container.append($(`
          <span ajax:bind="click"
                ajax:event="event:selector">
          </span>
        `.trim()));
        parser.walk(container.get(0));
        assert.verifySteps(['bind dispatcher: click']);
        container.empty();

        // ajax overlay gets bound to DOM events
        container.append($(`
          <span ajax:bind="click"
                ajax:overlay="actionname">
          </span>
        `.trim()));
        parser.walk(container.get(0));
        assert.verifySteps(['bind dispatcher: click']);
        container.empty();

        // ajax form gets bound
        container.append($('<form ajax:form="true"></form>'));
        parser.walk(container.get(0));
        assert.verifySteps(['bind form']);
        container.empty();

        container.append($('<form class="ajax"></form>'));
        parser.walk(container.get(0));
        assert.verifySteps(['bind form']);
        container.empty();
    });

    ///////////////////////////////////////////////////////////////////////////
    // Test Ajax
    ///////////////////////////////////////////////////////////////////////////

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

    QUnit.test('Test Ajax.parseurl', assert => {
        let ajax = new Ajax();
        assert.deepEqual(
            ajax.parseurl('https://tld.com/'),
            'https://tld.com'
        );

    });

    QUnit.test('Test Ajax.parsequery', assert => {
        let ajax = new Ajax();
        assert.deepEqual(
            ajax.parsequery('https://tld.com?foo=bar'),
            {foo: 'bar'}
        );
        assert.deepEqual(
            ajax.parsequery('https://tld.com?foo=bar', true),
            '?foo=bar'
        );
    });

    QUnit.test('Test Ajax.parsepath', assert => {
        let ajax = new Ajax();
        assert.deepEqual(ajax.parsepath('https://tld.com/sub'), '/sub');
        assert.deepEqual(
            ajax.parsepath('https://tld.com/sub?foo=bar', true),
            '/sub?foo=bar'
        );
    });

    QUnit.test('Test Ajax.parsetarget', assert => {
        let ajax = new Ajax();
        assert.deepEqual(ajax.parsetarget('https://tld.com/sub?foo=bar'), {
            url: 'https://tld.com/sub',
            params: {foo: 'bar'},
            path: '/sub',
            query: '?foo=bar'
        });
    });
});
