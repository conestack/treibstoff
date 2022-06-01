import $ from 'jquery';
import {
    compile_template,
    Parser
} from './parser.js';
import {
    get_overlay,
    Overlay,
    show_dialog,
    show_error,
    show_info,
    show_message,
    show_warning
} from './overlay.js';
import {
    deprecate,
    parse_path,
    parse_query,
    parse_url,
    set_default,
    uuid4
} from './utils.js';
import {Events} from './events.js';

let ajax_loading_icon = '/resources/treibstoff/loading-spokes.svg';

/**
 * Ajax spinner.
 *
 * The Ajax spinner is a singleton and is accessible via the ``ajax`` object.
 * Internally it holds a request count which gets increased every time the
 * ``show`` function is called. With each ``hide`` call, the request count
 * gets decreased, and as soon as it reaches 0 the spinner disappears. This
 * way it's possible to perform simultaneous requests while avoiding flickering
 * of the animation or the spinner disappearing while a request is still in
 * progress.
 *
 * Show the spinner::
 *
 *     ts.ajax.spinner.show();
 *
 * Hide the spinner. Spinner not disappears before request count reaches 0::
 *
 *     ts.ajax.spinner.hide();
 *
 * Force closing of the spinner and reset request count::
 *
 *     ajax.spinner.close(true);
 */
export class AjaxSpinner {

    constructor() {
        this._request_count = 0;
        this.compile();
    }

    compile() {
        compile_template(this, `
          <div id="ajax-spinner" t-elem="elem">
            <img src="${ajax_loading_icon}" width="64" height="64" alt="" />
          </div>
        `);
    }

    /**
     * Show spinner animation.
     */
    show() {
        this._request_count++;
        if (this._request_count > 1) {
            return;
        }
        $('body').append(this.elem);
    }

    /**
     * Hide spinner animation.
     *
     * @param {boolean} force - Forces spinner to disappear and resets request
     * count.
     */
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

/**
 * XMLHttpRequest helper.
 */
export class AjaxRequest {

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

/**
 * Ajax utility mixin.
 */
export class AjaxUtil extends Events {

    /**
     * Parse URL, query and path from URL string::
     *
     *     >> ts.ajax.parse_target('http://tld.com/some/path?param=value');
     *     -> {
     *         url: 'http://tld.com/some/path',
     *         params: { param: 'value' },
     *         path: '/some/path',
     *         query: '?param=value'
     *     }
     *
     * @param {string} target - URL string to parse.
     * @returns {Object} Containing ``url``, ``params``, ``path`` and ``query``.
     */
    parse_target(target) {
        return {
            url: target ? parse_url(target) : undefined,
            params: target ? parse_query(target) : {},
            path: target ? parse_path(target) : undefined,
            query: target ? parse_query(target, true) : undefined
        };
    }

    /**
     * Parse ajax operation definition from string into array.
     *
     * XXX: Fails if spaces in selector. Fix.
     *
     * @param {string} val - Definition string to parse.
     * @returns {Array} Containing operation definitions.
     */
    parse_definition(val) {
        return val.replace(/\s+/g, ' ').split(' ');
    }

    /**
     * Get ajax target for action.
     *
     * Lookup ``ajaxtarget`` on event, fall back to ``ajax:target`` attribute
     * on elem.
     *
     * @param {$} elem - jQuery wrapped DOM element.
     * @param {$.Event} evt - jQuery event.
     * @returns {Object} Target for event.
     */
    action_target(elem, evt) {
        if (evt.ajaxtarget) {
            return evt.ajaxtarget;
        }
        return this.parse_target(elem.attr('ajax:target'));
    }
}

/**
 * Abstract Ajax operation.
 */
export class AjaxOperation extends AjaxUtil {

    /**
     * Create Ajax operation.
     *
     * Binds this operation to given dispatcher event.
     *
     * @param {Object} opts - Ajax operation options.
     * @param {AjaxDispatcher} opts.dispatcher - Dispatcher instance.
     * @param {string} opts.event - AjaxDispatecher event to bind.
     */
    constructor(opts) {
        super();
        this.event = opts.event;
        this.dispatcher = opts.dispatcher;
        this.dispatcher.on(this.event, this.handle.bind(this));
    }

