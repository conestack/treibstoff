var ts = (function (exports, $) {
    'use strict';

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
    class Dialog extends Message {
        constructor(opts) {
            super(opts);
            this.bind_from_options(['on_confirm'], opts);
        }
        compile_actions() {
            compile_template(this, `
          <button class="submit btn btn-default allowMultiSubmit"
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
    class Ajax {
        constructor(win=window) {
            this.win = win;
            this.default_403 = '/login';
            this.overlay_content_sel = '.modal-body';
            this.binders = {};
            this.spinner = new AjaxSpinner();
            this._afr = null;
            $(this.win).on('popstate', this._history_handle.bind(this));
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
        parseurl(url) {
            console.log('ts.ajax.parseurl is deprecated. use ts.parse_url');
            return parse_url(url);
        }
        parsequery(url, as_string) {
            console.log('ts.ajax.parsequery is deprecated. use ts.parse_query');
            return parse_query(url, as_string);
        }
        parsepath(url, include_query) {
            console.log('ts.ajax.parsepath is deprecated. use ts.parse_path');
            return parse_path(url, include_query);
        }
        parsetarget(target) {
            console.log('ts.ajax.parsetarget is deprecated. use ts.ajax.parse_target');
            return this.parse_target(target);
        }
        parse_target(target) {
            return {
                url: target ? parse_url(target) : undefined,
                params: target ? parse_query(target) : {},
                path: target ? parse_path(target) : undefined,
                query: target ? parse_query(target, true) : undefined
            };
        }
        request(opts) {
            if (opts.url.indexOf('?') !== -1) {
                let params_ = opts.params;
                opts.params = parse_query(opts.url);
                opts.url = parse_url(opts.url);
                for (let key in params_) {
                    opts.params[key] = params_[key];
                }
            } else {
                this._set_default_opt(opts, 'params', {});
            }
            this._set_default_opt(opts, 'type', 'html');
            this._set_default_opt(opts, 'method', 'GET');
            this._set_default_opt(opts, 'cache', false);
            this._set_default_opt(opts, 'error', function(request, status, error) {
                if (parseInt(status, 10) === 403) {
                    this.win.location.hash = '';
                    this.win.location.pathname = this.default_403;
                    return;
                }
                this.error(`<strong>${status}</strong>${error}`);
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
        path(opts) {
            let history = this.win.history;
            if (history.pushState === undefined) {
                return;
            }
            let path = opts.path.charAt(0) !== '/' ? `/${opts.path}` : opts.path;
            this._set_default_opt(opts, 'target', this.win.location.origin + path);
            this._set_default_opt(opts, 'replace', false);
            let replace = opts.replace;
            delete opts.path;
            delete opts.replace;
            if (replace) {
                history.replaceState(opts, '', path);
            } else {
                history.pushState(opts, '', path);
            }
        }
        _history_handle(evt) {
            evt.preventDefault();
            let state = evt.originalEvent.state;
            if (!state) {
                return;
            }
            let target;
            if (state.target.url) {
                target = state.target;
            } else {
                target = this.parse_target(state.target);
            }
            target.params.popstate = '1';
            if (state.action) {
                this._ajax_action(target, state.action);
            }
            if (state.event) {
                this._ajax_event(target, state.event);
            }
            if (state.overlay) {
                this._ajax_overlay(
                    target,
                    state.overlay,
                    state.overlay_css
                );
            }
            if (!state.action && !state.event && !state.overlay) {
                this.win.location = target.url;
            }
        }
        _ajax_path(elem, evt) {
            let path = elem.attr('ajax:path');
            if (path === 'href') {
                let href = elem.attr('href');
                path = parse_path(href, true);
            } else if (path === 'target') {
                let tgt = this._event_target(elem, evt);
                path = tgt.path + tgt.query;
            }
            let target;
            if (this._has_attr(elem, 'ajax:path-target')) {
                target = elem.attr('ajax:path-target');
                if (target) {
                    target = this.parse_target(target);
                }
            } else {
                target = this._event_target(elem, evt);
            }
            let action = this._attr_val_or_default(
                elem,
                'ajax:path-action',
                'ajax:action'
            );
            let event = this._attr_val_or_default(
                elem,
                'ajax:path-event',
                'ajax:event'
            );
            let overlay = this._attr_val_or_default(
                elem,
                'ajax:path-overlay',
                'ajax:overlay'
            );
            let overlay_css = this._attr_val_or_default(
                elem,
                'ajax:path-overlay-css',
                'ajax:overlay-css'
            );
            this.path({
                path: path,
                target: target,
                action: action,
                event: event,
                overlay: overlay,
                overlay_css: overlay_css
            });
        }
        action(opts) {
            opts.success = this._finish_ajax_action.bind(this);
            this._request_ajax_action(opts);
        }
        _request_ajax_action(opts) {
            opts.params['ajax.action'] = opts.name;
            opts.params['ajax.mode'] = opts.mode;
            opts.params['ajax.selector'] = opts.selector;
            this.request({
                url: parse_url(opts.url) + '/ajaxaction',
                type: 'json',
                params: opts.params,
                success: opts.success
            });
        }
        _finish_ajax_action(data) {
            if (!data) {
                this.error('Empty response');
                this.spinner.hide();
            } else {
                this._fiddle(data.payload, data.selector, data.mode);
                this._continuation(data.continuation);
            }
        }
        _ajax_action(target, action) {
            let actions = this._defs_to_array(action);
            for (let i = 0; i < actions.length; i++) {
                let defs = actions[i].split(':');
                this.action({
                    name: defs[0],
                    selector: defs[1],
                    mode: defs[2],
                    url: target.url,
                    params: target.params
                });
            }
        }
        trigger(opts) {
            if (arguments.length > 1) {
                console.log(
                    'Calling Ajax.event with positional arguments is ' +
                    'deprecated. Please pass options object instead.'
                );
                opts = {
                    name: arguments[0],
                    selector: arguments[1],
                    target: arguments[2],
                    data: arguments[3]
                };
            }
            let create_event = this._create_event.bind(this);
            $(opts.selector).each(function() {
                $(this).trigger(create_event(opts.name, opts.target, opts.data));
            });
        }
        _create_event(name, target, data) {
            let evt = $.Event(name);
            if (target.url) {
                evt.ajaxtarget = target;
            } else {
                evt.ajaxtarget = this.parse_target(target);
            }
            evt.ajaxdata = data;
            return evt;
        }
        _event_target(elem, event) {
            if (event.ajaxtarget) {
                return event.ajaxtarget;
            }
            return this.parse_target(elem.attr('ajax:target'));
        }
        _ajax_event(target, event) {
            let defs = this._defs_to_array(event);
            for (let i = 0; i < defs.length; i++) {
                let def = defs[i];
                def = def.split(':');
                this.trigger(def[0], def[1], target);
            }
        }
        overlay(opts) {
            let ol;
            if (opts.close) {
                ol = get_overlay(opts.uid);
                if (ol) {
                    ol.close();
                }
                return;
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
            this._request_ajax_action({
                name: opts.action,
                selector: `#${uid} ${this.overlay_content_sel}`,
                mode: 'inner',
                url: url,
                params: params,
                success: function(data) {
                    if (!data.payload) {
                        this._finish_ajax_action(data);
                        return;
                    }
                    ol.open();
                    this._finish_ajax_action(data);
                }.bind(this)
            });
            return ol;
        }
        _ajax_overlay(target, overlay, css) {
            if (overlay.indexOf('CLOSE') > -1) {
                let opts = {};
                if (overlay.indexOf(':') > -1) {
                    opts.selector = overlay.split(':')[1];
                }
                opts.close = true;
                this.overlay(opts);
                return;
            }
            if (overlay.indexOf(':') > -1) {
                let defs = overlay.split(':');
                let opts = {
                    action: defs[0],
                    selector: defs[1],
                    url: target.url,
                    params: target.params,
                    css: css
                };
                if (defs.length === 3) {
                    opts.content_selector = defs[2];
                }
                this.overlay(opts);
                return;
            }
            this.overlay({
                action: overlay,
                url: target.url,
                params: target.params,
                css: css
            });
        }
        message(message, flavor='') {
            new Message({
                title: 'Message',
                message: message,
                flavor: flavor,
                on_open: function(inst) {
                    $('button', inst.elem).first().focus();
                }
            }).open();
        }
        error(message) {
            this.message(message, 'error');
        }
        info(message) {
            this.message(message, 'info');
        }
        warning(message) {
            this.message(message, 'warning');
        }
        dialog(opts, callback) {
            new Dialog({
                title: 'Dialog',
                message: opts.message,
                on_confirm: function() {
                    callback(opts);
                }
            }).open();
        }
        bind_dispatcher(node, evts) {
            $(node).off(evts).on(evts, this._dispatch_handle.bind(this));
        }
        bind_ajax_form(context) {
            let bc_ajax_form = $('form.ajax', context);
            if (bc_ajax_form.length) {
                console.log(
                    'B/C AJAX form found. Please use ``ajax:form`` ' +
                    'attribute instead of ``ajax`` CSS class.'
                );
            }
            this.prepare_ajax_form(bc_ajax_form);
        }
        prepare_ajax_form(form) {
            if (!this._afr) {
                compile_template(this, `
              <iframe t-elem="_afr" id="ajaxformresponse"
                      name="ajaxformresponse" src="about:blank"
                      style="width:0px;height:0px;display:none">
              </iframe>
            `, $('body'));
            }
            form.append('<input type="hidden" name="ajax" value="1" />');
            form.attr('target', 'ajaxformresponse');
            form.off().on('submit', function(event) {
                this.spinner.show();
            }.bind(this));
        }
        render_ajax_form(opts) {
            this.spinner.hide();
            if (!opts.error) {
                this._afr.remove();
                this._afr = null;
            }
            if (opts.payload) {
                this._fiddle(opts.payload, opts.selector, opts.mode);
            }
            this._continuation(opts.next);
        }
        call_binders(context) {
            for (let func_name in this.binders) {
                try {
                    this.binders[func_name](context);
                } catch (err) {
                    console.log(err);
                }
            }
        }
        _set_default_opt(opts, name, val) {
            if (!opts[name]) {
                opts[name] = val;
            }
        }
        _fiddle(payload, selector, mode) {
            if (mode === 'replace') {
                $(selector).replaceWith(payload);
                let context = $(selector);
                if (context.length) {
                    context.parent().tsajax();
                } else {
                    $(document).tsajax();
                }
            } else if (mode === 'inner') {
                $(selector).html(payload);
                $(selector).tsajax();
            }
        }
        _continuation(next) {
            if (!next) { return; }
            this.spinner.hide();
            for (let cdef of next) {
                let type = cdef.type;
                delete cdef.type;
                if (type === 'path') {
                    this.path(cdef);
                } else if (type === 'action') {
                    let target = this.parse_target(cdef.target);
                    cdef.url = target.url;
                    cdef.params = target.params;
                    this.action(cdef);
                } else if (type === 'event') {
                    this.trigger(cdef.name, cdef.selector, cdef.target, cdef.data);
                } else if (type === 'overlay') {
                    let target = this.parse_target(cdef.target);
                    cdef.url = target.url;
                    cdef.params = target.params;
                    this.overlay(cdef);
                } else if (type === 'message') {
                    if (cdef.flavor) {
                        let flavors = ['message', 'info', 'warning', 'error'];
                        if (flavors.indexOf(cdef.flavor) === -1) {
                            throw "Continuation definition.flavor unknown";
                        }
                        this[cdef.flavor](cdef.payload);
                    } else {
                        if (!cdef.selector) {
                            throw "Continuation definition.selector expected";
                        }
                        $(cdef.selector).html(cdef.payload);
                    }
                }
            }
        }
        _dispatch_handle(event) {
            event.preventDefault();
            event.stopPropagation();
            let elem = $(event.currentTarget),
                opts = {
                    elem: elem,
                    event: event
                };
            if (elem.attr('ajax:confirm')) {
                opts.message = elem.attr('ajax:confirm');
                this.dialog(opts, this._dispatch.bind(this));
            } else {
                this._dispatch(opts);
            }
        }
        _dispatch(opts) {
            let elem = opts.elem,
                event = opts.event;
            if (elem.attr('ajax:action')) {
                this._ajax_action(
                    this._event_target(elem, event),
                    elem.attr('ajax:action')
                );
            }
            if (elem.attr('ajax:event')) {
                this._ajax_event(
                    elem.attr('ajax:target'),
                    elem.attr('ajax:event')
                );
            }
            if (elem.attr('ajax:overlay')) {
                this._ajax_overlay(
                    this._event_target(elem, event),
                    elem.attr('ajax:overlay'),
                    elem.attr('ajax:overlay-css')
                );
            }
            if (elem.attr('ajax:path')) {
                this._ajax_path(elem, event);
            }
        }
        _has_attr(elem, name) {
            let attr = elem.attr(name);
            return attr !== undefined && attr !== false;
        }
        _attr_val_or_default(elem, name, fallback) {
            if (this._has_attr(elem, name)) {
                return elem.attr(name);
            } else {
                return elem.attr(fallback);
            }
        }
        _defs_to_array(str) {
            let arr = str.replace(/\s+/g, ' ').split(' ');
            return arr;
        }
    }
    let ajax = new Ajax();
    class AjaxParser extends Parser {
        constructor(ajax) {
            super();
            this.ajax = ajax;
        }
        parse(node) {
            let attrs = this.node_attrs(node);
            if (attrs['ajax:bind'] && (
                attrs['ajax:action'] ||
                attrs['ajax:event'] ||
                attrs['ajax:overlay'])) {
                let evts = attrs['ajax:bind'];
                this.ajax.bind_dispatcher(node, evts);
            }
            if (attrs['ajax:form']) {
                this.ajax.prepare_ajax_form($(node));
            }
        }
    }
    function parse_ajax(context) {
        let parser = new AjaxParser(ajax);
        context.each(function() {
            parser.walk(this);
        });
        ajax.bind_ajax_form(context);
        ajax.call_binders(context);
        return context;
    }
    $.fn.tsajax = function() {
        parse_ajax(this);
    };

    $(function() {
        ajax.spinner.hide();
        $(document).tsajax();
    });

    exports.Ajax = Ajax;
    exports.AjaxParser = AjaxParser;
    exports.AjaxSpinner = AjaxSpinner;
    exports.AttrProperty = AttrProperty;
    exports.BoundProperty = BoundProperty;
    exports.ButtonProperty = ButtonProperty;
    exports.CSSProperty = CSSProperty;
    exports.DataProperty = DataProperty;
    exports.Dialog = Dialog;
    exports.Events = Events;
    exports.HTMLParser = HTMLParser;
    exports.InputProperty = InputProperty;
    exports.Message = Message;
    exports.Overlay = Overlay;
    exports.Parser = Parser;
    exports.Property = Property;
    exports.SVGParser = SVGParser;
    exports.SVGProperty = SVGProperty;
    exports.TemplateParser = TemplateParser;
    exports.TextProperty = TextProperty;
    exports.ajax = ajax;
    exports.compile_svg = compile_svg;
    exports.compile_template = compile_template;
    exports.create_svg_elem = create_svg_elem;
    exports.extract_number = extract_number;
    exports.get_overlay = get_overlay;
    exports.json_merge = json_merge;
    exports.load_svg = load_svg;
    exports.parse_ajax = parse_ajax;
    exports.parse_path = parse_path;
    exports.parse_query = parse_query;
    exports.parse_svg = parse_svg;
    exports.parse_url = parse_url;
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

    // bdajax B/C
    window.bdajax = exports.ajax;
    $.fn.bdajax = $.fn.tsajax;


    return exports;

}({}, jQuery));
//# sourceMappingURL=treibstoff.bundle.js.map
