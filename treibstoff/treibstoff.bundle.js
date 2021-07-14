var ts = (function (exports, $) {
    'use strict';

    class Ajax {

        constructor() {
            console.log('Hello Ajax');
            console.log($);
        }
    }

    class Events {

        constructor() {
            this._subscribers = {};
            this._suppress_events = false;
        }

        on(event, subscriber) {
            let subscribers = this._subscribers[event];
            if (subscribers === undefined) {
                this._subscribers[event] = subscribers = new Array();
            }
            if (this._contains_subscriber(event, subscriber)) {
                return this;
            }
            subscribers.push(subscriber);
            return this;
        }

        off(event, subscriber) {
            let subscribers = this._subscribers[event];
            if (subscribers === undefined) {
                return this;
            }
            if (!subscriber) {
                delete this._subscribers[event];
                return this;
            }
            let idx = subscribers.indexOf(subscriber);
            if (idx > -1) {
                subscribers = subscribers.splice(idx, 1);
            }
            this._subscribers[event] = subscribers;
            return this;
        }

        trigger(event, options) {
            if (this._suppress_events) {
                return;
            }
            if (this[event]) {
                this[event](options);
            }
            let subscribers = this._subscribers[event];
            if (!subscribers) {
                return this;
            }
            for (let i = 0; i < subscribers.length; i++) {
                subscribers[i](this, options);
            }
            return this;
        }

        suppress_events(fn) {
            this._suppress_events = true;
            fn();
            this._suppress_events = false;
        }

        _contains_subscriber(event, subscriber) {
            let subscribers = this._subscribers[event];
            if (!subscribers) {
                return false;
            }
            for (let i = 0; i < subscribers.length; i++) {
                if (subscribers[i] === subscriber) {
                    return true;
                }
            }
            return false;
        }
    }

    function uuid4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    function json_merge(base, other) {
        let ret = {};
        for (let ob of [base, other]) {
            for (let name in ob) {
                ret[name] = ob[name];
            }
        }
        return ret;
    }

    const svg_ns = 'http://www.w3.org/2000/svg';

    function set_svg_attrs(el, opts) {
        for (let n in opts) {
            el.setAttributeNS(null, n, opts[n]);
        }
    }

    function create_svg_elem(name, opts, container) {
        let el = document.createElementNS(svg_ns, name);
        set_svg_attrs(el, opts);
        if (container !== undefined) {
            container.appendChild(el);
        }
        return el;
    }

    function parse_svg(tmpl, container) {
        var wrapper = create_svg_elem('svg', {});
        wrapper.innerHTML = tmpl.trim();
        let elems = [];
        let children = wrapper.childNodes;
        for (let i = 0; i < children.length; i++) {
            let elem = children[i];
            elems.push(elem);
            wrapper.removeChild(elem);
            if (container !== undefined) {
                container.appendChild(elem);
            }
        }
        return elems;
    }

    function load_svg(url, callback) {
        $.get(url, function(data) {
            let svg = $(data).find('svg');
            svg.removeAttr('xmlns:a');
            callback(svg);
        }.bind(this), 'xml');
    }

    class Property {

        constructor(inst, name, val) {
            this._inst = inst;
            this._name = name;
            this._val = null;
            Object.defineProperty(inst, name, {
                get: this.get.bind(this),
                set: this.set.bind(this),
                enumerable: true
            });
            if (val !== undefined) {
                inst[name] = val;
            }
        }

        get() {
            return this._val;
        }

        set(val) {
            let changed = val !== this._val;
            this._val = val;
            if (changed) {
                this.trigger(`on_${this._name}`, val);
            }
        }

        trigger(evt, opts) {
            let inst = this._inst;
            if (inst.trigger) {
                inst.trigger(evt, opts);
            }
        }
    }

    class BoundProperty extends Property {

        constructor(inst, name, opts) {
            super(inst, name);
            this._ctxa = 'elem';
            if (!opts) {
                this._ctx = inst[this._ctxa];
                this._tgt = name;
            } else {
                this._ctxa = opts.ctxa !== undefined ? opts.ctxa : this._ctxa;
                this._ctx = opts.ctx !== undefined ? opts.ctx : inst[this._ctxa];
                this._tgt = opts.tgt !== undefined ? opts.tgt : name;
            }
            let val = opts ? opts.val : undefined;
            if (val !== undefined) {
                inst[name] = val;
            }
        }

        get name() {
            return this._name;
        }

        get val() {
            return this._val;
        }

        get ctx() {
            if (!this._ctx) {
                this._ctx = this._inst[this._ctxa];
            }
            return this._ctx;
        }

        get tgt() {
            return this._tgt;
        }
    }

    class DataProperty extends BoundProperty {

        constructor(inst, name, opts) {
            if (!opts) {
                opts = {ctx: inst.data};
            } else {
                opts.ctx = opts.ctx !== undefined ? opts.ctx : inst.data;
            }
            opts.ctxa = 'data';
            super(inst, name, opts);
        }

        set(val) {
            this.ctx[this.tgt] = val;
            super.set(val);
        }
    }

    class AttrProperty extends BoundProperty {

        set(val) {
            this.ctx.attr(this.tgt, val);
            super.set(val);
        }
    }

    class TextProperty extends BoundProperty {

        set(val) {
            this.ctx.text(val);
            super.set(val);
        }
    }

    class CSSProperty extends BoundProperty {

        set(val) {
            $(this.ctx).css(this.tgt, val);
            super.set(val);
        }
    }

    class InputProperty extends BoundProperty {

        constructor(inst, name, opts) {
            super(inst, name, opts);
            this.extract = opts ? opts.extract : null;
            this.state_evt = opts
                ? (opts.state_evt ? opts.state_evt : 'on_prop_state')
                : 'on_prop_state';
            this.error = false;
            this.msg = '';
            this._err_marker = {};
            this.ctx.on('change', this._change.bind(this));
        }

        set(val) {
            $(this.ctx).val(val);
            this._set(val);
        }

        _change(evt) {
            let val = $(evt.currentTarget).val();
            this._set(val);
        }

        _set(val) {
            val = this._extract(val);
            if (val !== this._err_marker) {
                super.set(val);
            }
            if (this.extract) {
                this.trigger(this.state_evt, this);
            }
        }

        _extract(val) {
            if (this.extract) {
                try {
                    val = this.extract(val);
                    this.error = false;
                    this.msg = '';
                } catch (err) {
                    val = this._err_marker;
                    this.error = true;
                    this.msg = err;
                }
            }
            return val;
        }
    }

    class ButtonProperty extends BoundProperty {

        constructor(inst, name, opts) {
            super(inst, name, opts);
            this.ctx.on('mousedown', this._down.bind(this));
            this.ctx.on('mouseup', this._up.bind(this));
        }

        set(val) {
            this.ctx.text(val);
            super.set(val);
        }

        _down(evt) {
            this.trigger(`on_${this.name}_down`, this);
        }

        _up(evt) {
            this.trigger(`on_${this.name}_up`, this);
        }
    }

    class SVGProperty extends BoundProperty {

        set(val) {
            let attrs = {};
            attrs[this._name] = val;
            set_svg_attrs(this.ctx, attrs);
            super.set(val);
        }
    }

    class Parser {

        constructor(widget) {
            this.widget = widget;
            this.handlers = {};
        }

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
            let attrs = this.node_attrs(node),
                wrapped = this.wrap_node(node);
            this.handle_elem_attr(wrapped, attrs);
            let tag = node.tagName.toLowerCase(),
                handler = this.handlers[tag];
            if (handler) {
                handler(wrapped, attrs);
            }
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

    // ************************************************************************
    // HTML parser
    // ************************************************************************

    function extract_number(val) {
        if (isNaN(val)) {
            throw 'Input is not a number';
        }
        return Number(val);
    }

    function compile_template(inst, tmpl, container) {
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

    class HTMLParser extends Parser {

        constructor(widget) {
            super(widget);
            this.handlers = {
                input: this.handle_input.bind(this),
                select: this.handle_select.bind(this),
                button: this.handle_button.bind(this)
            };
            this.extractors = {
                number: extract_number
            };
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
            new ButtonProperty(this.widget, prop, {
                ctx: node,
                ctxa: attrs['t-elem'],
                val: attrs['t-val']
            });
        }
    }

    // ************************************************************************
    // SVG parser
    // ************************************************************************

    function compile_svg(inst, tmpl, container) {
        let elems = parse_svg(tmpl, container),
            parser = new SVGParser(inst);
        elems.forEach(function (elem, index) {
            parser.walk(elem);
        });
        return elems;
    }

    class SVGParser extends Parser {
    }

    exports.Ajax = Ajax;
    exports.AttrProperty = AttrProperty;
    exports.BoundProperty = BoundProperty;
    exports.ButtonProperty = ButtonProperty;
    exports.CSSProperty = CSSProperty;
    exports.DataProperty = DataProperty;
    exports.Events = Events;
    exports.HTMLParser = HTMLParser;
    exports.InputProperty = InputProperty;
    exports.Parser = Parser;
    exports.Property = Property;
    exports.SVGParser = SVGParser;
    exports.SVGProperty = SVGProperty;
    exports.TextProperty = TextProperty;
    exports.compile_svg = compile_svg;
    exports.compile_template = compile_template;
    exports.create_svg_elem = create_svg_elem;
    exports.extract_number = extract_number;
    exports.json_merge = json_merge;
    exports.load_svg = load_svg;
    exports.parse_svg = parse_svg;
    exports.set_svg_attrs = set_svg_attrs;
    exports.svg_ns = svg_ns;
    exports.uuid4 = uuid4;

    Object.defineProperty(exports, '__esModule', { value: true });

    var old_ts = window.ts;

    exports.noConflict = function() {
        window.ts = old_ts;
        return this;
    }

    window.ts = exports;

    return exports;

}({}, jQuery));
//# sourceMappingURL=treibstoff.bundle.js.map
