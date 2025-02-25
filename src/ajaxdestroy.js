import {Parser} from "./parser";
import $ from 'jquery';

/**
 * DOM parser for destroying JavaScript instances attached to DOM elements
 * going to be removed.
 */
export class AjaxDestroy extends Parser {

    parse(node) {
        let instances = node._ajax_attached;
        if (instances !== undefined) {
            for (let instance of instances) {
                if (instance.destroy !== undefined) {
                    instance.destroy();
                } else {
                    console.warn('ts.ajax bound but no destroy method defined: '  + instance.constructor.name);
                }
            }
        }

        let attrs = this.node_attrs(node);
        if (attrs['ajax:bind']) { // unbind events bound from AjaxDispatcher
            let evts = attrs['ajax:bind'];
            $(node).off(evts);
        }
        if (window.bootstrap !== undefined) {
            let dd = window.bootstrap.Dropdown.getInstance(node);
            let tt = window.bootstrap.Tooltip.getInstance(node);
            if (dd) {
                dd.dispose();
            }
            if (tt) {
                tt.dispose();
            }
        }
        $(node).empty(); // remove retained comments
        $(node).off(); // remove event listeners
        $(node).removeData(); // remove cached data
        node = null;
    }
}

/**
 * Destroys an AJAX-bound element.
 *
 * @param {HTMLElement|jQuery} elem - The element to destroy. Can be a jQuery object or a DOM element.
 * @returns {void}
 */
export function ajax_destroy(elem) {
    elem = elem instanceof $ ? elem.get(0) : elem;
    let handle = new AjaxDestroy();
    handle.walk(elem);
}