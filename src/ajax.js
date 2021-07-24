import $ from 'jquery';
import {
    compile_template,
    Parser
} from './parser.js';
import {
    Overlay,
    Message,
    Dialog
} from './overlay.js';
import {uuid4} from './utils.js';

export class AjaxSpinner {

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

export class Ajax {

    constructor() {
        // By default, we redirect to the login page on 403 error.
        // That we assume at '/login'.
        this.default_403 = '/login';
        // Overlay defaults
        this.overlay_content_selector = '.modal-body';
        // Object for hooking up JS binding functions after ajax calls
        // B/C, use ``ajax.register`` instead of direct extension.
        this.binders = {};
        // Ajax spinner.
        this.spinner = new AjaxSpinner();
        // Ajax form response iframe
        this._afr = null;
        // Browser history handling
        $(window).on('popstate', this._history_handle.bind(this));
    }

    // function for registering ajax binder functions
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

    request(opts) {
        if (opts.url.indexOf('?') !== -1) {
            let addparams = opts.params;
            opts.params = this.parsequery(opts.url);
            opts.url = this.parseurl(opts.url);
            for (let key in addparams) {
                opts.params[key] = addparams[key];
            }
        } else {
            if (!opts.params) { opts.params = {}; }
        }
        if (!opts.type) { opts.type = 'html'; }
        if (!opts.method) { opts.method = 'GET'; }
        if (!opts.error) {
            opts.error = function(req, status, exception) {
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
        if (!opts.cache) { opts.cache = false; }
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
        if (window.history.pushState === undefined) { return; }
        if (opts.path.charAt(0) !== '/') {
            opts.path = '/' + opts.path;
        }
        if (!opts.target) {
            opts.target = window.location.origin + opts.path;
        }
        let state = {
            target: opts.target,
            action: opts.action,
            event: opts.event,
            overlay: opts.overlay,
            overlay_css: opts.overlay_css
        };
        if (opts.replace) {
            window.history.replaceState(state, '', opts.path);
        } else {
            window.history.pushState(state, '', opts.path);
        }
    }

    action(opts) {
        opts.success = this._finish_ajax_action.bind(this);
        this._request_ajax_action(opts);
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
        // _dispatch_handle calls stopPropagation on event which is
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

    overlay(opts) {
        if (opts.close) {
            // a uid must be passed if an overlay should be closed
            let elem = $('#' + opts.uid),
                overlay = elem.data('overlay');
            if (overlay) {
                overlay.close();
            }
            return;
        }
        let url, params;
        if (opts.target) {
            let target = opts.target;
            if (!target.url) {
                target = this.parsetarget(target);
            }
            url = target.url;
            params = target.params;
        } else {
            url = opts.url;
            params = opts.params;
        }
        let uid = opts.uid ? opts.uid : uuid4();
        params['ajax.overlay-uid'] = uid;
        let selector = '#' + uid + ' ' + this.overlay_content_selector;
        this._request_ajax_action({
            name: opts.action,
            selector: selector,
            mode: 'inner',
            url: url,
            params: params,
            success: function(data) {
                // overlays are not displayed if no payload is received.
                if (!data.payload) {
                    // ensure continuation gets performed anyway.
                    this._finish_ajax_action(data);
                    return;
                }
                new Overlay({
                    uid: uid,
                    css: opts.css,
                    title: opts.title,
                    on_close: function() {
                        if (opts.on_close) {
                            opts.on_close();
                        }
                    }
                }).open();
                this._finish_ajax_action(data);
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

    // called by iframe response
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
                this.binders[func_name](context)
            } catch (err) {
                console.log(err);
            }
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
                let target = this.parsetarget(cdef.target);
                cdef.url = target.url;
                cdef.params = target.params;
                this.action(cdef);
            } else if (type === 'event') {
                this.trigger(cdef.name, cdef.selector, cdef.target, cdef.data);
            } else if (type === 'overlay') {
                let target = this.parsetarget(cdef.target);
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

    _history_handle(evt) {
        evt.preventDefault();
        let state = evt.originalEvent.state;
        if (!state) { return; }
        let target;
        if (state.target.url) {
            target = state.target;
        } else {
            target = this.parsetarget(state.target);
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
            window.location = target.url;
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

    _get_target(elem, event) {
        // return ajax target. lookup ``ajaxtarget`` on event, fall back to
        // ``ajax:target`` attribute on elem.
        if (event.ajaxtarget) {
            return event.ajaxtarget;
        }
        return this.parsetarget(elem.attr('ajax:target'));
    }

    _dispatch(opts) {
        let elem = opts.elem,
            event = opts.event;
        if (elem.attr('ajax:action')) {
            this._ajax_action(
                this._get_target(elem, event),
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
                this._get_target(elem, event),
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

    _ajax_path(elem, evt) {
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

    _ajax_event(target, event) {
        let defs = this._defs_to_array(event);
        for (let i = 0; i < defs.length; i++) {
            let def = defs[i];
            def = def.split(':');
            this.trigger(def[0], def[1], target);
        }
    }

    _request_ajax_action(opts) {
        opts.params['ajax.action'] = opts.name;
        opts.params['ajax.mode'] = opts.mode;
        opts.params['ajax.selector'] = opts.selector;
        this.request({
            url: this.parseurl(opts.url) + '/ajaxaction',
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

    _ajax_overlay(target, overlay, css) {
        // XXX: close needs an overlay uid
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

    _defs_to_array(str) {
        // XXX: if space in selector when receiving def str, this will fail
        let arr = str.replace(/\s+/g, ' ').split(' ');
        return arr;
    }
}

let ajax = new Ajax();
export {ajax};

export class AjaxParser extends Parser {

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

export function parse_ajax(context) {
    let parser = new AjaxParser(ajax);
    context.each(function() {
        parser.walk(this);
    });
    // B/C: Ajax forms have a dedicated ``ajax:form`` directive now.
    ajax.bind_ajax_form(context);
    ajax.call_binders(context);
    return context;
}

$.fn.tsajax = function() {
    parse_ajax(this);
}
