import {Parser} from "../parser";
import $ from 'jquery';

function destroy_bootstrap(node) {
    let dd = window.bootstrap.Dropdown.getInstance(node);
    let tt = window.bootstrap.Tooltip.getInstance(node);
    if (dd) {
        dd.dispose();
    }
    if (tt) {
        tt.dispose();
    }
    dd = null;
    tt = null;
}

/**
 * DOM parser for destroying JavaScript instances attached to DOM elements
 * going to be removed.
 */
export class AjaxDestroy extends Parser {

    constructor() {
        super();
        this.callbacks = [];
        if (window.bootstrap !== undefined) {
            this.register_cb(destroy_bootstrap);
        }
    }

    /**
     * Registers a callback to be executed during destruction.
     * @param {Function} cb - The destroy callback function.
     */
    register_cb(cb) {
        this.callbacks.push(cb);
    }

    /**
     * Unregisters a callback.
     * @param {Function} cb - The callback to deregister.
     */
    unregister_cb(cb) {
        const index = this.callbacks.indexOf(cb);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

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

        let attrs = this.node_attrs(node);
        if (attrs['ajax:bind']) { // unbind events bound from AjaxDispatcher
            let evts = attrs['ajax:bind'];
            $(node).off(evts);
        }

        // Run all registered callbacks
        for (let cb of this.callbacks) {
            cb(node);
        }

        $(node).empty(); // remove retained comments
        $(node).off(); // remove event listeners
        $(node).removeData(); // remove cached data
        $.cleanData([node]); // explicitly remove from jQuery cache

        node = null;
        instances = null;
        attrs = null;
    }
}

/**
 * Destroys an AJAX-bound element.
 *
 * @param {HTMLElement|jQuery} elem - The element to destroy. Can be a jQuery object or a DOM element.
 * @returns {void}
 */
export function ajax_destroy(elem, callbacks=[]) {
    elem = elem instanceof $ ? elem.get(0) : elem;
    let handle = new AjaxDestroy();
    for (let cb of callbacks) {
        handle.register_cb(cb);
    }
    handle.walk(elem);
    handle = null;
}
