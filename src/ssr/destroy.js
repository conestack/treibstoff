import {Parser} from "../parser";
import $ from 'jquery';

var destroy_handles = [];

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
            node._ajax_attached = null; // remove class instances from memory
        }

        // Run all registered callbacks
        for (let cb of destroy_handles) {
            cb(node);
        }
        // remove event listeners, cached data and retained comments
        $(node).off().removeData().empty();
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
    handle = null;
}

/**
 * Registers a callback to be executed on ajax destroy.
 *
 * @param {Function} callback - The callback to execute on each node.
 * @returns {void}
 */
export function register_ajax_destroy_handle(callback) {
    if (!destroy_handles.includes(callback)) {
        destroy_handles.push(callback);
    } else {
        console.warn(
            'Warning: Ajax destroy handle already registered, skipping registration: '
            + callback
        );
    }
}

/**
 * Deregisters a previously registered callback from ajax destroy.
 *
 * @param {Function} callback - The callback to deregister.
 * @returns {void}
 */
export function deregister_ajax_destroy_handle(callback) {
    const index = destroy_handles.indexOf(callback);
    if (index > -1) {
        destroy_handles.splice(index, 1);
    } else {
        console.warn(
            'Warning: Ajax destroy handle is not registered and cannot be deregistered: '
            + callback
        );
    }
}
