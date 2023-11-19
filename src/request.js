import $ from 'jquery';
import {show_error} from './overlay.js';
import {
    parse_query,
    parse_url,
    set_default
} from './utils.js';
import {spinner} from './spinner.js';

/**
 * XMLHttpRequest helper.
 */
export class HTTPRequest {

    constructor(opts) {
        this.spinner = set_default(opts, 'spinner', null);
        this.win = set_default(opts, 'win', window);
        this.default_403 = set_default(opts, 'default_403', '/login');
    }

    execute(opts) {
        if (opts.url.indexOf('?') !== -1) {
            let params_ = opts.params;
            opts.params = parse_query(opts.url);
            opts.url = parse_url(opts.url);
            for (let key in params_) {
                opts.params[key] = params_[key];
            }
        } else {
            set_default(opts, 'params', {});
        }
        set_default(opts, 'error', (request, status, error) => {
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
            cache: set_default(opts, 'cache', false)
        });
    }

    redirect(path) {
        const location = this.win.location;
        location.hash = '';
        location.pathname = path;
    }

    show_spinner() {
        if (this.spinner !== null) {
            this.spinner.show();
        }
    }

    hide_spinner(force) {
        if (this.spinner !== null) {
            this.spinner.hide(force);
        }
    }
}

export function http_request(opts) {
    new HTTPRequest({
        spinner: set_default(opts, 'spinner', spinner),
        win: set_default(opts, 'win', window),
        default_403: set_default(opts, 'default_403', '/login')
    }).execute(opts);
}
