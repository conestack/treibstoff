import $ from 'jquery';
import {
    Overlay,
    show_dialog,
    show_error,
    show_info,
    show_message,
    show_warning
} from '../overlay.js';
import {
    deprecate,
    parse_path,
    parse_query,
    parse_url,
    uuid4
} from '../utils.js';
import {
    HTTPRequest,
    http_request
} from '../request.js';
import {spinner} from '../spinner.js';
import {AjaxUtil} from './util.js';
import {AjaxDispatcher} from './dispatcher.js';
import {AjaxAction} from './action.js';
import {AjaxOverlay} from './overlay.js';
import {AjaxForm} from './form.js';
import {AjaxPath} from './path.js';
import {AjaxEvent} from './event.js';
import {AjaxHandle} from './handle.js';
import {AjaxParser} from './parser.js';

/**
 * Ajax singleton.
 */
export class Ajax extends AjaxUtil {

    constructor(win=window) {
        super();
        this.win = win;
        this.binders = {};
        let spinner_ = this.spinner = spinner;
        let dispatcher = this.dispatcher = new AjaxDispatcher();
        let request = this._request = new HTTPRequest({win: win});
        this._path = new AjaxPath({dispatcher: dispatcher, win: win});
        this._event = new AjaxEvent({dispatcher: dispatcher});
        let handle = new AjaxHandle(this);
        let action_opts = {
            dispatcher: dispatcher,
            win: win,
            handle: handle,
            spinner: spinner_,
            request: request
        }
        this._action = new AjaxAction(action_opts);
        this._overlay = new AjaxOverlay(action_opts);
        this._form = new AjaxForm({handle: handle, spinner: spinner_});
        this._is_bound = false;
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
        // Only execute instant if ajax.bind() already has been initially
        // called via document ready event. Otherwise the binder functions
        // would be called twice on page load. This can happen if
        // ``ajax.register`` gets called in a document ready event handler
        // which is registered before treibstoff's document ready handler.
        if (instant && this._is_bound) {
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
        this._is_bound = true;
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
                throw `${instance.constructor.name}: Instance can be attached to exactly one DOM element`;
            }
            elem = elem[0];
        }
        if (elem._ajax_attached === undefined) {
            elem._ajax_attached = [];
        }
        elem._ajax_attached.push(instance);
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

    /**
     * This function is deprecated. Use ``ts.http_request`` instead.
     */
    request(opts) {
        deprecate('ts.ajax.request', 'ts.http_request', '1.0');
        http_request(opts);
    }
}

let ajax = new Ajax();
export {ajax};

$.fn.tsajax = function() {
    ajax.bind(this);
    return this;
}
