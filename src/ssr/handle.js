import $ from 'jquery';
import {show_message} from '../overlay.js';
import {AjaxDestroy} from './destroy.js';
import {AjaxUtil} from './util.js';

/**
 * Handle for DOM manipulation and Ajax continuation operations.
 */
export class AjaxHandle extends AjaxUtil {

    constructor(ajax) {
        super();
        this.ajax = ajax;
        this.spinner = ajax.spinner;
    }

    destroy(context) {
        let parser = new AjaxDestroy();
        context.each(function() {
            parser.walk(this);
        });
    }

    update(opts) {
        let payload = opts.payload,
            selector = opts.selector,
            mode = opts.mode,
            context;
        if (mode === 'replace') {
            let old_context = $(selector);
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

    next(operations) {
        if (!operations || !operations.length) {
            return;
        }
        this.spinner.hide();
        for (let op of operations) {
            let type = op.type;
            delete op.type;
            if (type === 'path') {
                this.ajax.path(op);
            } else if (type === 'action') {
                let target = this.parse_target(op.target);
                op.url = target.url;
                op.params = target.params;
                this.ajax.action(op);
            } else if (type === 'event') {
                this.ajax.trigger(op);
            } else if (type === 'overlay') {
                let target = this.parse_target(op.target);
                op.url = target.url;
                op.params = target.params;
                this.ajax.overlay(op);
            } else if (type === 'message') {
                // if flavor given, message rendered in overlay
                if (op.flavor) {
                    show_message({
                        message: op.payload,
                        flavor: op.flavor
                    });
                // no overlay message, set message payload at selector
                } else {
                    $(op.selector).html(op.payload);
                }
            }
        }
    }
}
