import {Parser} from '../parser.js';

/**
 * DOM Parser for binding Ajax operations.
 */
export class AjaxParser extends Parser {

    /**
     * @param {Object} opts - Options.
     * @param {AjaxDispatcher} opts.dispatcher - The Ajax dispatcher.
     * @param {AjaxForm} opts.form - The Ajax form handler.
     */
    constructor(opts) {
        super();
        this.dispatcher = opts.dispatcher;
        this.form = opts.form;
    }

    /**
     * Parse a DOM node for Ajax attributes and bind operations.
     *
     * @param {Node} node - DOM element node.
     * @override
     */
    parse(node) {
        let attrs = this.node_attrs(node);
        if (attrs['ajax:bind'] && (
            attrs['ajax:action'] ||
            attrs['ajax:event'] ||
            attrs['ajax:overlay'])) {
            let evts = attrs['ajax:bind'];
            this.dispatcher.bind(node, evts);
        }
        if (attrs['ajax:form']) {
            this.form.bind(node);
        }
        if (node.tagName.toLowerCase() === 'form') {
            if (node.className.split(' ').includes('ajax')) {
                this.form.bind(node);
            }
        }
    }
}
