import $ from 'jquery';
import {
    ButtonProperty,
    InputProperty
} from './properties.js';
import {parse_svg} from './utils.js';

export class Parser {

    walk(node) {
       let children = node.childNodes;
       for (let i = 0; i < children.length; i++) {
           this.walk(children[i]);
       }
       if (node.nodeType === Node.ELEMENT_NODE) {
           this.parse(node);
       }
    }

    parse(node) {
    }

    node_attrs(node) {
        let attrs = {};
        for (let i in node.attributes) {
            let attr = node.attributes[i];
            if (attr && attr.nodeName) {
                attrs[attr.nodeName] = attr.nodeValue;
            }
        }
        return attrs;
    }
}

export class TemplateParser extends Parser {

    constructor(widget) {
        super();
        this.widget = widget;
        this.handlers = {};
    }

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

    wrap_node(node) {
        return node;
    }

    handle_elem_attr(node, attrs) {
        let elem_attr = attrs['t-elem'];
        if (elem_attr) {
            this.widget[elem_attr] = node;
        }
    }
}

export function extract_number(val) {
    if (isNaN(val)) {
        throw 'Input is not a number';
    }
    return Number(val);
}

export class HTMLParser extends TemplateParser {

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

    wrap_node(node) {
        return $(node);
    }

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

    handle_select(node, attrs) {
        let opts = attrs['t-options'];
        if (opts) {
            for (let opt of JSON.parse(opts)) {
                node.append(`<option value="${opt[0]}">${opt[1]}</option>`);
            }
        }
        this.handle_input(node, attrs);
    }

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

export class SVGParser extends TemplateParser {
}

export function compile_svg(inst, tmpl, container) {
    let elems = parse_svg(tmpl, container),
        parser = new SVGParser(inst);
    elems.forEach(function (elem, index) {
        parser.walk(elem);
    });
    return elems;
}
