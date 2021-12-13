var ts = (function (exports, $) {
    'use strict';

    function deprecate(dep, sub, as_of) {
        console.log(
            `DEPRECATED: ${dep} is deprecated ` +
            `and will be removed as of ${as_of}. ` +
            `Use ${sub} instead.`
        );
    }
    function uuid4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    function set_default(ob, name, val) {
        if (ob[name] === undefined) {
            ob[name] = val;
        }
        return ob[name];
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
    function _strip_trailing_char(str, chr) {
        if (str.charAt(str.length - 1) === chr) {
            str = str.substring(0, str.length - 1);
        }
        return str;
    }
    function parse_url(url) {
        let parser = document.createElement('a');
        parser.href = url;
        let path = parser.pathname;
        url = parser.protocol + '//' + parser.host + path;
        return _strip_trailing_char(url, '/');
    }
    function parse_query(url, as_string) {
        let parser = document.createElement('a');
        parser.href = url;
        let search = parser.search;
        if (as_string) {
            return search ? search : '';
        }
        let params = {};
        if (search) {
            let parameters = search.substring(1, search.length).split('&');
            for (let i = 0; i < parameters.length; i++) {
                let param = parameters[i].split('=');
                params[param[0]] = param[1];
            }
        }
        return params;
    }
    function parse_path(url, include_query) {
        let parser = document.createElement('a');
        parser.href = url;
        let path = _strip_trailing_char(parser.pathname, '/');
        if (include_query) {
            path += parse_query(url, true);
        }
        return path;
    }
    function create_cookie(name, value, days) {
        var date,
            expires;
        if (days) {
            date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        } else {
            expires = "";
        }
        document.cookie = name + "=" + escape(value) + expires + "; path=/;";
    }
    function read_cookie(name) {
        var nameEQ = name + "=",
            ca = document.cookie.split(';'),
            i,
            c;
        for(i = 0; i < ca.length;i = i + 1) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return unescape(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
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
            this.ctx.on('click', this._click.bind(this));
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
        _click(evt) {
            this.trigger(`on_${this.name}_click`, this);
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
        walk(node) {
           let children = node.childNodes;
           for (let child of children) {
               this.walk(child);
           }
           if (node.nodeType === Node.ELEMENT_NODE) {
               this.parse(node);
           }
        }
        parse(node) {
        }
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
    class TemplateParser extends Parser {
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
    function extract_number(val) {
        if (isNaN(val)) {
            throw 'Input is not a number';
        }
        return Number(val);
    }
    class HTMLParser extends TemplateParser {
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
    class SVGParser extends TemplateParser {
    }
    function compile_svg(inst, tmpl, container) {
        let elems = parse_svg(tmpl, container),
            parser = new SVGParser(inst);
        elems.forEach(function (elem, index) {
            parser.walk(elem);
        });
        return elems;
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
        trigger(event, opts) {
            if (this._suppress_events) {
                return;
            }
            if (this[event]) {
                this[event](opts);
            }
            let subscribers = this._subscribers[event];
            if (!subscribers) {
                return this;
            }
            for (let i = 0; i < subscribers.length; i++) {
                subscribers[i](this, opts);
            }
            return this;
        }
        suppress_events(fn) {
            this._suppress_events = true;
            fn();
            this._suppress_events = false;
        }
        bind_from_options(events, opts) {
            for (let event of events) {
                if (opts[event]) {
                    this.on(event, opts[event]);
                }
            }
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

    class Overlay extends Events {
        constructor(opts) {
            super();
            this.uid = opts.uid ? opts.uid : uuid4();
            this.css = opts.css ? opts.css : '';
            this.title = opts.title ? opts.title : '&nbsp;';
            this.content = opts.content ? opts.content : '';
            this.bind_from_options(['on_open', 'on_close'], opts);
            this.container = opts.container ? opts.container : $('body');
            this.compile();
            this.elem.data('overlay', this);
            this.is_open = false;
        }
        compile() {
            compile_template(this, `
          <div class="modal ${this.css}" id="${this.uid}" t-elem="elem">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <button class="close" t-prop="close_btn" t-bind-click="close">
                    <span aria-hidden="true">&times;</span>
                    <span class="sr-only">Close</span>
                  </button>
                  <h5 class="modal-title">${this.title}</h5>
                </div>
                <div class="modal-body" t-elem="body">${this.content}</div>
                <div class="modal-footer" t-elem="footer"></div>
              </div>
            </div>
          </div>
        `);
        }
        open() {
            $('body')
                .css('padding-right', '13px')
                .css('overflow-x', 'hidden')
                .addClass('modal-open');
            this.container.append(this.elem);
            this.elem.show();
            this.is_open = true;
            this.trigger('on_open');
        }
        close() {
            if ($('.modal:visible').length === 1) {
                $('body')
                    .css('padding-right', '')
                    .css('overflow-x', 'auto')
                    .removeClass('modal-open');
            }
            this.elem.remove();
            this.is_open = false;
            this.trigger('on_close');
        }
    }
    function get_overlay(uid) {
        let elem = $(`#${uid}`);
        if (!elem.length) {
            return null;
        }
        let ol = elem.data('overlay');
        if (!ol) {
            return null;
        }
        return ol;
    }
    class Message extends Overlay {
        constructor(opts) {
            opts.content = opts.message ? opts.message : opts.content;
            opts.css = opts.flavor ? opts.flavor : opts.css;
            super(opts);
            this.compile_actions();
        }
        compile_actions() {
            compile_template(this, `
          <button class="close btn btn-default allowMultiSubmit"
                  t-prop="f_close_btn" t-bind-click="close">Close</button>
        `, this.footer);
        }
    }
    function show_message(opts) {
        new Message({
            title: opts.title,
            message: opts.message,
            flavor: opts.flavor,
            on_open: function(inst) {
                $('button', inst.elem).first().focus();
            }
        }).open();
    }
    function show_info(message) {
        show_message({
            title: 'Info',
            message: message,
            flavor: 'info'
        });
    }
    function show_warning(message) {
        show_message({
            title: 'Warning',
            message: message,
            flavor: 'warning'
        });
    }
    function show_error(message) {
        show_message({
            title: 'Error',
            message: message,
            flavor: 'error'
        });
    }
    class Dialog extends Message {
        constructor(opts) {
            set_default(opts, 'css', 'dialog');
            super(opts);
            this.bind_from_options(['on_confirm'], opts);
        }
        compile_actions() {
            compile_template(this, `
          <button class="ok btn btn-default allowMultiSubmit"
                  t-prop="ok_btn">OK</button>
          <button class="cancel btn btn-default allowMultiSubmit"
                  t-prop="cancel_btn" t-bind-click="close">Cancel</button>
        `, this.footer);
        }
        on_ok_btn_click() {
            this.close();
            this.trigger('on_confirm');
        }
    }
    function show_dialog(opts) {
        new Dialog({
            title: opts.title,
            message: opts.message,
            on_confirm: opts.on_confirm
        }).open();
    }

    class AjaxSpinner {
        constructor() {
            this._request_count = 0;
            this.icon_source = '/treibstoff-static/loading-spokes.svg';
            this.compile();
        }
        compile() {
            compile_template(this, `
          <div id="ajax-spinner" t-elem="elem">
            <img src="${this.icon_source}" width="64" height="64" alt="" />
          </div>
        `);
        }
        show() {
            this._request_count++;
            if (this._request_count > 1) {
                return;
            }
            $('body').append(this.elem);
        }
        hide(force) {
            this._request_count--;
            if (force) {
                this._request_count = 0;
                this.elem.remove();
                return;
            } else if (this._request_count <= 0) {
                this._request_count = 0;
                this.elem.remove();
            }
        }
    }
    class AjaxRequest {
        constructor(opts) {
            this.spinner = opts.spinner;
            set_default(opts, 'win', window);
            this.win = opts.win;
            set_default(opts, 'default_403', '/login');
            this.default_403 = opts.default_403;
        }
        execute(opts) {
            if (opts.url.indexOf('?') !== -1) {
                let params_ = opts.params;
                opts.params = parse_query(opts.url);
                opts.url = parse_url(opts.url);
                for (let key in params_) {
                    opts.params[key] = params_[key];
                }
            } else {
                set_default(opts, 'params', {});
            }
            set_default(opts, 'type', 'html');
            set_default(opts, 'method', 'GET');
            set_default(opts, 'cache', false);
            set_default(opts, 'error', function(request, status, error) {
                if (parseInt(status, 10) === 403) {
                    this.win.location.hash = '';
                    this.win.location.pathname = this.default_403;
                    return;
                }
                show_error(`<strong>${status}</strong>${error}`);
            }.bind(this));
            let wrapped_success = function(data, status, request) {
                opts.success(data, status, request);
                this.spinner.hide();
            }.bind(this);
            let wrapped_error = function(request, status, error) {
                if (request.status === 0) {
                    this.spinner.hide(true);
                    return;
                }
                status = request.status || status;
                error = request.statusText || error;
                opts.error(request, status, error);
                this.spinner.hide(true);
            }.bind(this);
            this.spinner.show();
            $.ajax({
                url: opts.url,
                dataType: opts.type,
                data: opts.params,
                method: opts.method,
                success: wrapped_success,
                error: wrapped_error,
                cache: opts.cache
            });
        }
    }
    class AjaxUtil extends Events {
        parse_target(target) {
            return {
                url: target ? parse_url(target) : undefined,
                params: target ? parse_query(target) : {},
                path: target ? parse_path(target) : undefined,
                query: target ? parse_query(target, true) : undefined
            };
        }
        parse_definition(val) {
            return val.replace(/\s+/g, ' ').split(' ');
        }
        action_target(elem, evt) {
            if (evt.ajaxtarget) {
                return evt.ajaxtarget;
            }
            return this.parse_target(elem.attr('ajax:target'));
        }
    }
    class AjaxOperation extends AjaxUtil {
        constructor(opts) {
            super();
            this.event = opts.event;
            this.dispatcher = opts.dispatcher;
            this.dispatcher.on(this.event, this.handle.bind(this));
        }
        execute(opts) {
            throw 'Abstract AjaxOperation does not implement execute';
        }
        handle(inst, opts) {
            throw 'Abstract AjaxOperation does not implement handle';
        }
    }
    class AjaxPath extends AjaxOperation {
        constructor(opts) {
            opts.event = 'on_path';
            super(opts);
            this.win = opts.win;
            $(this.win).on('popstate', this.state_handle.bind(this));
        }
        execute(opts) {
            let history = this.win.history;
            if (history.pushState === undefined) {
                return;
            }
            let path = opts.path.charAt(0) !== '/' ? `/${opts.path}` : opts.path;
            set_default(opts, 'target', this.win.location.origin + path);
            set_default(opts, 'replace', false);
            let replace = opts.replace;
            delete opts.path;
            delete opts.replace;
            opts._t_ajax = true;
            if (replace) {
                history.replaceState(opts, '', path);
            } else {
                history.pushState(opts, '', path);
            }
        }
        state_handle(evt) {
            let state = evt.originalEvent.state;
            if (!state) {
                return;
            }
            if (!state._t_ajax) {
                return;
            }
            evt.preventDefault();
            let target;
            if (state.target.url) {
                target = state.target;
            } else {
                target = this.parse_target(state.target);
            }
            target.params.popstate = '1';
            if (state.action) {
                this.dispatcher.trigger('on_action', {
                    target: target,
                    action: state.action
                });
            }
            if (state.event) {
                this.dispatcher.trigger('on_event', {
                    target: target,
                    event: state.event
                });
            }
            if (state.overlay) {
                this.dispatcher.trigger('on_overlay', {
                    target: target,
                    overlay: state.overlay,
                    css: state.overlay_css,
                    uid: state.overlay_uid,
                    title: state.overlay_title
                });
            }
            if (!state.action && !state.event && !state.overlay) {
                this.win.location = target.url;
            }
        }
        handle(inst, opts) {
            let elem = opts.elem,
                evt = opts.event,
                path = elem.attr('ajax:path');
            if (path === 'href') {
                let href = elem.attr('href');
                path = parse_path(href, true);
            } else if (path === 'target') {
                let tgt = this.action_target(elem, evt);
                path = tgt.path + tgt.query;
            }
            let target;
            if (this.has_attr(elem, 'ajax:path-target')) {
                let path_target = elem.attr('ajax:path-target');
                if (path_target) {
                    target = this.parse_target(path_target);
                }
            } else {
                target = this.action_target(elem, evt);
            }
            let p_opts = {
                path: path,
                target: target
            };
            p_opts.action = this.attr_val(elem, 'ajax:path-action', 'ajax:action');
            p_opts.event = this.attr_val(elem, 'ajax:path-event', 'ajax:event');
            p_opts.overlay = this.attr_val(elem, 'ajax:path-overlay', 'ajax:overlay');
            if (p_opts.overlay) {
                p_opts.overlay_css = this.attr_val(
                    elem,
                    'ajax:path-overlay-css',
                    'ajax:overlay-css'
                );
                p_opts.overlay_uid = this.attr_val(
                    elem,
                    'ajax:path-overlay-uid',
                    'ajax:overlay-uid'
                );
                p_opts.overlay_title = this.attr_val(
                    elem,
                    'ajax:path-overlay-title',
                    'ajax:overlay-title'
                );
            }
            this.execute(p_opts);
        }
        has_attr(elem, name) {
            let val = elem.attr(name);
            return val !== undefined && val !== false;
        }
        attr_val(elem, name, fallback) {
            if (this.has_attr(elem, name)) {
                return elem.attr(name);
            } else {
                return elem.attr(fallback);
            }
        }
    }
    class AjaxAction extends AjaxOperation {
        constructor(opts) {
            set_default(opts, 'event', 'on_action');
            super(opts);
            this.spinner = opts.spinner;
            this._handle = opts.handle;
            this._request = opts.request;
        }
        execute(opts) {
            opts.success = this.complete.bind(this);
            this.request(opts);
        }
        request(opts) {
            opts.params['ajax.action'] = opts.name;
            opts.params['ajax.mode'] = opts.mode;
            opts.params['ajax.selector'] = opts.selector;
            this._request.execute({
                url: parse_url(opts.url) + '/ajaxaction',
                type: 'json',
                params: opts.params,
                success: opts.success
            });
        }
        complete(data) {
            if (!data) {
                show_error('Empty Response');
                this.spinner.hide();
            } else {
                this._handle.update(data);
                this._handle.next(data.continuation);
            }
        }
        handle(inst, opts) {
            let target = opts.target,
                action = opts.action;
            for (let action_ of this.parse_definition(action)) {
                let defs = action_.split(':');
                this.execute({
                    name: defs[0],
                    selector: defs[1],
                    mode: defs[2],
                    url: target.url,
                    params: target.params
                });
            }
        }
    }
    class AjaxEvent extends AjaxOperation {
        constructor(opts) {
            opts.event = 'on_event';
            super(opts);
        }
        execute(opts) {
            let create_event = this.create_event.bind(this);
            $(opts.selector).each(function() {
                $(this).trigger(create_event(opts.name, opts.target, opts.data));
            });
        }
        create_event(name, target, data) {
            let evt = $.Event(name);
            if (target.url) {
                evt.ajaxtarget = target;
            } else {
                evt.ajaxtarget = this.parse_target(target);
            }
            evt.ajaxdata = data;
            return evt;
        }
        handle(inst, opts) {
            let target = opts.target,
                event = opts.event;
            for (let event_ of this.parse_definition(event)) {
                let def = event_.split(':');
                this.execute({
                    name: def[0],
                    selector: def[1],
                    target: target
                });
            }
        }
    }
    class AjaxOverlay extends AjaxAction {
        constructor(opts) {
            opts.event = 'on_overlay';
            super(opts);
            this.overlay_content_sel = '.modal-body';
        }
        execute(opts) {
            let ol;
            if (opts.close) {
                ol = get_overlay(opts.uid);
                if (ol) {
                    ol.close();
                }
                return ol;
            }
            let url, params;
            if (opts.target) {
                let target = opts.target;
                if (!target.url) {
                    target = this.parse_target(target);
                }
                url = target.url;
                params = target.params;
            } else {
                url = opts.url;
                params = opts.params;
            }
            let uid = opts.uid ? opts.uid : uuid4();
            params['ajax.overlay-uid'] = uid;
            ol = new Overlay({
                uid: uid,
                css: opts.css,
                title: opts.title,
                on_close: opts.on_close
            });
            this.request({
                name: opts.action,
                selector: `#${uid} ${this.overlay_content_sel}`,
                mode: 'inner',
                url: url,
                params: params,
                success: function(data) {
                    if (!data.payload) {
                        this.complete(data);
                        return;
                    }
                    ol.open();
                    this.complete(data);
                }.bind(this)
            });
            return ol;
        }
        handle(inst, opts) {
            let target = opts.target,
                overlay = opts.overlay;
            if (overlay.indexOf('CLOSE') > -1) {
                this.execute({
                    close: true,
                    uid: overlay.indexOf(':') > -1 ? overlay.split(':')[1] : opts.uid
                });
                return;
            }
            this.execute({
                action: overlay,
                url: target.url,
                params: target.params,
                css: opts.css,
                uid: opts.uid,
                title: opts.title
            });
        }
    }
    class AjaxForm {
        constructor(opts) {
            this.handle = opts.handle;
            this.spinner = opts.spinner;
            this.afr = null;
        }
        bind(form) {
            if (!this.afr) {
                compile_template(this, `
              <iframe t-elem="afr" id="ajaxformresponse"
                      name="ajaxformresponse" src="about:blank"
                      style="width:0px;height:0px;display:none">
              </iframe>
            `, $('body'));
            }
            $(form)
                .append('<input type="hidden" name="ajax" value="1" />')
                .attr('target', 'ajaxformresponse')
                .off()
                .on('submit', function(event) {
                    this.spinner.show();
                }.bind(this));
        }
        render(opts) {
            this.spinner.hide();
            if (!opts.error) {
                this.afr.remove();
                this.afr = null;
            }
            if (opts.payload) {
                this.handle.update(opts);
            }
            this.handle.next(opts.next);
        }
    }
    class AjaxDispatcher extends AjaxUtil {
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
    class AjaxHandle extends AjaxUtil {
        constructor(ajax) {
            super();
            this.ajax = ajax;
            this.spinner = ajax.spinner;
        }
        update(opts) {
            let payload = opts.payload,
                selector = opts.selector,
                mode = opts.mode,
                context;
            if (mode === 'replace') {
                $(selector).replaceWith(payload);
                context = $(selector);
                if (context.length) {
                    this.ajax.bind(context.parent());
                } else {
                    this.ajax.bind($(document));
                }
            } else if (mode === 'inner') {
                context = $(selector);
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
                    if (op.flavor) {
                        show_message({
                            message: op.payload,
                            flavor: op.flavor
                        });
                    } else {
                        $(op.selector).html(op.payload);
                    }
                }
            }
        }
    }
    class AjaxParser extends Parser {
        constructor(opts) {
            super();
            this.dispatcher = opts.dispatcher;
            this.form = opts.form;
        }
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
    class Ajax extends AjaxUtil {
        constructor(win=window) {
            super();
            this.win = win;
            this.binders = {};
            let spn = this.spinner = new AjaxSpinner();
            let dsp = this.dispatcher = new AjaxDispatcher();
            let req = this._request = new AjaxRequest({
                spinner: spn,
                win: win,
                default_403: '/login'
            });
            this._path = new AjaxPath({dispatcher: dsp, win: win});
            this._event = new AjaxEvent({dispatcher: dsp});
            let hdl = new AjaxHandle(this);
            let action_opts = {
                dispatcher: dsp,
                win: win,
                handle: hdl,
                spinner: spn,
                request: req
            };
            this._action = new AjaxAction(action_opts);
            this._overlay = new AjaxOverlay(action_opts);
            this._form = new AjaxForm({handle: hdl, spinner: spn});
        }
        register(func, instant) {
            let func_name = 'binder_' + uuid4();
            while (true) {
                if (this.binders[func_name] === undefined) {
                    break;
                }
                func_name = 'binder_' + uuid4();
            }
            this.binders[func_name] = func;
            if (instant) {
                func();
            }
        }
        bind(context) {
            let parser = new AjaxParser({
                dispatcher: this.dispatcher,
                form: this._form
            });
            context.each(function() {
                parser.walk(this);
            });
            for (let func_name in this.binders) {
                try {
                    this.binders[func_name](context);
                } catch (err) {
                    console.log(err);
                }
            }
            return context;
        }
        request(opts) {
            this._request.execute(opts);
        }
        path(opts) {
            this._path.execute(opts);
        }
        action(opts) {
            this._action.execute(opts);
        }
        trigger(opts) {
            if (arguments.length > 1) {
                deprecate('Calling Ajax.event with positional arguments', 'opts', '1.0');
                opts = {
                    name: arguments[0],
                    selector: arguments[1],
                    target: arguments[2],
                    data: arguments[3]
                };
            }
            this._event.execute(opts);
        }
        overlay(opts) {
            return this._overlay.execute(opts);
        }
        form(opts) {
            this._form.render(opts);
        }
        parseurl(url) {
            deprecate('ts.ajax.parseurl', 'ts.parse_url', '1.0');
            return parse_url(url);
        }
        parsequery(url, as_string) {
            deprecate('ts.ajax.parsequery', 'ts.parse_query', '1.0');
            return parse_query(url, as_string);
        }
        parsepath(url, include_query) {
            deprecate('ts.ajax.parsepath', 'ts.parse_path', '1.0');
            return parse_path(url, include_query);
        }
        parsetarget(target) {
            deprecate('ts.ajax.parsetarget', 'ts.ajax.parse_target', '1.0');
            return this.parse_target(target);
        }
        message(message, flavor='') {
            deprecate('ts.ajax.message', 'ts.show_message', '1.0');
            show_message({message: message, flavor: flavor});
        }
        info(message) {
            deprecate('ts.ajax.info', 'ts.show_info', '1.0');
            show_info(message);
        }
        warning(message) {
            deprecate('ts.ajax.warning', 'ts.show_warning', '1.0');
            show_warning(message);
        }
        error(message) {
            deprecate('ts.ajax.error', 'ts.show_error', '1.0');
            show_error(message);
        }
        dialog(opts, callback) {
            deprecate('ts.ajax.dialog', 'ts.show_dialog', '1.0');
            show_dialog({
                message: opts.message,
                on_confirm: function() {
                    callback(opts);
                }
            });
        }
    }
    let ajax = new Ajax();
    $.fn.tsajax = function() {
        ajax.bind(this);
        return this;
    };

    class KeyState extends Events {
        constructor(filter_keyevent) {
            super();
            this.filter_keyevent = filter_keyevent;
            this._keys = [];
            this._add_key('ctrl', 17);
            this._add_key('shift', 16);
            this._add_key('alt', 18);
            this._add_key('enter', 13);
            this._add_key('esc', 27);
            this._add_key('delete', 46);
            this.bind();
        }
        unload() {
            $(window).off('keydown', this._keydown_handle);
            $(window).off('keyup', this._keyup_handle);
        }
        bind() {
            this._keydown_handle = this._keydown.bind(this);
            this._keyup_handle = this._keyup.bind(this);
            $(window).on('keydown', this._keydown_handle);
            $(window).on('keyup', this._keyup_handle);
        }
        _add_key(name, key_code) {
            this._keys.push(name);
            this[`_${name}`] = false;
            Object.defineProperty(this, name, {
                get: function() {
                    return this[`_${name}`];
                },
                set: function(evt) {
                    let val = this[`_${name}`];
                    if (evt.type == 'keydown') {
                        if (!val && evt.keyCode == key_code) {
                            this[`_${name}`] = true;
                        }
                    } else {
                        if (val && evt.keyCode == key_code) {
                            this[`_${name}`] = false;
                        }
                    }
                }
            });
        }
        _set_keys(evt) {
            for (let name of this._keys) {
                this[name] = evt;
            }
        }
        _filter_event(evt) {
            return this.filter_keyevent && this.filter_keyevent(evt);
        }
        _keydown(evt) {
            this._set_keys(evt);
            if (!this._filter_event(evt)) {
                this.trigger('keydown', evt);
            }
        }
        _keyup(evt) {
            this._set_keys(evt);
            if (!this._filter_event(evt)) {
                this.trigger('keyup', evt);
            }
        }
    }

    class Motion extends Events {
        constructor() {
            super();
            this._down_handle = null;
            this._down_scope = null;
            this._move_scope = null;
        }
        reset_state() {
            this._move_handle = null;
            this._up_handle = null;
            this._prev_pos = null;
            this._motion = null;
        }
        set_scope(down, move) {
            if (this._up_handle) {
                throw 'Attempt to set motion scope while handling';
            }
            this.reset_state();
            if (this._down_handle) {
                $(this._down_scope).off('mousedown', this._down_handle);
            }
            this._down_handle = this._mousedown.bind(this);
            this._down_scope = down;
            $(down).on('mousedown', this._down_handle);
            this._move_scope = move ? move : null;
        }
        _mousedown(evt) {
            evt.stopPropagation();
            this._motion = false;
            this._prev_pos = {
                x: evt.pageX,
                y: evt.pageY
            };
            if (this._move_scope) {
                this._move_handle = this._mousemove.bind(this);
                $(this._move_scope).on('mousemove', this._move_handle);
            }
            this._up_handle = this._mouseup.bind(this);
            $(document).on('mouseup', this._up_handle);
            this.trigger('down', evt);
        }
        _mousemove(evt) {
            evt.stopPropagation();
            this._motion = true;
            evt.motion = this._motion;
            evt.prev_pos = this._prev_pos;
            this.trigger('move', evt);
            this._prev_pos.x = evt.pageX;
            this._prev_pos.y = evt.pageY;
        }
        _mouseup(evt) {
            evt.stopPropagation();
            if (this._move_scope) {
                $(this._move_scope).off('mousemove', this._move_handle);
            }
            $(document).off('mouseup', this._up_handle);
            evt.motion = this._motion;
            this.trigger('up', evt);
            this.reset_state();
        }
    }

    class Widget extends Motion {
        constructor(parent) {
            super();
            new Property(this, 'parent');
            this.parent = parent ? parent : null;
        }
        acquire(cls) {
            let parent = this.parent;
            while(parent) {
                if (!parent || parent instanceof cls) {
                    break;
                }
                parent = parent.parent;
            }
            return parent;
        }
    }
    class HTMLWidget extends Widget {
        constructor(parent, elem) {
            super(parent);
            this.elem = elem;
            new CSSProperty(this, 'x', {tgt: 'left'});
            new CSSProperty(this, 'y', {tgt: 'top'});
            new CSSProperty(this, 'width');
            new CSSProperty(this, 'height');
        }
        get offset() {
            return $(this.elem).offset();
        }
    }
    class SVGContext extends HTMLWidget {
        constructor(parent, name) {
            let container = parent.elem.get(0),
                elem = create_svg_elem('svg', {'class': name}, container);
            super(parent, elem);
            this.svg_ns = svg_ns;
            this.xyz = {
                x: 0,
                y: 0,
                z: 1
            };
        }
        svg_attrs(el, opts) {
            set_svg_attrs(el, opts);
        }
        svg_elem(name, opts, container) {
            return create_svg_elem(name, opts, container);
        }
    }

    $(function() {
        ajax.spinner.hide();
        $(document).tsajax();
    });

    exports.Ajax = Ajax;
    exports.AjaxAction = AjaxAction;
    exports.AjaxDispatcher = AjaxDispatcher;
    exports.AjaxEvent = AjaxEvent;
    exports.AjaxForm = AjaxForm;
    exports.AjaxHandle = AjaxHandle;
    exports.AjaxOperation = AjaxOperation;
    exports.AjaxOverlay = AjaxOverlay;
    exports.AjaxParser = AjaxParser;
    exports.AjaxPath = AjaxPath;
    exports.AjaxRequest = AjaxRequest;
    exports.AjaxSpinner = AjaxSpinner;
    exports.AjaxUtil = AjaxUtil;
    exports.AttrProperty = AttrProperty;
    exports.BoundProperty = BoundProperty;
    exports.ButtonProperty = ButtonProperty;
    exports.CSSProperty = CSSProperty;
    exports.DataProperty = DataProperty;
    exports.Dialog = Dialog;
    exports.Events = Events;
    exports.HTMLParser = HTMLParser;
    exports.HTMLWidget = HTMLWidget;
    exports.InputProperty = InputProperty;
    exports.KeyState = KeyState;
    exports.Message = Message;
    exports.Motion = Motion;
    exports.Overlay = Overlay;
    exports.Parser = Parser;
    exports.Property = Property;
    exports.SVGContext = SVGContext;
    exports.SVGParser = SVGParser;
    exports.SVGProperty = SVGProperty;
    exports.TemplateParser = TemplateParser;
    exports.TextProperty = TextProperty;
    exports.Widget = Widget;
    exports.ajax = ajax;
    exports.compile_svg = compile_svg;
    exports.compile_template = compile_template;
    exports.create_cookie = create_cookie;
    exports.create_svg_elem = create_svg_elem;
    exports.deprecate = deprecate;
    exports.extract_number = extract_number;
    exports.get_overlay = get_overlay;
    exports.json_merge = json_merge;
    exports.load_svg = load_svg;
    exports.parse_path = parse_path;
    exports.parse_query = parse_query;
    exports.parse_svg = parse_svg;
    exports.parse_url = parse_url;
    exports.read_cookie = read_cookie;
    exports.set_default = set_default;
    exports.set_svg_attrs = set_svg_attrs;
    exports.show_dialog = show_dialog;
    exports.show_error = show_error;
    exports.show_info = show_info;
    exports.show_message = show_message;
    exports.show_warning = show_warning;
    exports.svg_ns = svg_ns;
    exports.uuid4 = uuid4;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.treibstoff = exports;

    // bdajax B/C
    window.bdajax = exports.ajax;
    $.fn.bdajax = $.fn.tsajax;


    return exports;

})({}, jQuery);
//# sourceMappingURL=treibstoff.bundle.js.map
