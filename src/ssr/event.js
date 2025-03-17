import $ from 'jquery';
import {AjaxOperation} from './util.js';


/**
 * Handle for event operation.
 */
export class AjaxEvent extends AjaxOperation {

    constructor(opts) {
        opts.event = 'on_event';
        super(opts);
    }

    execute(opts) {
        let create_event = this.create_event.bind(this);
        $(opts.selector).each(function() {
            $(this).trigger(create_event(opts.name, opts.target, opts.data));
        });
    }

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
