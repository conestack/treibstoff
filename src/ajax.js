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
    uuid4
} from './utils.js';

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

/**
 * Mixin class for ajax operations.
 */
export class AjaxMixin {

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
     * @param {string} value - Definition string to parse.
     * @returns {Array} Containing operation definitions.
     */
    parse_definition(value) {
        let arr = value.replace(/\s+/g, ' ').split(' ');
        return arr;
    }

    /**
     * Get ajax target for event.
     *
     * Lookup ``ajaxtarget`` on event, fall back to ``ajax:target`` attribute
     * on elem.
     *
     * @param {$} elem - jQuery wrapped DOM element.
     * @param {$.Event} evt - jQuery event.
     * @returns {Object} Target for event.
     */
    event_target(elem, evt) {
        if (evt.ajaxtarget) {
            return evt.ajaxtarget;
        }
        return this.parse_target(elem.attr('ajax:target'));
    }
}

/**
 * Collection of deprecated ajax singleton functions.
 */
export class AjaxDeprecated extends AjaxMixin {

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

export class AjaxPath {
}

export class AjaxAction {
}

export class AjaxEvent {
}

export class AjaxOverlay {
}

export class AjaxForm {
}

export class AjaxDispatcher {
}

/**
 * Ajax singleton.
 */
export class Ajax extends AjaxDeprecated {

    constructor(win=window) {
        super();
        // Custom window can be injected for tests.
        this.win = win;
        // By default, we redirect to the login page on 403 error.
        // That we assume at '/login'.
        this.default_403 = '/login';
        // Overlay defaults
        this.overlay_content_sel = '.modal-body';
        // Object for hooking up JS binding functions after ajax calls
        // B/C, use ``ajax.register`` instead of direct extension.
        this.binders = {};
        // Ajax spinner.
        this.spinner = new AjaxSpinner();
        // Ajax form response iframe
        this._afr = null;
        // Browser history handling
        $(this.win).on('popstate', this._history_handle.bind(this));
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
     * Perform XMLHttpRequest request.
     *
     * By default it sends requests of type ``html`` with method ``get`` and
     * displays a ``ts.ajax.error`` message if request fails::
     *
     *     >> ts.ajax.request({
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

    /**
     * Write browser history.
     *
     * When performing ajax operations, it's desired to keep the browser history
     * sane. With this function it's possible to inject ajax definitions into
     * the browser history. When the user navigates via the browser's back or
     * forward buttons, ajax operations get executed as defined.
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
        let history = this.win.history;
        if (history.pushState === undefined) {
            return;
        }
        let path = opts.path.charAt(0) !== '/' ? `/${opts.path}` : opts.path;
        this._set_default_opt(opts, 'target', this.win.location.origin + path);
        this._set_default_opt(opts, 'replace', false);
        let replace = opts.replace;
        // delete options which should not end up in state
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
            let tgt = this.event_target(elem, evt);
            path = tgt.path + tgt.query;
        }
        let target;
        if (this._has_attr(elem, 'ajax:path-target')) {
            target = elem.attr('ajax:path-target');
            if (target) {
                target = this.parse_target(target);
            }
        } else {
            target = this.event_target(elem, evt);
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

    /**
     * Perform Ajax action.
     *
     * Requests ``ajaxaction`` on server and modifies DOM with response
     * according to mode and selector::
     *
     *     let target = ts.parse_target('http://tld.com/some/path?param=value');
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
            show_error('Empty response');
            this.spinner.hide();
        } else {
            this._fiddle(data.payload, data.selector, data.mode);
            this._continuation(data.continuation);
        }
    }

    _ajax_action(target, action) {
        let actions = this.parse_definition(action);
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

    /**
     * Trigger Ajax event.
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
     * **NOTE** - For B/C reasons, ``Ajax.event`` can be called with positional
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

    _ajax_event(target, event) {
        let defs = this.parse_definition(event);
        for (let i = 0; i < defs.length; i++) {
            let def = defs[i];
            def = def.split(':');
            this.trigger(def[0], def[1], target);
        }
    }

    /**
     * Perform ajax action and load result into an overlay.
     *
     * Display ajax action in overlay. Contents of the ``title`` option gets
     * displayed in the overlay header::
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
        })
        this._request_ajax_action({
            name: opts.action,
            selector: `#${uid} ${this.overlay_content_sel}`,
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
                ol.open();
                this._finish_ajax_action(data);
            }.bind(this)
        });
        return ol;
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

    bind_dispatcher(node, evts) {
        $(node).off(evts).on(evts, this._dispatch_handle.bind(this));
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
        $(form)
            .append('<input type="hidden" name="ajax" value="1" />')
            .attr('target', 'ajaxformresponse')
            .off()
            .on('submit', function(event) {
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
            show_dialog(opts, this._dispatch.bind(this));
        } else {
            this._dispatch(opts);
        }
    }

    _dispatch(opts) {
        let elem = opts.elem,
            event = opts.event;
        if (elem.attr('ajax:action')) {
            this._ajax_action(
                this.event_target(elem, event),
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
                this.event_target(elem, event),
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
            this.ajax.prepare_ajax_form(node);
        }
        if (node.tagName.toLowerCase() === 'form') {
            if (node.className.split(' ').includes('ajax')) {
                this.ajax.prepare_ajax_form(node);
            }
        }
    }
}

export function parse_ajax(context) {
    let parser = new AjaxParser(ajax);
    context.each(function() {
        parser.walk(this);
    });
    ajax.call_binders(context);
    return context;
}

$.fn.tsajax = function() {
    parse_ajax(this);
}
