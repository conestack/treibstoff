import $ from 'jquery';
import {
    parse_path,
    parse_query,
    parse_url,
} from '../utils.js';
import {Events} from '../events.js';

/**
 * Ajax utility mixin.
 */
export class AjaxUtil extends Events {

    /**
     * Parse URL, query and path from URL string::
     *
     *     >> ts.ajax.parse_target('http://tld.com/some/path?param=value');
     *     -> {
     *         url: 'http://tld.com/some/path',
     *         params: { param: 'value' },
     *         path: '/some/path',
     *         query: '?param=value'
     *     }
     *
     * @param {string} target - URL string to parse.
     * @returns {Object} Containing ``url``, ``params``, ``path`` and ``query``.
     */
    parse_target(target) {
        return {
            url: target ? parse_url(target) : undefined,
            params: target ? parse_query(target) : {},
            path: target ? parse_path(target) : undefined,
            query: target ? parse_query(target, true) : undefined
        };
    }

    /**
     * Parse ajax operation definition from string into array.
     *
     * XXX: Fails if spaces in selector. Fix.
     *
     * @param {string} val - Definition string to parse.
     * @returns {Array} Containing operation definitions.
     */
    parse_definition(val) {
        return val.replace(/\s+/g, ' ').split(' ');
    }

    /**
     * Get ajax target for action.
     *
     * Lookup ``ajaxtarget`` on event, fall back to ``ajax:target`` attribute
     * on elem.
     *
     * @param {$} elem - jQuery wrapped DOM element.
     * @param {$.Event} evt - jQuery event.
     * @returns {Object} Target for event.
     */
    action_target(elem, evt) {
        if (evt.ajaxtarget) {
            return evt.ajaxtarget;
        }
        return this.parse_target(elem.attr('ajax:target'));
    }
}

/**
 * Abstract Ajax operation.
 */
export class AjaxOperation extends AjaxUtil {

    /**
     * Create Ajax operation.
     *
     * Binds this operation to given dispatcher event.
     *
     * @param {Object} opts - Ajax operation options.
     * @param {AjaxDispatcher} opts.dispatcher - Dispatcher instance.
     * @param {string} opts.event - AjaxDispatecher event to bind.
     */
    constructor(opts) {
        super();
        this.event = opts.event;
        this.dispatcher = opts.dispatcher;
        this.dispatcher.on(this.event, this.handle.bind(this));
    }

    /**
     * Execute operation as JavaScript API.
     *
     * @abstract
     * @param {Object} opts - Options needed for operation execution.
     */
    execute(opts) {
        throw 'Abstract AjaxOperation does not implement execute';
    }

    /**
     * Handle operation from dispatcher.
     *
     * @abstract
     * @param {AjaxDispatcher} inst - Dispatcher instance.
     * @param {Object} opts - Options needed for operation execution.
     */
    handle(inst, opts) {
        throw 'Abstract AjaxOperation does not implement handle';
    }
}