    /**
     * Execute operation as JavaScript API.
     *
     * @abstract
     * @param {Object} opts - Options needed for operation execution.
     */
    execute(opts) {
        throw 'Abstract AjaxOperation does not implement execute';
    }

    /**
     * Handle operation from dispatcher.
     *
     * @abstract
     * @param {AjaxDispatcher} inst - Dispatcher instance.
     * @param {Object} opts - Options needed for operation execution.
     */
    handle(inst, opts) {
        throw 'Abstract AjaxOperation does not implement handle';
    }
}

/**
 * Handle for path operation.
 */
export class AjaxPath extends AjaxOperation {

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
        // delete options which should not end up in state
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
        }
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
        // In some browsers val is undefined, in others it's false.
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

/**
 * Handle for action operation.
 */
export class AjaxAction extends AjaxOperation {

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

/**
 * Handle for event operation.
 */
export class AjaxEvent extends AjaxOperation {

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

/**
 * Handle for overlay operation.
 */
export class AjaxOverlay extends AjaxAction {

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
        })
        this.request({
            name: opts.action,
            selector: `#${uid} ${this.overlay_content_sel}`,
            mode: 'inner',
            url: url,
            params: params,
            success: function(data) {
                // overlays are not displayed if no payload is received.
                if (!data.payload) {
                    // ensure continuation gets performed anyway.
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

/**
 * Handle for Ajax form.
 */
export class AjaxForm {

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

/**
 * DOM event handle for elements defining Ajax operations.
 */
export class AjaxDispatcher extends AjaxUtil {

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

/**
 * DOM parser for destroying JavaScript instances attached to DOM elements
 * going to be removed.
 */
export class AjaxDestroy extends Parser {

    parse(node) {
        let instances = node._ajax_attached;
        if (instances !== undefined) {
            for (let instance of instances) {
                if (instance.destroy !== undefined) {
                    instance.destroy();
                }
            }
        }
    }
}

/**
 * Handle for DOM manipulation and Ajax continuation operations.
 */
export class AjaxHandle extends AjaxUtil {

    constructor(ajax) {
        super();
        this.ajax = ajax;
        this.spinner = ajax.spinner;
    }

    destroy(context) {
        let parser = new AjaxDestroy();
        context.each(function() {
            parser.walk(this);
        });
    }

    update(opts) {
        let payload = opts.payload,
            selector = opts.selector,
            mode = opts.mode,
            context;
        if (mode === 'replace') {
            let old_context = $(selector);
            this.destroy(old_context);
            old_context.replaceWith(payload);
            context = $(selector);
            if (context.length) {
                this.ajax.bind(context.parent());
            } else {
                this.ajax.bind($(document));
            }
        } else if (mode === 'inner') {
            context = $(selector);
            this.destroy(context.children());
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
                // if flavor given, message rendered in overlay
                if (op.flavor) {
                    show_message({
                        message: op.payload,
                        flavor: op.flavor
                    });
                // no overlay message, set message payload at selector
                } else {
                    $(op.selector).html(op.payload);
                }
            }
        }
    }
}

/**
 * DOM Parser for binding Ajax operations.
 */
export class AjaxParser extends Parser {

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

/**
 * Ajax singleton.
 */
export class Ajax extends AjaxUtil {

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
        }
        this._action = new AjaxAction(action_opts);
        this._overlay = new AjaxOverlay(action_opts);
        this._form = new AjaxForm({handle: hdl, spinner: spn});
    }

    /**
     * Register binder callback function.
     *
     * Integration of custom JavaScript to the binding mechanism is done via
     * this function. The register function takes a callback function and a
     * boolean flag whether to immediately execute the callback as arguments.
     *
     * The passed binder callback gets called every time when markup is changed
     * by this object and gets passed the changed DOM part as ``context``::
     *
     *     $(function() {
     *         ts.ajax.register(function(context) {
     *             $('.sel', context).on('click', function() {});
     *         }, true);
     *     });
     *
     * @param {function} func - Binder callback.
     * @param {boolean} instant - Flag whether to execute binder callback
     * immediately at registration time.
     */
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

    /**
     * Bind Ajax operations.
     *
     * Parses given piece of DOM for Ajax operation related attributes and binds
     * the Ajax dispatcher.
     *
     * Additionally calls all registered binder functions for given context.
     *
     * @param {$} context - jQuery wrapped piece of DOM.
     * @returns {$} The given jQuery wrapped context.
     */
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
                this.binders[func_name](context)
            } catch (err) {
                console.log(err);
            }
        }
        return context;
    }

    /**
     * Attach JavaScript instance to DOM element.
     *
     * ``destroy`` function of attached instance gets called when DOM element
     * is removed.
     *
     * This is the supposed mechanism if a user needs to gracefully destruct
     * things when DOM parts get removed.
     *
     * Attaching of instances is normally done inside a binder function or a
     * subsequent operation of it.
     *
     * A best practice pattern look like so::
     *
     *     class Widget {
     *
     *         static initialize(context) {
     *             $('.sel', context).each(function() {
     *                 new Widget($(this));
     *             });
     *         }
     *
     *         constructor(elem) {
     *             ts.ajax.attach(this, elem);
     *         }
     *
     *         destroy() {
     *             // graceful destruction goes here
     *         }
     *     }
     *
     *     $(function() {
     *         ts.ajax.register(Widget.initialize, true);
     *     });
     *
     * @param {Object} instance - Arbitrary JavaScript object instance.
     * @param {HTMLElement|$} elem - DOM element to attach instance to.
     */
    attach(instance, elem) {
        if (elem instanceof $) {
            if (elem.length != 1) {
                throw 'Instance can be attached to exactly one DOM element';
            }
            elem = elem[0];
        }
        if (elem._ajax_attached === undefined) {
            elem._ajax_attached = [];
        }
        elem._ajax_attached.push(instance);
    }

    /**
     * Perform XMLHttpRequest request.
     *
     * By default it sends requests of type ``html`` with method ``get`` and
     * displays a ``ts.ajax.error`` message if request fails::
     *
     *     ts.ajax.request({
     *         url: 'https://tld.com/some/path',
     *         params: {
     *             a: 'a',
     *             b: 'b'
     *         },
     *         type: 'json',
     *         method: 'POST',
     *         cache: true,
     *         success: function(data, status, request) {
     *         },
     *         error: function(request, status, error) {
     *         }
     *     });
     *
     * Given ``url`` might contain a query string. It gets parsed and written to
     * request parameters. If same request parameter is defined in URL query and
     * params object, latter one takes precedence.
     *
     * Success and error callback functions gets wrapped to handle ajax spinner
     * automatically.
     *
     * @param {Object} opts - Request options.
     * @param {string} opts.url - Request URL.
     * @param {Object} opts.params - Optional query parameters for request.
     * @param {string} opts.type - Optional request type. Defaults to 'html'.
     * @param {string} opts.method - Optional request method. Defaults to 'GET'.
     * @param {boolean} opts.cache - Optional flag whether to cache the response.
     * Defaults to False.
     * @param {function} opts.success - Callback if request is successful.
     * @param {function} opts.error - Optional callback if request fails.
     * Default callback displays error message with response status.
     */
    request(opts) {
        this._request.execute(opts);
    }

    /**
     * Execute path operation.
     *
     * Wites browser session history stack. Executes Ajax operations on
     * window popstate event.
     *
     * Add an entry to the browser history::
     *
     *     ts.ajax.path({
     *         path: '/some/path',
     *         target: 'http://tld.com/some/path',
     *         action: 'layout:#layout:replace',
     *         event: 'contextchanged:#layout',
     *         overlay: 'actionname',
     *         overlay_css: 'additional-overlay-css-class'
     *     });
     *
     * If ``replace`` option is given, browser history gets reset::
     *
     *     ts.ajax.path({
     *         path: '/some/path',
     *         target: 'http://example.com/some/path',
     *         action: 'layout:#layout:replace',
     *         replace: true
     *     });
     *
     * @param {Object} opts - Path options.
     * @param {string} opts.path - The path to write to the address bar.
     * @param {string} opts.target - Related target URL.
     * @param {string} opts.action - Ajax action to perform.
     * @param {string} opts.event - Ajax event to trigger.
     * @param {string} opts.overlay - Ajax overlay to display.
     * @param {string} opts.overlay_css - CSS class to add to ajax overlay.
     * @param {boolean} opts.replace - Flag whether to reset browser history.
     */
    path(opts) {
        this._path.execute(opts);
    }

    /**
     * Execute action operation.
     *
     * Requests ``ajaxaction`` on server and modifies DOM with response
     * according to mode and selector::
     *
     *     let target = ts.ajax.parse_target('http://tld.com/some/path?param=value');
     *     ts.ajax.action({
     *         name: 'content',
     *         selector: '#content',
     *         mode: 'inner',
     *         url: target.url,
     *         params: target.params
     *     });
     *
     * @param {Object} opts - Ajax options.
     * @param {string} opts.name - Action name.
     * @param {string} opts.selector - CSS selector of DOM element to modify
     * with response payload.
     * @param {string} opts.mode - Mode for manipulation. Either ``inner`` or
     * ``replace``.
     * @param {string} opts.url - URL on which ``ajaxaction`` gets requested.
     * @param {Object} opts.params - Query parameters.
     */
    action(opts) {
        this._action.execute(opts);
    }

    /**
     * Execute event operation.
     *
     * Creates an event providing ``ajaxtarget`` and ``ajaxdata`` properties
     * and trigger it on DOM elements by selector.
     *
     * The ``ajaxtarget`` property on the event instance is an object containing
     * ``url`` and ``params`` properties, as returned by ``Ajax.parse_target``::
     *
     *     let url = 'http://tls.com?param=value';
     *     ts.ajax.trigger({
     *         name: 'contextchanged',
     *         selector: '.contextsensitiv',
     *         target: ts.ajax.parse_target(url);
     *     });
     *
     * If given target is a URL string, it gets automatically parsed by the
     * trigger function::
     *
     *     ts.ajax.trigger({
     *         name: 'contextchanged',
     *         selector: '.contextsensitiv',
     *         target: 'http://tls.com?param=value'
     *     });
     *
     * Optionally a ``data`` option can be passed, which gets set at the
     * ``ajaxdata`` attribute of the event::
     *
     *     ts.ajax.trigger({
     *         name: 'contextchanged',
     *         selector: '.contextsensitiv',
     *         target: 'http://tld.com?param=value',
     *         data: {key: 'val'}
     *     });
     *
     * **Note** - For B/C reasons, ``trigger`` can be called with positional
     * arguments (name, selector, target, data). This behavior is deprecated
     * and will be removed in future versions.
     *
     * @param {Object} opts - Event options.
     * @param {string} opts.name - Event name.
     * @param {string} opts.selector - CSS selector of DOM elements on which to
     * trigger events on.
     * @param {string|Object} opts.target - Event target. Gets set as
     * ``ajaxtarget`` property on event instance.
     * @param {*} opts.data - Optional event data. Gets set as
     * ``ajaxdata`` property on event instance.
     */
    trigger(opts) {
        if (arguments.length > 1) {
            deprecate('Calling Ajax.event with positional arguments', 'opts', '1.0');
            opts = {
                name: arguments[0],
                selector: arguments[1],
                target: arguments[2],
                data: arguments[3]
            }
        }
        this._event.execute(opts);
    }

    /**
     * Execute overlay operation.
     *
     * Load action result into an overlay.
     *
     * Display action operation in overlay. Contents of the ``title`` option
     * gets displayed in the overlay header::
     *
     *     ts.ajax.overlay({
     *         action: 'actionname',
     *         url: 'https://tld.com',
     *         params: {param: 'value'},
     *         title: 'Overlay Title'
     *     });
     *
     * Optional to ``url`` and ``params``, ``target`` can be passed as option.
     * If both ``target`` and ``url``/``params`` given, ``target`` takes
     * precedence::
     *
     *     ts.ajax.overlay({
     *         action: 'actionname',
     *         target: 'https://tld.com?param=value'
     *     });
     *
     * If ``css`` option is given, it gets set on overlay DOM element. This
     * way it's possible to add custom styles for a specific overlay::
     *
     *     ts.ajax.overlay({
     *         action: 'actionname',
     *         target: 'https://tld.com?param=value',
     *         css: 'some-class'
     *     });
     *
     * Overlays get a generated UID by default for later reference which gets
     * passed as ``ajax:overlay-uid`` request parameter to the server.
     * ``Ajax.overlay`` returns the overlay instance, from which this uid
     * can be read::
     *
     *     let overlay = ts.ajax.overlay({
     *         action: 'actionname',
     *         target: 'https://tld.com?param=value'
     *     });
     *     let uid = overlay.uid;
     *
     * Already open ajax overlays can be closed by passing the ``close`` option
     * and the overlay ``uid``::
     *
     *     ts.ajax.overlay({
     *         close: true,
     *         uid: uid
     *     });
     *
     * A callback can be provided when overlay gets closed by passing it as
     * ``on_close`` option::
     *
     *     ts.ajax.overlay({
     *         action: 'actionname',
     *         target: 'http://foobar.org?param=value',
     *         on_close: function(inst) {
     *             // inst is the overlay instance.
     *         }
     *     });
     *
     * @param {Object} opts - Overlay options.
     * @param {string} opts.action - Ajax action name.
     * @param {string} opts.url - URL on which ``ajaxaction`` gets requested.
     * @param {Object} opts.params - Query parameters.
     * @param {string|Object} opts.target - Optional action target. Takes
     * precedence over ``url`` and ``params``.
     * @param {string} opts.title - Title to display in overlay header.
     * @param {string} opts.css - CSS class to add to overlay DOM element.
     * @param {string} opts.uid - The overlay UID.
     * @param {boolean} opts.close - Flag whether to close an open overlay.
     * @returns {Overlay} Overlay instance.
     */
    overlay(opts) {
        return this._overlay.execute(opts);
    }

    /**
     * Render ajax form after form processing.
     *
     * Gets called from hidden form iframe when response returns. See server
     * integration documentation for details.
     *
     * @param {Object} opts - Form options.
     * @param {HTMLElement} opts.payload - The rendered form.
     * @param {string} opts.selector - CSS selector of the form.
     * @param {string} opts.mode - DOM manipulation mode.
     * @param {Array} opts.next - Continuation operation definitions.
     * @param {boolean} opts.error - A flag whether an error occured while
     * processing the form. The error flag not means a validation error but
     * an exception happened and is needed for proper application
     * state handling.
     */
    form(opts) {
        this._form.render(opts);
    }

    /**
     * This function is deprecated. Use ``ts.parse_url`` instead.
     */
    parseurl(url) {
        deprecate('ts.ajax.parseurl', 'ts.parse_url', '1.0');
        return parse_url(url);
    }

    /**
     * This function is deprecated. Use ``ts.parse_query`` instead.
     */
    parsequery(url, as_string) {
        deprecate('ts.ajax.parsequery', 'ts.parse_query', '1.0');
        return parse_query(url, as_string);
    }

    /**
     * This function is deprecated. Use ``ts.parse_path`` instead.
     */
    parsepath(url, include_query) {
        deprecate('ts.ajax.parsepath', 'ts.parse_path', '1.0');
        return parse_path(url, include_query);
    }

    /**
     * This function is deprecated. Use ``ts.ajax.parse_target`` instead.
     */
    parsetarget(target) {
        deprecate('ts.ajax.parsetarget', 'ts.ajax.parse_target', '1.0');
        return this.parse_target(target);
    }

    /**
     * This function is deprecated. Use ``ts.show_message`` instead.
     */
    message(message, flavor='') {
        deprecate('ts.ajax.message', 'ts.show_message', '1.0');
        show_message({message: message, flavor: flavor});
    }

    /**
     * This function is deprecated. Use ``ts.show_info`` instead.
     */
    info(message) {
        deprecate('ts.ajax.info', 'ts.show_info', '1.0');
        show_info(message);
    }

    /**
     * This function is deprecated. Use ``ts.show_warning`` instead.
     */
    warning(message) {
        deprecate('ts.ajax.warning', 'ts.show_warning', '1.0');
        show_warning(message);
    }

    /**
     * This function is deprecated. Use ``ts.show_error`` instead.
     */
    error(message) {
        deprecate('ts.ajax.error', 'ts.show_error', '1.0');
        show_error(message);
    }

    /**
     * This function is deprecated. Use ``ts.show_dialog`` instead.
     */
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
export {ajax};

$.fn.tsajax = function() {
    ajax.bind(this);
    return this;
}
