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

    class Spinner {

        constructor() {
            this._request_count = 0;
            this.icon_source = './loading-spokes.svg';
            this.compile();
        }

        compile() {
            compile_template(this, `
          <div id="ajax-spinner" t-elem="elem">
            <img src="${this.icon_source}" width="64" height="64" alt="" />
          </div>
        `, $('body'));
        }

        show() {
            this._request_count++;
            if (this._request_count > 1) {
                return;
            }
            this.elem.show();
        }

        hide(force) {
            this._request_count--;
            if (force) {
                this._request_count = 0;
                this.elem.hide();
                return;
            } else if (this._request_count <= 0) {
                this._request_count = 0;
                this.elem.hide();
            }
        }
    }

    class History {

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
            // By default, we redirect to the login page on 403 error.
            // That we assume at '/login'.
            this.default_403 = '/login';
            // Object for hooking up JS binding functions after ajax calls
            // B/C, use ``ajax.register`` instead of direct extension.
            this.binders = {};
            // Ajax spinner.
            this.spinner = new Spinner();
            // Browser history
            this.history = new History(this);
            // Overlay selectors
            this.default_overlay_selector = '#ajax-overlay';
            this.default_overlay_content_selector = '.overlay_content';
        }

        // function for registering ajax binder functions
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
                // Internet Explorer 11 doesn't starts with '/'
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
                        selector: definition.selector,
                        content_selector: definition.content_selector,
                        css: definition.css,
                        url: target.url,
                        params: target.params,
                        close: definition.close
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
            // _dispatching_handler calls stopPropagation on event which is
            // fine in order to prevent weird behavior on parent DOM elements,
            // especially for standard events. Since upgrade to jQuery 1.9
            // stopPropagation seem to react on the event instance instead of
            // the trigger call for each element returned by selector, at least
            // on custom events, thus we create a separate event instance for
            // each elem returned by selector.
            $(selector).each(function() {
                $(this).trigger(create_event());
            });
        }

        overlay(options) {
            let selector = this.default_overlay_selector;
            if (options.selector) {
                selector = options.selector;
            }
            if (options.close) {
                let elem = $(selector),
                    overlay = elem.data('overlay');
                if (overlay) {
                    overlay.close();
                }
                return;
            }
            let content_selector = this.default_overlay_content_selector;
            if (options.content_selector) {
                content_selector = options.content_selector;
            }
            let elem = $(selector);
            elem.removeData('overlay');
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
            let css;
            if (options.css) {
                css = options.css;
            }
            let on_close = function() {
                let overlay = this.getOverlay();
                $(content_selector, overlay).html('');
                if (css) {
                    overlay.removeClass(css);
                }
                if (options.on_close) {
                    options.on_close();
                }
            };
            this._perform_ajax_action({
                name: options.action,
                selector: selector + ' ' + content_selector,
                mode: 'inner',
                url: url,
                params: params,
                success: function(data) {
                    this._ajax_action_success(data);
                    // overlays are not displayed if no payload is received.
                    if (!data.payload) {
                        return;
                    }
                    if (css) {
                        elem.addClass(css);
                    }
                    elem.overlay({
                        onClose: on_close,
                        oneInstance: false,
                        closeOnClick: true,
                        fixed: false
                    });
                    elem.data('overlay').load();
                }.bind(this)
            });
        }

        message(message) {
            let elem = $('#ajax-message');
            elem.removeData('overlay');
            elem.overlay({
                onBeforeLoad: function() {
                    let overlay = this.getOverlay();
                    $('.message', overlay).html(message);
                },
                onLoad: function() {
                    elem.find('button:first').focus();
                },
                onBeforeClose: function() {
                    let overlay = this.getOverlay();
                    $('.message', overlay).empty();
                },
                oneInstance: false,
                closeOnClick: false,
                fixed: false,
                top:'20%'
            });
            elem.data('overlay').load();
        }

        error(message) {
            $("#ajax-message .message")
                .removeClass('error warning info')
                .addClass('error');
            this.message(message);
        }

        info(message) {
            $("#ajax-message .message")
                .removeClass('error warning info')
                .addClass('info');
            this.message(message);
        }

        warning(message) {
            $("#ajax-message .message")
                .removeClass('error warning info')
                .addClass('warning');
            this.message(message);
        }

        dialog(options, callback) {
            let elem = $('#ajax-dialog');
            elem.removeData('overlay');
            elem.overlay({
                onBeforeLoad: function() {
                    let overlay = this.getOverlay(),
                        closefunc = this.close;
                    $('.text', overlay).html(options.message);
                    $('button', overlay).off();
                    $('button.submit', overlay).on('click', function() {
                        closefunc();
                        callback(options);
                    });
                    $('button.cancel', overlay).on('click', function() {
                        closefunc();
                    });
                },
                oneInstance: false,
                closeOnClick: false,
                fixed: false,
                top:'20%'
            });
            elem.data('overlay').load();
        }

        // B/C: bind ajax form handling to all forms providing ajax css class
        bind_ajax_form(context) {
            this.prepare_ajax_form($('form.ajax', context));
        }

        // prepare form desired to be an ajax form
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

        // called by iframe response
        render_ajax_form(payload, selector, mode, next) {
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
            // XXX: rework that ``this`` can be ued instead of ``ajax`` singleton
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
            // return ajax target. lookup ``ajaxtarget`` on event, fall back to
            // ``ajax:target`` attribute on elem.
            if (event.ajaxtarget) {
                return event.ajaxtarget;
            }
            return this.parsetarget(elem.attr('ajax:target'));
        }

        _do_dispatching(options) {
            // use ``ajax`` instead of ``this`` in this function. If called
            // as callback via ``ajax.dialog``, ``this`` is undefined.
            // XXX: rework that ``this`` can be ued instead of ``ajax`` singleton
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
            // XXX: rework that ``this`` can be ued instead of ``ajax`` singleton
            if (!data) {
                ajax.error('Empty response');
                ajax.spinner.hide();
            } else {
                ajax.fiddle(data.payload, data.selector, data.mode);
                ajax.continuation(data.continuation);
            }
        }

        _perform_ajax_action(options) {
            options.params['bdajax.action'] = options.name;
            options.params['bdajax.mode'] = options.mode;
            options.params['bdajax.selector'] = options.selector;
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
            // XXX: if space in selector when receiving def str, this will fail
            let arr = str.replace(/\s+/g, ' ').split(' ');
            return arr;
        }
    }

    let ajax = new Ajax();

    function jq_ajax_plugin() {
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
        // B/C: Ajax forms have a dedicated ``ajax:form`` directive now.
        ajax.bind_ajax_form(context);
        for (let binder in ajax.binders) {
            try {
                ajax.binders[binder](context);
            } catch(err) {
                console.log(err);
            }
        }
        return context;
    }

    $.fn.tsajax = jq_ajax_plugin;
    $.fn.bdajax = jq_ajax_plugin;  // B/C

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

    /**
     * Downstripped and modernized version of jquerytools overlay.
     * https://github.com/jquerytools/jquerytools/blob/master/src/overlay/overlay.js
     */

    let instances = [],
        effects = {};

    function add_effect(name, loadFn, closeFn) {
        effects[name] = [loadFn, closeFn];
    }

    class DefaultConf {

        constructor() {
            this.api = false;
            this.close = null;
            this.closeOnClick = true;
            this.closeOnEsc = true;
            this.closeSpeed = 'fast';
            this.effect = 'default';
            this.fixed = !$.browser.msie || $.browser.version > 6;
            this.left = 'center';
            this.load = false;
            this.oneInstance = true;
            this.speed = 'normal';
            this.target = null;
            this.top = '10%';
        }
    }

    class Overlay {

        constructor(trigger, conf) {
            conf = $.extend(true, new DefaultConf(), conf);
            instances.push(this);
            trigger.data('overlay', this);

            this.conf = conf;
            this.fire = trigger.add(this);
            this.w = $(window);
            this.opened = false;
            this.uid = Math.random().toString().slice(10);

            // get overlay and trigger
            let jq = conf.target || trigger.attr('rel');
            let elem = this.elem = jq ? $(jq) : trigger;

            // overlay not found. cannot continue
            if (!elem.length) {
                throw 'Could not find Overlay: ' + jq;
            }

            // trigger's click event
            if (trigger && trigger.index(elem) == -1) {
                trigger.click(function(e) {
                    this.load(e);
                    return e.preventDefault();
                }.bind(this));
            }

            // callbacks
            let cb_names = [
                'onBeforeLoad',
                'onStart',
                'onLoad',
                'onBeforeClose',
                'onClose'
            ];
            $.each(cb_names, function(i, name) {
                // configuration
                if ($.isFunction(conf[name])) {
                    $(this).on(name, conf[name]);
                }

                // API
                this[name] = function(fn) {
                    if (fn) {
                        $(this).on(name, fn);
                    }
                    return this;
                }.bind(this);
            }.bind(this));

            // close button
            let closers = this.closers = elem.find(conf.close || '.close');

            if (!closers.length && !conf.close) {
                closers = $('<a class="close"></a>');
                elem.prepend(closers);
            }

            closers.click(function(e) {
                this.close(e);
            }.bind(this));

            // autoload
            if (conf.load) {
                this.load();
            }
        }

        load(e) {
            // can be opened only once
            if (this.opened) {
                return this;
            }

            let conf = this.conf;

            // find the effect
            let eff = effects[conf.effect];
            if (!eff) {
                throw "Overlay: cannot find effect : \"" + conf.effect + "\"";
            }

            // close other instances if oneInstance
            if (conf.oneInstance) {
                $.each(instances, function() {
                    this.close(e);
                });
            }

            let fire = this.fire;

            // onBeforeLoad
            e = e || $.Event();
            e.type = 'onBeforeLoad';
            fire.trigger(e);
            if (e.isDefaultPrevented()) {
                return this;
            }

            let elem = this.elem;
            let w = this.w;

            // opened
            let opened = this.opened = true;
            // position & dimensions
            let top = conf.top,
                left = conf.left,
                oWidth = elem.outerWidth({margin: true}),
                oHeight = elem.outerHeight({margin: true});

            if (typeof top == 'string') {
                if (top == 'center') {
                    top = Math.max((w.height() - oHeight) / 2, 0);
                } else {
                    top = parseInt(top, 10) / 100 * w.height();
                }
            }

            if (left == 'center') {
                left = Math.max((w.width() - oWidth) / 2, 0);
            }

            // load effect
            eff[0].call(this, {top: top, left: left}, function() {
                if (opened) {
                    e.type = 'onLoad';
                    fire.trigger(e);
                }
            });

            let uid = this.uid;

            // when window is clicked outside overlay, we close
            if (conf.closeOnClick) {
                $(document).on('click.' + uid, function(e) {
                    if (!$(e.target).parents(elem).length) {
                        this.close(e);
                    }
                }.bind(this));
            }

            // keyboard::escape
            if (conf.closeOnEsc) {
                // one callback is enough if multiple instances are
                // loaded simultaneously
                $(document).on('keydown.' + uid, function(e) {
                    if (e.keyCode == 27) {
                        this.close(e);
                    }
                }.bind(this));
            }

            return this;
        }

        close(e) {
            if (!this.opened) {
                return this;
            }

            let fire = this.fire;

            e = e || $.Event();
            e.type = 'onBeforeClose';
            fire.trigger(e);
            if (e.isDefaultPrevented()) {
                return;
            }

            this.opened = false;

            // close effect
            // XXX: call first argument might be e.target instead of this
            effects[this.conf.effect][1].call(this, function() {
                e.type = 'onClose';
                fire.trigger(e);
            });

            // unbind the keyboard / clicking actions
            $(document).off('click.' + uid + ' keydown.' + uid);

            return this;
        }

        getOverlay() {
            return this.elem;
        }

        getTrigger() {
            return this.trigger;
        }

        getClosers() {
            return this.closers;
        }

        isOpened() {
            return this.opened;
        }

        getConf() {
            return this.conf;
        }
    }

    add_effect('default',
        function(pos, onLoad) {
            $('body')
                .css('padding-right', '13px')
                .css('overflow-x', 'hidden')
                .addClass('modal-open');
            this.elem.fadeIn(300, onLoad);
        }, function(onClose) {
            if ($('.modal:visible').length === 1) {
                $('body')
                    .css('padding-right', '')
                    .css('overflow-x', 'auto')
                    .removeClass('modal-open');
            }
            this.elem.fadeOut(300, onClose);
        }
    );

    $.fn.overlay = function(conf) {
        let inst = this.data('overlay');
        // Always return API if found on this
        if (inst) {
            return inst;
        }
        if ($.isFunction(conf)) {
            conf = {
                onBeforeLoad: conf
            };
        }
        let inst_count = 0;
        this.each(function() {
            inst = new Overlay($(this), conf);
            inst_count += 1;
        });
        if (conf.api && inst_count != 1) {
            throw 'API requested but overlay not unique.';
        }
        return conf.api ? inst : this;
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
    exports.Events = Events;
    exports.HTMLParser = HTMLParser;
    exports.InputProperty = InputProperty;
    exports.Overlay = Overlay;
    exports.Parser = Parser;
    exports.Property = Property;
    exports.SVGParser = SVGParser;
    exports.SVGProperty = SVGProperty;
    exports.TextProperty = TextProperty;
    exports.ajax = ajax;
    exports.bdajax = ajax;
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
