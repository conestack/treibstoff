import $ from 'jquery';
import { show_message } from '../overlay.js';
import { AjaxDestroy } from './destroy.js';
import { AjaxUtil } from './util.js';

/**
 * Handle for DOM manipulation and Ajax continuation operations.
 */
export class AjaxHandle extends AjaxUtil {
    /**
     * @param {Ajax} ajax - The Ajax singleton instance.
     */
    constructor(ajax) {
        super();
        this.ajax = ajax;
        this.spinner = ajax.spinner;
    }

    /**
     * Walk DOM elements and destroy attached instances.
     *
     * @param {jQuery} context - jQuery wrapped elements to destroy.
     */
    destroy(context) {
        const parser = new AjaxDestroy();
        context.each(function () {
            parser.walk(this);
        });
    }

    /**
     * Update DOM with server response payload.
     *
     * @param {Object} opts - Update options.
     * @param {string} opts.payload - HTML payload.
     * @param {string} opts.selector - CSS selector of target element.
     * @param {string} opts.mode - ``'replace'`` or ``'inner'``.
     */
    update(opts) {
        let payload = opts.payload,
            selector = opts.selector,
            mode = opts.mode,
            context;
        if (mode === 'replace') {
            const old_context = $(selector);
            this.destroy(old_context);
            old_context.replaceWith(payload);
            context = $(selector);
            if (context.length) {
                this.ajax.bind(context.parent());
            } else {
                this.ajax.bind($(document));
            }
        } else if (mode === 'inner') {
            context = $(selector);
            this.destroy(context.children());
            context.html(payload);
            this.ajax.bind(context);
        }
    }

    /**
     * Execute continuation operations from the server response.
     *
     * @param {Array} operations - Array of operation definitions. Each
     * has a ``type`` property (path, action, event, overlay, message).
     */
    next(operations) {
        if (!operations || !operations.length) {
            return;
        }
        this.spinner.hide();
        for (const op of operations) {
            const type = op.type;
            delete op.type;
            if (type === 'path') {
                this.ajax.path(op);
            } else if (type === 'action') {
                const target = this.parse_target(op.target);
                op.url = target.url;
                op.params = target.params;
                this.ajax.action(op);
            } else if (type === 'event') {
                this.ajax.trigger(op);
            } else if (type === 'overlay') {
                const target = this.parse_target(op.target);
                op.url = target.url;
                op.params = target.params;
                this.ajax.overlay(op);
            } else if (type === 'message') {
                // if flavor given, message rendered in overlay
                if (op.flavor) {
                    show_message({
                        message: op.payload,
                        flavor: op.flavor,
                        css: op.css ? op.css : '',
                        title: op.title ? op.title : '',
                    });
                    // no overlay message, set message payload at selector
                } else {
                    $(op.selector).html(op.payload);
                }
            }
        }
    }
}
