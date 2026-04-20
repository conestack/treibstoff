import { show_error } from '../overlay.js';
import { parse_url, set_default } from '../utils.js';
import { AjaxOperation } from './util.js';

/**
 * Handle for action operation.
 */
export class AjaxAction extends AjaxOperation {
    /**
     * @param {Object} opts - Options.
     * @param {AjaxDispatcher} opts.dispatcher - The Ajax dispatcher.
     * @param {LoadingSpinner} opts.spinner - Loading spinner instance.
     * @param {AjaxHandle} opts.handle - DOM manipulation handle.
     * @param {HTTPRequest} opts.request - HTTP request instance.
     */
    constructor(opts) {
        set_default(opts, 'event', 'on_action');
        super(opts);
        this.spinner = opts.spinner;
        this._handle = opts.handle;
        this._request = opts.request;
    }

    /**
     * Execute an action request.
     *
     * @param {Object} opts - Action options (name, selector, mode, url, params).
     */
    execute(opts) {
        opts.success = this.complete.bind(this);
        this.request(opts);
    }

    /**
     * Send the AJAX action request to the server.
     *
     * @param {Object} opts - Request options.
     */
    request(opts) {
        opts.params['ajax.action'] = opts.name;
        opts.params['ajax.mode'] = opts.mode;
        opts.params['ajax.selector'] = opts.selector;
        this._request.execute({
            url: `${parse_url(opts.url)}/ajaxaction`,
            type: 'json',
            params: opts.params,
            success: opts.success,
        });
    }

    /**
     * Handle the action response.
     *
     * @param {Object} data - Server response data.
     */
    complete(data) {
        if (!data) {
            show_error('Empty Response');
            this.spinner.hide();
        } else {
            this._handle.update(data);
            this._handle.next(data.continuation);
        }
    }

    /** @override */
    handle(_inst, opts) {
        const target = opts.target,
            action = opts.action;
        for (const action_ of this.parse_definition(action)) {
            const defs = action_.split(':');
            this.execute({
                name: defs[0],
                selector: defs[1],
                mode: defs[2],
                url: target.url,
                params: target.params,
            });
        }
    }
}
