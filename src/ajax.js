import $ from 'jquery';
import {compile_template} from './parser.js';
import {
    Overlay,
    Message,
    Dialog
} from './overlay.js';
import {uuid4} from './utils.js';

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
        // By default, we redirect to the login page on 403 error.
        // That we assume at '/login'.
        this.default_403 = '/login';
        // Overlay defaults
        this.default_overlay_content_selector = '.modal-body';
        // Object for hooking up JS binding functions after ajax calls
        // B/C, use ``ajax.register`` instead of direct extension.
        this.binders = {};
        // Ajax spinner.
        this.spinner = new AjaxSpinner();
        // Browser history
        this.history = new AjaxHistory(this);
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
        if (options.close) {
            // a uid must be passed if an overlay should be closed
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
                // overlays are not displayed if no payload is received.
                if (!data.payload) {
                    // ensure continuation gets performed anyway.
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

    // B/C: bind ajax form handling to all forms providing ajax css class
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
        // XXX: close needs an overlay uid
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
export {ajax};

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
