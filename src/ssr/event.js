import $ from 'jquery';
import {AjaxOperation} from './util.js';


/**
 * Handle for event operation.
 */
export class AjaxEvent extends AjaxOperation {

    /**
     * @param {Object} opts - Options.
     * @param {AjaxDispatcher} opts.dispatcher - The Ajax dispatcher.
     */
    constructor(opts) {
        opts.event = 'on_event';
        super(opts);
    }

    /**
     * Create and trigger a custom event on elements matching a selector.
     *
     * @param {Object} opts - Event options.
     * @param {string} opts.name - Event name.
     * @param {string} opts.selector - CSS selector.
     * @param {string|Object} opts.target - Event target URL or parsed target.
     * @param {*} opts.data - Optional event data.
     */
    execute(opts) {
        let create_event = this.create_event.bind(this);
        $(opts.selector).each(function() {
            $(this).trigger(create_event(opts.name, opts.target, opts.data));
        });
    }

    /**
     * Create a jQuery event with ``ajaxtarget`` and ``ajaxdata`` properties.
     *
     * @param {string} name - Event name.
     * @param {string|Object} target - URL or parsed target object.
     * @param {*} data - Optional data.
     * @returns {jQuery.Event} The created event.
     */
    create_event(name, target, data) {
        let evt = $.Event(name);
        if (target.url) {
            evt.ajaxtarget = target;
        } else {
            evt.ajaxtarget = this.parse_target(target);
        }
        evt.ajaxdata = data;
        return evt;
    }

    /** @override */
    handle(inst, opts) {
        let target = opts.target,
            event = opts.event;
        for (let event_ of this.parse_definition(event)) {
            let def = event_.split(':');
            this.execute({
                name: def[0],
                selector: def[1],
                target: target
            });
        }
    }
}
