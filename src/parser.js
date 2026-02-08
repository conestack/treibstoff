import $ from 'jquery';
import {
    ButtonProperty,
    InputProperty
} from './properties.js';
import {parse_svg} from './utils.js';

/**
 * Base DOM tree walker and parser.
 *
 * Walks a DOM tree depth-first and calls ``parse`` for each element node.
 * Subclasses override ``parse`` to implement custom behavior.
 */
export class Parser {

    /**
     * Recursively walk the DOM tree starting at the given node.
     *
     * @param {Node} node - DOM node to start walking from.
     */
    walk(node) {
       let children = node.childNodes;
       for (let child of children) {
           this.walk(child);
       }
       if (node.nodeType === Node.ELEMENT_NODE) {
           this.parse(node);
       }
    }

    /**
     * Parse a single element node. Override in subclasses.
     *
     * @param {Node} node - DOM element node.
     */
    parse(node) {
    }

    /**
     * Extract all attributes from a DOM element node as a plain object.
     *
     * @param {Node} node - DOM element node.
     * @returns {Object} Map of attribute names to values.
     */
    node_attrs(node) {
        let attrs = {};
        for (let attr of node.attributes) {
            if (attr && attr.nodeName) {
                attrs[attr.nodeName] = attr.nodeValue;
            }
        }
        return attrs;
    }
}

/**
 * Template parser that processes ``t-elem`` attributes.
 *
 * When a node has a ``t-elem="name"`` attribute, the node is assigned
 * to ``widget[name]``. Subclasses can register tag-specific handlers.
 */
export class TemplateParser extends Parser {

    /**
     * @param {Object} widget - The widget instance to attach parsed
     * elements and properties to.
     */
    constructor(widget) {
        super();
        this.widget = widget;
        this.handlers = {};
    }

    /** @override */
    parse(node) {
        let attrs = this.node_attrs(node),
            wrapped = this.wrap_node(node);
        this.handle_elem_attr(wrapped, attrs);
        let tag = node.tagName.toLowerCase(),
            handler = this.handlers[tag];
        if (handler) {
            handler(wrapped, attrs);
        }
    }

    /**
     * Wrap a raw DOM node for use in handlers. Override in subclasses
     * to return e.g. a jQuery-wrapped node.
     *
     * @param {Node} node - Raw DOM node.
     * @returns {Node} The wrapped node.
     */
    wrap_node(node) {
        return node;
    }

    /**
     * Process the ``t-elem`` attribute on a node.
     *
     * @param {Node} node - The (possibly wrapped) DOM node.
     * @param {Object} attrs - Parsed attributes map.
     */
    handle_elem_attr(node, attrs) {
        let elem_attr = attrs['t-elem'];
        if (elem_attr) {
            this.widget[elem_attr] = node;
        }
    }
}

/**
 * Extract a numeric value from a string. Throws if the value is not a
 * valid number.
 *
 * @param {string} val - String value to extract.
 * @returns {number} The extracted number.
 * @throws {string} If the value is not a number.
 */
export function extract_number(val) {
    if (isNaN(val)) {
        throw 'Input is not a number';
    }
    return Number(val);
}

/**
 * HTML template parser.
 *
 * Extends ``TemplateParser`` with handlers for ``input``, ``select``
 * and ``button`` elements. Processes these template attributes:
 *
 * - ``t-elem`` — assign element to widget property
 * - ``t-prop`` — create a bound property on the widget
 * - ``t-val`` — initial property value
 * - ``t-type`` — value extractor type (e.g. ``"number"``)
 * - ``t-extract`` — custom extractor method name on widget
 * - ``t-state-evt`` — custom state event name for InputProperty
 * - ``t-options`` — JSON array of ``[value, label]`` pairs for selects
 * - ``t-bind-click``, ``t-bind-down``, ``t-bind-up`` — bind widget
 *   methods to button events
 */
export class HTMLParser extends TemplateParser {

