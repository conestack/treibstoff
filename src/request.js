import $ from 'jquery';
import { show_error } from './overlay.js';
import { spinner } from './spinner.js';
import { parse_query, parse_url, set_default } from './utils.js';

/**
 * HTTP request convenience object.
 *
 * Supports handling loading spinner, displaying error messages on failure and
 * automatic redirection for forbidden resources.
 */
export class HTTPRequest {
    /**
     * @param {Object} opts - Request settings.
     * @param {string} opts.spinner - ``LoadingSpinner`` instance to use.
     * Defaults to ``spinner`` singleton.
     * @param {string} opts.default_403 - Redirect path if requested resource
     * is forbidden. Defaults to '/login'.
     * @param {string} opts.win - Window instance to use for redirection.
     * Intended for unit tests. Defaults to ``window``.
     */
    constructor(opts) {
        this.spinner = set_default(opts, 'spinner', null);
        this.default_403 = set_default(opts, 'default_403', '/login');
        this._win = set_default(opts, 'win', window);
    }

    /**
     * Execute HTTP request.
     *
     * By default it sends requests of type ``html`` with method ``get`` and
     * displays an error message via ``ts.show_error`` if request fails.
     *
     * Given ``url`` might contain a query string. It gets parsed and written to
     * request parameters. If same request parameter is defined in URL query and
     * params object, latter one takes precedence.
     *
     * Success and error callback functions gets wrapped to handle ajax spinner
     * automatically.
     *
     * @param {Object} opts - Request options.
     * @param {string} opts.url - Request URL.
     * @param {Object} opts.params - Optional query parameters for request.
     * @param {string} opts.type - Optional request type. Defaults to 'html'.
     * @param {string} opts.method - Optional request method. Defaults to 'GET'.
     * @param {boolean} opts.cache - Optional flag whether to cache the response.
     * Defaults to False.
     * @param {function} opts.success - Callback if request is successful.
     * @param {function} opts.error - Optional callback if request fails.
     * Default callback displays error message with response status.
     */
    execute(opts) {
        if (opts.url.indexOf('?') !== -1) {
            const params_ = opts.params;
            opts.params = parse_query(opts.url);
            opts.url = parse_url(opts.url);
            for (const key in params_) {
                opts.params[key] = params_[key];
            }
        } else {
            set_default(opts, 'params', {});
        }
        set_default(opts, 'error', (_request, status, error) => {
            if (parseInt(status, 10) === 403) {
                this.redirect(this.default_403);
                return;
            }
            show_error(`<strong>${status}</strong>${error}`);
        });
        this.show_spinner();
        $.ajax({
            url: opts.url,
            dataType: set_default(opts, 'type', 'html'),
            data: opts.params,
            method: set_default(opts, 'method', 'GET'),
            success: (data, status, request) => {
                this.hide_spinner();
                opts.success(data, status, request);
            },
            error: (request, status, error) => {
                if (request.status === 0) {
                    this.hide_spinner(true);
                    return;
                }
                status = request.status || status;
                error = request.statusText || error;
                this.hide_spinner(true);
                opts.error(request, status, error);
            },
            cache: set_default(opts, 'cache', false),
        });
    }

    /**
     * Perform a redirect to given path.
     *
     * @param {string} path - Path to redirect to.
     */
    redirect(path) {
        const location = this._win.location;
        location.hash = '';
        location.pathname = path;
    }

    /**
     * Show loading spinner.
     */
    show_spinner() {
        if (this.spinner !== null) {
            this.spinner.show();
        }
    }

    /**
     * Hide loading spinner.
     *
     * @param {boolean} force - Flag whether to force hiding of spinner.
     */
    hide_spinner(force) {
        if (this.spinner !== null) {
            this.spinner.hide(force);
        }
    }
}

/**
 * Execute HTTP request.
 *
 * By default it sends requests of type ``html`` with method ``get`` and
 * displays an error message via ``ts.show_error`` if request fails::
 *
 *     ts.http_request({
 *         url: 'https://tld.com/some/path',
 *         params: {
 *             a: 'a',
 *             b: 'b'
 *         },
 *         type: 'json',
 *         method: 'POST',
 *         cache: true,
 *         success: function(data, status, request) {},
 *         error: function(request, status, error) {}
 *     });
 *
 * Given ``url`` might contain a query string. It gets parsed and written to
 * request parameters. If same request parameter is defined in URL query and
 * params object, latter one takes precedence.
 *
 * Success and error callback functions get wrapped to handle loading spinner
 * automatically.
 *
 * @param {Object} opts - Request options.
 * @param {string} opts.url - Request URL.
 * @param {Object} opts.params - Optional query parameters for request.
 * @param {string} opts.type - Optional request type. Defaults to 'html'.
 * @param {string} opts.method - Optional request method. Defaults to 'GET'.
 * @param {boolean} opts.cache - Optional flag whether to cache the response.
 * Defaults to false.
 * @param {function} opts.success - Callback if request is successful.
 * @param {function} opts.error - Optional callback if request fails.
 * Default callback displays error message with response status.
 * @param {string} opts.spinner - ``LoadingSpinner`` instance to use. Defaults
 * to ``spinner`` singleton.
 * @param {string} opts.default_403 - Redirect path if requested resource is
 * forbidden. Defaults to '/login'.
 * @param {string} opts.win - Window instance to use for redirection. Intended
 * for unit tests. Defaults to ``window``.
 */
export function http_request(opts) {
    new HTTPRequest({
        spinner: set_default(opts, 'spinner', spinner),
        win: set_default(opts, 'win', window),
        default_403: set_default(opts, 'default_403', '/login'),
    }).execute(opts);
}
