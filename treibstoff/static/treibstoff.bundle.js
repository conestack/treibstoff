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
        bind_from_options(events, options) {
            for (let event of events) {
                if (options[event]) {
                    this.on(event, options[event]);
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
            this.container = $('body');
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
            this.container
                .css('padding-right', '13px')
                .css('overflow-x', 'hidden')
                .addClass('modal-open')
                .append(this.elem);
            this.elem.show();
            this.trigger('on_open');
        }
        close() {
            this.elem.remove();
            if ($('.modal:visible').length === 1) {
                this.container
                    .css('padding-right', '')
                    .css('overflow-x', 'auto')
                    .removeClass('modal-open');
            }
            this.trigger('on_close');
        }
    }
    class Message extends Overlay {
        constructor(opts) {
            opts.content = opts.message ? opts.message : opts.content;
            opts.css = opts.flavor ? opts.flavor : opts.css;
            super(opts);
        }
        compile() {
            super.compile();
            compile_template(this, `
          <button class="close btn btn-default allowMultiSubmit"
                  t-prop="f_close_btn" t-bind-click="close">Close</button>
        `, this.footer);
        }
    }
    class Dialog extends Overlay {
        constructor(opts) {
            super(opts);
            this.bind_from_options(['on_confirm'], opts);
        }
        compile() {
            super.compile();
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
            compile_template(this,
              `<div id="ajax-spinner" t-elem="elem">
            <img src="${this.icon_source}" width="64" height="64" alt="" />
          </div>`
            );
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
    class AjaxHistory {
        constructor(ajax) {
            this._ajax = ajax;
        }
        bind() {
            $(window).on('popstate', this.handle);
        }
        handle(evt) {
            evt.preventDefault();
            let state = evt.originalEvent.state;
            if (!state) { return; }
            let target;
            if (state.target.url) {
                target = state.target;
            } else {
                target = this._ajax.parsetarget(state.target);
            }
            target.params.popstate = '1';
            if (state.action) {
                this._ajax._handle_ajax_action(target, state.action);
            }
            if (state.event) {
                this._ajax._handle_ajax_event(target, state.event);
            }
            if (state.overlay) {
                this._ajax._handle_ajax_overlay(
                    target,
                    state.overlay,
                    state.overlay_css
                );
            }
            if (!state.action && !state.event && !state.overlay) {
                window.location = target.url;
            }
        }
    }
    class Ajax {
        constructor() {
            this.default_403 = '/login';
            this.default_overlay_content_selector = '.modal-body';
            this.binders = {};
            this.spinner = new AjaxSpinner();
            this.history = new AjaxHistory(this);
        }
        register(func, instant) {
            let func_name = this._random_id();
            while (true) {
                if (this.binders[func_name] !== undefined) {
                    func_name = this._random_id();
                } else {
                    break;
                }
            }
            this.binders[func_name] = func;
            if (instant) {
                func();
            }
        }
        parseurl(url) {
            let parser = document.createElement('a');
            parser.href = url;
            let path = parser.pathname;
            if (path.indexOf('/') !== 0) {
                path = '/' + path;
            }
            url = parser.protocol + '//' + parser.host + path;
            if (url.charAt(url.length - 1) === '/') {
                url = url.substring(0, url.length - 1);
            }
            return url;
        }
        parsequery(url, as_string) {
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
        parsepath(url, include_query) {
            let parser = document.createElement('a');
            parser.href = url;
            if (include_query) {
                return parser.pathname + this.parsequery(url, true);
            }
            return parser.pathname;
        }
        parsetarget(target) {
            if (!target) {
                return {
                    url: undefined,
                    params: {},
                    path: undefined,
                    query: undefined
                };
            }
            let url = this.parseurl(target),
                params = this.parsequery(target),
                path = this.parsepath(target),
                query = this.parsequery(target, true);
            if (!params) {
                params = {};
            }
            return {
                url: url,
                params: params,
                path: path,
                query: query
            };
        }
        request(options) {
            if (options.url.indexOf('?') !== -1) {
                let addparams = options.params;
                options.params = this.parsequery(options.url);
                options.url = this.parseurl(options.url);
                for (let key in addparams) {
                    options.params[key] = addparams[key];
                }
            } else {
                if (!options.params) { options.params = {}; }
            }
            if (!options.type) { options.type = 'html'; }
            if (!options.method) { options.method = 'GET'; }
            if (!options.error) {
                options.error = function(req, status, exception) {
                    if (parseInt(status, 10) === 403) {
                        window.location.hash = '';
                        window.location.pathname = this.default_403;
                    } else {
                        let message = '<strong>' + status + '</strong> ';
                        message += exception;
                        this.error(message);
                    }
                }.bind(this);
            }
            if (!options.cache) { options.cache = false; }
            let wrapped_success = function(data, status, request) {
                options.success(data, status, request);
                this.spinner.hide();
            }.bind(this);
            let wrapped_error = function(request, status, error) {
                if (request.status === 0) {
                    this.spinner.hide(true);
                    return;
                }
                status = request.status || status;
                error = request.statusText || error;
                options.error(request, status, error);
                this.spinner.hide(true);
            }.bind(this);
            this.spinner.show();
            $.ajax({
                url: options.url,
                dataType: options.type,
                data: options.params,
                method: options.method,
                success: wrapped_success,
                error: wrapped_error,
                cache: options.cache
            });
        }
        path(options) {
            if (window.history.pushState === undefined) { return; }
            if (options.path.charAt(0) !== '/') {
                options.path = '/' + options.path;
            }
            if (!options.target) {
                options.target = window.location.origin + options.path;
            }
            let state = {
                target: options.target,
                action: options.action,
                event: options.event,
                overlay: options.overlay,
                overlay_css: options.overlay_css
            };
            if (options.replace) {
                window.history.replaceState(state, '', options.path);
            } else {
                window.history.pushState(state, '', options.path);
            }
        }
        action(options) {
            options.success = this._ajax_action_success;
            this._perform_ajax_action(options);
        }
        fiddle(payload, selector, mode) {
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
        continuation(definitions) {
            if (!definitions) { return; }
            this.spinner.hide();
            let definition, target;
            for (let idx in definitions) {
                definition = definitions[idx];
                if (definition.type === 'path') {
                    this.path({
                        path: definition.path,
                        target: definition.target,
                        action: definition.action,
                        event: definition.event,
                        overlay: definition.overlay,
                        overlay_css: definition.overlay_css
                    });
                } else if (definition.type === 'action') {
                    target = this.parsetarget(definition.target);
                    this.action({
                        url: target.url,
                        params: target.params,
                        name: definition.name,
                        mode: definition.mode,
                        selector: definition.selector
                    });
                } else if (definition.type === 'event') {
                    this.trigger(
                        definition.name,
                        definition.selector,
                        definition.target,
                        definition.data
                    );
                } else if (definition.type === 'overlay') {
                    target = this.parsetarget(definition.target);
                    this.overlay({
                        action: definition.action,
                        css: definition.css,
                        url: target.url,
                        params: target.params,
                        close: definition.close,
                        uid: definition.uid
                    });
                } else if (definition.type === 'message') {
                    if (definition.flavor) {
                        let flavors = ['message', 'info', 'warning', 'error'];
                        if (flavors.indexOf(definition.flavor) === -1) {
                            throw "Continuation definition.flavor unknown";
                        }
                        switch (definition.flavor) {
                            case 'message':
                                this.message(definition.payload);
                                break;
                            case 'info':
                                this.info(definition.payload);
                                break;
                            case 'warning':
                                this.warning(definition.payload);
                                break;
                            case 'error':
                                this.error(definition.payload);
                                break;
                        }
                    } else {
                        if (!definition.selector) {
                            throw "Continuation definition.selector expected";
                        }
                        $(definition.selector).html(definition.payload);
                    }
                }
            }
        }
        trigger(name, selector, target, data) {
            let create_event = function() {
                let evt = $.Event(name);
                if (target.url) {
                    evt.ajaxtarget = target;
                } else {
                    evt.ajaxtarget = this.parsetarget(target);
                }
                evt.ajaxdata = data;
                return evt;
            }.bind(this);
            $(selector).each(function() {
                $(this).trigger(create_event());
            });
        }
        overlay(options) {
            if (options.close) {
                let elem = $('#' + options.uid),
                    overlay = elem.data('overlay');
                if (overlay) {
                    overlay.close();
                }
                return;
            }
            let url, params;
            if (options.target) {
                let target = options.target;
                if (!target.url) {
                    target = this.parsetarget(target);
                }
                url = target.url;
                params = target.params;
            } else {
                url = options.url;
                params = options.params;
            }
            let uid = uuid4();
            params['ajax.overlay-uid'] = uid;
            let selector = '#' + uid + ' ' + this.default_overlay_content_selector;
            this._perform_ajax_action({
                name: options.action,
                selector: selector,
                mode: 'inner',
                url: url,
                params: params,
                success: function(data) {
                    if (!data.payload) {
                        this._ajax_action_success(data);
                        return;
                    }
                    new Overlay({
                        uid: uid,
                        css: options.css,
                        title: options.title,
                        on_close: function() {
                            if (options.on_close) {
                                options.on_close();
                            }
                        }
                    }).open();
                    this._ajax_action_success(data);
                }.bind(this)
            });
            return uid;
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
        dialog(options, callback) {
            console.log(options);
            new Dialog({
                title: 'Dialog',
                message: options.message,
                on_confirm: function() {
                    callback(options);
                }
            }).open();
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
            if (!$('#ajaxformresponse').length) {
                $('body').append(
                    '<iframe ' +
                        'id="ajaxformresponse"' +
                        'name="ajaxformresponse"' +
                        'src="about:blank"' +
                        'style="width:0px;height:0px;display:none">' +
                    '</iframe>'
                );
            }
            form.append('<input type="hidden" name="ajax" value="1" />');
            form.attr('target', 'ajaxformresponse');
            form.off().on('submit', function(event) {
                this.spinner.show();
            }.bind(this));
        }
        render_ajax_form(payload, selector, mode, next) {
            console.log('------------- render_ajax_form -------------------');
            console.log(payload);
            console.log(selector);
            console.log(mode);
            console.log(next);
            $('#ajaxformresponse').remove();
            this.spinner.hide();
            if (payload) {
                this.fiddle(payload, selector, mode);
            }
            this.continuation(next);
        }
        _random_id(id_len) {
            if (!id_len) {
                id_len = 8;
            }
            let ret = '',
                chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                        'abcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < id_len; i++) {
                ret += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return ret;
        }
        _dispatching_handler(event) {
            event.preventDefault();
            event.stopPropagation();
            let elem = $(this),
                options = {
                    elem: elem,
                    event: event
                };
            if (elem.attr('ajax:confirm')) {
                options.message = elem.attr('ajax:confirm');
                ajax.dialog(options, ajax._do_dispatching);
            } else {
                ajax._do_dispatching(options);
            }
        }
        _get_target(elem, event) {
            if (event.ajaxtarget) {
                return event.ajaxtarget;
            }
            return this.parsetarget(elem.attr('ajax:target'));
        }
        _do_dispatching(options) {
            let elem = options.elem,
                event = options.event;
            if (elem.attr('ajax:action')) {
                ajax._handle_ajax_action(
                    ajax._get_target(elem, event),
                    elem.attr('ajax:action')
                );
            }
            if (elem.attr('ajax:event')) {
                ajax._handle_ajax_event(
                    elem.attr('ajax:target'),
                    elem.attr('ajax:event')
                );
            }
            if (elem.attr('ajax:overlay')) {
                ajax._handle_ajax_overlay(
                    ajax._get_target(elem, event),
                    elem.attr('ajax:overlay'),
                    elem.attr('ajax:overlay-css')
                );
            }
            if (elem.attr('ajax:path')) {
                ajax._handle_ajax_path(elem, event);
            }
        }
        _has_attr(elem, name) {
            let attr = elem.attr(name);
            return attr !== undefined && attr !== false;
        }
        _attr_value_or_fallback(elem, name, fallback) {
            if (this._has_attr(elem, name)) {
                return elem.attr(name);
            } else {
                return elem.attr(fallback);
            }
        }
        _handle_ajax_path(elem, evt) {
            let path = elem.attr('ajax:path');
            if (path === 'href') {
                let href = elem.attr('href');
                path = this.parsepath(href, true);
            } else if (path === 'target') {
                let tgt = this._get_target(elem, evt);
                path = tgt.path + tgt.query;
            }
            let target;
            if (this._has_attr(elem, 'ajax:path-target')) {
                target = elem.attr('ajax:path-target');
                if (target) {
                    target = this.parsetarget(target);
                }
            } else {
                target = this._get_target(elem, evt);
            }
            let action = this._attr_value_or_fallback(
                elem,
                'ajax:path-action',
                'ajax:action'
            );
            let event = this._attr_value_or_fallback(
                elem,
                'ajax:path-event',
                'ajax:event'
            );
            let overlay = this._attr_value_or_fallback(
                elem,
                'ajax:path-overlay',
                'ajax:overlay'
            );
            let overlay_css = this._attr_value_or_fallback(
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
        _handle_ajax_event(target, event) {
            let defs = this._defs_to_array(event);
            for (let i = 0; i < defs.length; i++) {
                let def = defs[i];
                def = def.split(':');
                this.trigger(def[0], def[1], target);
            }
        }
        _ajax_action_success(data) {
            if (!data) {
                ajax.error('Empty response');
                ajax.spinner.hide();
            } else {
                ajax.fiddle(data.payload, data.selector, data.mode);
                ajax.continuation(data.continuation);
            }
        }
        _perform_ajax_action(options) {
            options.params['ajax.action'] = options.name;
            options.params['ajax.mode'] = options.mode;
            options.params['ajax.selector'] = options.selector;
            this.request({
                url: this.parseurl(options.url) + '/ajaxaction',
                type: 'json',
                params: options.params,
                success: options.success
            });
        }
        _handle_ajax_action(target, action) {
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
        _handle_ajax_overlay(target, overlay, css) {
            if (overlay.indexOf('CLOSE') > -1) {
                let options = {};
                if (overlay.indexOf(':') > -1) {
                    options.selector = overlay.split(':')[1];
                }
                options.close = true;
                this.overlay(options);
                return;
            }
            if (overlay.indexOf(':') > -1) {
                let defs = overlay.split(':');
                let options = {
                    action: defs[0],
                    selector: defs[1],
                    url: target.url,
                    params: target.params,
                    css: css
                };
                if (defs.length === 3) {
                    options.content_selector = defs[2];
                }
                this.overlay(options);
                return;
            }
            this.overlay({
                action: overlay,
                url: target.url,
                params: target.params,
                css: css
            });
        }
        _defs_to_array(str) {
            let arr = str.replace(/\s+/g, ' ').split(' ');
            return arr;
        }
    }
    let ajax = new Ajax();
    $.fn.tsajax = function() {
        let context = $(this);
        $('*', context).each(function() {
            for (let i in this.attributes) {
                let attr = this.attributes[i];
                if (attr && attr.nodeName) {
                    let name = attr.nodeName;
                    if (name.indexOf('ajax:bind') > -1) {
                        let events = attr.nodeValue;
                        let el = $(this);
                        el.off(events);
                        if (el.attr('ajax:action') ||
                            el.attr('ajax:event')  ||
                            el.attr('ajax:overlay')) {
                            el.on(events, ajax._dispatching_handler);
                        }
                    }
                    if (name.indexOf('ajax:form') > -1) {
                        ajax.prepare_ajax_form($(this));
                    }
                }
            }
        });
        ajax.bind_ajax_form(context);
        for (let binder in ajax.binders) {
            try {
                ajax.binders[binder](context);
            } catch(err) {
                console.log(err);
            }
        }
        return context;
    };

    $(function() {
        ajax.spinner.hide();
        ajax.history.bind();
        $(document).tsajax();
    });

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
    exports.TextProperty = TextProperty;
    exports.ajax = ajax;
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

    // bdajax B/C
    window.bdajax = exports.ajax;
    $.fn.bdajax = $.fn.tsajax;


    return exports;

}({}, jQuery));
//# sourceMappingURL=treibstoff.bundle.js.map
