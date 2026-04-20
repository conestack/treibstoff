import $ from 'jquery';
import { HTTPRequest, http_request } from '../src/request.js';
import { LoadingSpinner, spinner } from '../src/spinner.js';

QUnit.module('treibstoff.request', (hooks) => {
    const ajax_orgin = $.ajax;

    hooks.afterEach(() => {
        $.ajax = ajax_orgin;
    });

    QUnit.test('Test HTTPRequest defaults', (assert) => {
        const spinner = new LoadingSpinner();
        const request = new HTTPRequest({ spinner: spinner });

        let ajax_opts;

        $.ajax = (opts) => {
            ajax_opts = {
                url: opts.url,
                params: opts.data,
                type: opts.dataType,
                method: opts.method,
                cache: opts.cache,
            };
            spinner.hide();
        };

        // defaults
        request.execute({ url: 'https://tld.com' });
        assert.deepEqual(ajax_opts, {
            url: 'https://tld.com',
            params: {},
            type: 'html',
            method: 'GET',
            cache: false,
        });

        // override defaults
        request.execute({
            url: 'https://tld.com',
            type: 'json',
            method: 'POST',
            cache: true,
        });
        assert.deepEqual(ajax_opts, {
            url: 'https://tld.com',
            params: {},
            type: 'json',
            method: 'POST',
            cache: true,
        });

        // params from url
        request.execute({ url: 'https://tld.com?foo=bar' });
        assert.deepEqual(ajax_opts.url, 'https://tld.com');
        assert.deepEqual(ajax_opts.params, { foo: 'bar' });

        // params from object
        request.execute({
            url: 'https://tld.com',
            params: { foo: 'foo' },
        });
        assert.deepEqual(ajax_opts.url, 'https://tld.com');
        assert.deepEqual(ajax_opts.params, { foo: 'foo' });

        // params from object take precedencs over url params
        request.execute({
            url: 'https://tld.com?foo=bar',
            params: { foo: 'baz' },
        });
        assert.deepEqual(ajax_opts.url, 'https://tld.com');
        assert.deepEqual(ajax_opts.params, { foo: 'baz' });
    });

    QUnit.test('Test HTTPRequest success callback', (assert) => {
        const spinner = new LoadingSpinner();
        const request = new HTTPRequest({ spinner: spinner });

        $.ajax = (opts) => {
            assert.step(`request count: ${spinner._count}`);
            opts.success('<span />', '200', {});
        };

        request.execute({
            url: 'https://tld.com',
            success: (data, status, request) => {
                assert.step(`data: ${data}`);
                assert.step(`status: ${status}`);
                assert.step(`request: ${JSON.stringify(request)}`);
            },
        });
        assert.verifySteps(['request count: 1', 'data: <span />', 'status: 200', 'request: {}']);
        assert.deepEqual(spinner._count, 0);
    });

    QUnit.test('Test HTTPRequest error callback', (assert) => {
        const spinner = new LoadingSpinner();
        const request = new HTTPRequest({ spinner: spinner });

        const err_opts = {
            request: { status: 0 },
            status: 0,
            error: '',
        };

        $.ajax = (opts) => {
            assert.step(`request count: ${spinner._count}`);
            opts.error(err_opts.request, err_opts.status, err_opts.error);
        };

        const err_cb = (_request, status, error) => {
            assert.step(`status: ${status}`);
            assert.step(`error: ${error}`);
        };

        // case status 0
        request.execute({
            url: 'https://tld.com',
            error: err_cb,
        });
        assert.verifySteps(['request count: 1']);
        assert.deepEqual(spinner._count, 0);

        // case status and error from request
        err_opts.request.status = 507;
        err_opts.request.statusText = 'Insufficient Storage';
        request.execute({
            url: 'https://tld.com',
            error: err_cb,
        });
        assert.verifySteps(['request count: 1', 'status: 507', 'error: Insufficient Storage']);
        assert.deepEqual(spinner._count, 0);

        // case status and error from function arguments
        err_opts.request = {};
        err_opts.status = '501';
        err_opts.error = 'Not Implemented';

        request.execute({
            url: 'https://tld.com',
            error: err_cb,
        });
        assert.verifySteps(['request count: 1', 'status: 501', 'error: Not Implemented']);
        assert.deepEqual(spinner._count, 0);
    });

    QUnit.test('Test HTTPRequest default error callback', (assert) => {
        const spinner = new LoadingSpinner();
        const err_opts = {
            request: {},
            status: 0,
            error: '',
        };

        $.ajax = (opts) => {
            assert.step(`request count: ${spinner._count}`);
            opts.error(err_opts.request, err_opts.status, err_opts.error);
        };

        class TestLocation {
            set hash(val) {
                assert.step(`hash: ${val}`);
            }
            set pathname(val) {
                assert.step(`pathname: ${val}`);
            }
        }

        const request = new HTTPRequest({
            spinner: spinner,
            win: {
                location: new TestLocation(),
            },
        });

        // case redirect to login
        err_opts.status = '403';
        err_opts.error = 'Forbidden';
        request.execute({ url: 'https://tld.com' });
        assert.verifySteps(['request count: 1', 'hash: ', 'pathname: /login']);
        assert.deepEqual(spinner._count, 0);

        // case show error message
        err_opts.status = '501';
        err_opts.error = 'Not Implemented';
        request.execute({ url: 'https://tld.com' });
        assert.verifySteps(['request count: 1']);
        const err_msg = $('.modal.error').data('overlay');
        assert.strictEqual(err_msg.content, '<strong>501</strong>Not Implemented');
        err_msg.close();
        assert.deepEqual(spinner._count, 0);
    });

    QUnit.test('Test http_request', (assert) => {
        $.ajax = (opts) => {
            opts.success('<span />', '200', {});
        };

        http_request({
            url: 'https://tld.com',
            success: (data, status, request) => {
                assert.step(`data: ${data}`);
                assert.step(`status: ${status}`);
                assert.step(`request: ${JSON.stringify(request)}`);
            },
        });
        assert.verifySteps(['data: <span />', 'status: 200', 'request: {}']);
        assert.deepEqual(spinner._count, 0);
    });
});