    /**
     * @param {Object} widget - The widget instance.
     */
    constructor(widget) {
        super(widget);
        this.handlers = {
            input: this.handle_input.bind(this),
            select: this.handle_select.bind(this),
            button: this.handle_button.bind(this)
        }
        this.extractors = {
            number: extract_number
        }
    }

    /** @override */
    wrap_node(node) {
        return $(node);
    }

    /**
     * Handle an ``<input>`` element with ``t-prop`` attribute.
     *
     * @param {jQuery} node - jQuery wrapped input element.
     * @param {Object} attrs - Parsed attributes map.
     */
    handle_input(node, attrs) {
        let prop = attrs['t-prop'];
        if (!prop) {
            return;
        }
        let widget = this.widget,
            extract = this.extractors[attrs['t-type']];
        if (attrs['t-extract']) {
            extract = widget[attrs['t-extract']];
        }
        let val = attrs['t-val'];
        if (extract) {
            val = extract(val);
        }
        new InputProperty(widget, prop, {
            ctx: node,
            ctxa: attrs['t-elem'],
            val: val,
            extract: extract,
            state_evt: attrs['t-state-evt']
        });
    }

    /**
     * Handle a ``<select>`` element. Populates options from ``t-options``
     * attribute if present, then delegates to ``handle_input``.
     *
     * @param {jQuery} node - jQuery wrapped select element.
     * @param {Object} attrs - Parsed attributes map.
     */
    handle_select(node, attrs) {
        let opts = attrs['t-options'];
        if (opts) {
            for (let opt of JSON.parse(opts)) {
                node.append(`<option value="${opt[0]}">${opt[1]}</option>`);
            }
        }
        this.handle_input(node, attrs);
    }

    /**
     * Handle a ``<button>`` element with ``t-prop`` attribute.
     * Creates a ``ButtonProperty`` and binds ``t-bind-*`` event handlers.
     *
     * @param {jQuery} node - jQuery wrapped button element.
     * @param {Object} attrs - Parsed attributes map.
     */
    handle_button(node, attrs) {
        let prop = attrs['t-prop'];
        if (!prop) {
            return;
        }
        let widget = this.widget;
        new ButtonProperty(widget, prop, {
            ctx: node,
            ctxa: attrs['t-elem'],
            val: attrs['t-val']
        });
        for (let evt of ['down', 'up', 'click']) {
            if (attrs[`t-bind-${evt}`]) {
                let handler = widget[attrs[`t-bind-${evt}`]].bind(widget);
                this.widget.on(`on_${prop}_${evt}`, handler);
            }
        }
    }
}

/**
 * Compile an HTML template string and attach parsed elements and
 * properties to the given instance.
 *
 * @param {Object} inst - Instance to attach elements/properties to.
 * @param {string} tmpl - HTML template string.
 * @param {jQuery} container - Optional container to append the compiled
 * element to.
 * @returns {jQuery} The compiled jQuery element.
 */
export function compile_template(inst, tmpl, container) {
    let elem = $(tmpl.trim());
    if (container) {
        container.append(elem);
    }
    let parser = new HTMLParser(inst);
    elem.each(function() {
        parser.walk(this);
    });
    return elem;
}

/**
 * SVG template parser. Extends ``TemplateParser`` for SVG namespace
 * elements. Processes ``t-elem`` attributes on SVG nodes.
 */
export class SVGParser extends TemplateParser {
}

/**
 * Compile an SVG template string and attach parsed elements to the
 * given instance.
 *
 * @param {Object} inst - Instance to attach elements to.
 * @param {string} tmpl - SVG template string.
 * @param {SVGElement} container - SVG container element to append to.
 * @returns {Array} Array of parsed SVG elements.
 */
export function compile_svg(inst, tmpl, container) {
    let elems = parse_svg(tmpl, container),
        parser = new SVGParser(inst);
    elems.forEach(function (elem, index) {
        parser.walk(elem);
    });
    return elems;
}
