import {show_error} from '../overlay.js';
import {
    parse_url,
    set_default
} from '../utils.js';
import {AjaxOperation} from './util.js';


/**
 * Handle for action operation.
 */
export class AjaxAction extends AjaxOperation {

    constructor(opts) {
        set_default(opts, 'event', 'on_action');
        super(opts);
        this.spinner = opts.spinner;
        this._handle = opts.handle;
        this._request = opts.request;
    }

    execute(opts) {
        opts.success = this.complete.bind(this);
        this.request(opts);
    }

    request(opts) {
        opts.params['ajax.action'] = opts.name;
        opts.params['ajax.mode'] = opts.mode;
        opts.params['ajax.selector'] = opts.selector;
        this._request.execute({
            url: parse_url(opts.url) + '/ajaxaction',
            type: 'json',
            params: opts.params,
            success: opts.success
        });
    }

    complete(data) {
        if (!data) {
            show_error('Empty Response');
            this.spinner.hide();
        } else {
            this._handle.update(data);
            this._handle.next(data.continuation);
        }
    }

    handle(inst, opts) {
        let target = opts.target,
            action = opts.action;
        for (let action_ of this.parse_definition(action)) {
            let defs = action_.split(':');
            this.execute({
                name: defs[0],
                selector: defs[1],
                mode: defs[2],
                url: target.url,
                params: target.params
            });
        }
    }
}
