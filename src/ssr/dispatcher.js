import $ from 'jquery';
import {show_dialog} from '../overlay.js';
import {AjaxUtil} from './util.js';

/**
 * DOM event handle for elements defining Ajax operations.
 */
export class AjaxDispatcher extends AjaxUtil {

    bind(node, evts) {
        $(node).off(evts).on(evts, this.dispatch_handle.bind(this));
    }

    dispatch_handle(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        let elem = $(evt.currentTarget),
            opts = {
                elem: elem,
                event: evt
            };
        if (elem.attr('ajax:confirm')) {
            show_dialog({
                message: elem.attr('ajax:confirm'),
                on_confirm: function(inst) {
                    this.dispatch(opts);
                }.bind(this)
            });
        } else {
            this.dispatch(opts);
        }
    }

    dispatch(opts) {
        let elem = opts.elem,
            event = opts.event;
        if (elem.attr('ajax:action')) {
            this.trigger('on_action', {
                target: this.action_target(elem, event),
                action: elem.attr('ajax:action')
            });
        }
        if (elem.attr('ajax:event')) {
            this.trigger('on_event', {
                target: elem.attr('ajax:target'),
                event: elem.attr('ajax:event')
            });
        }
        if (elem.attr('ajax:overlay')) {
            this.trigger('on_overlay', {
                target: this.action_target(elem, event),
                overlay: elem.attr('ajax:overlay'),
                css: elem.attr('ajax:overlay-css'),
                uid: elem.attr('ajax:overlay-uid'),
                title: elem.attr('ajax:overlay-title')
            });
        }
        if (elem.attr('ajax:path')) {
            this.trigger('on_path', {
                elem: elem,
                event: event
            });
        }
    }
}
