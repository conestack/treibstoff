import $ from 'jquery';
import {compile_template} from './parser.js';
import {Events} from './events.js';
import {
    set_default,
    uuid4
} from './utils.js';
import {ajax_destroy} from './ssr/destroy.js';

/**
 * Modal overlay class.
 *
 * Renders a Bootstrap-style modal dialog with header, body and footer
 * sections. Supports stacking (z-index management) for multiple
 * simultaneous overlays.
 *
 * @fires on_open - Fired after the overlay is opened.
 * @fires on_close - Fired after the overlay is closed.
 */
export class Overlay extends Events {

    /**
     * Create overlay instance.
     *
     * @param {Object} opts - Overlay options.
     * @param {string} opts.uid - Unique identifier. Auto-generated if omitted.
     * @param {string} opts.flavor - CSS flavor class (e.g. ``'info'``,
     * ``'warning'``, ``'error'``).
     * @param {string} opts.css - Additional CSS classes for the modal element.
     * @param {string} opts.title - Title displayed in the modal header.
     * @param {string} opts.content - HTML content for the modal body.
     * @param {jQuery} opts.container - Container to append the overlay to.
     * Defaults to ``$('body')``.
     * @param {function} opts.on_open - Callback for the ``on_open`` event.
     * @param {function} opts.on_close - Callback for the ``on_close`` event.
     */
    constructor(opts) {
        super();
        this.uid = opts.uid ? opts.uid : uuid4();
        this.flavor = opts.flavor ? opts.flavor : '';
        this.css = opts.css ? opts.css : '';
        this.title = opts.title ? opts.title : '&nbsp;';
        this.content = opts.content ? opts.content : '';
        this.bind_from_options(['on_open', 'on_close'], opts);
        this.container = opts.container ? opts.container : $('body');
        this.compile();
        this.elem.data('overlay', this);
        this.is_open = false;
    }

    /**
     * Compile the overlay DOM structure from template.
     */
    compile() {
        let z_index = 1055; // default bootstrap modal z-index
        z_index += $('.modal:visible').length; // increase zindex based on currently open modals
        compile_template(this, `
          <div class="modal-wrapper position-absolute" t-elem="wrapper" style="z-index: ${z_index}">
            <div class="modal-backdrop opacity-25" t-elem="backdrop"></div>
            <div class="modal ${this.flavor} ${this.css}" id="${this.uid}" t-elem="elem">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">${this.title}</h5>
                    <button class="btn-close close" t-prop="close_btn" t-bind-click="close">
                      <span class="visually-hidden">Close</span>
                    </button>
                  </div>
                  <div class="modal-body" t-elem="body">${this.content}</div>
                  <div class="modal-footer" t-elem="footer"></div>
                </div>
              </div>
            </div>
          </div>
        `);
    }

    /**
     * Open the overlay. Appends it to the container and makes it visible.
     */
    open() {
        $('body').addClass('modal-open');
        this.container.append(this.wrapper);
        this.elem.show();
        this.is_open = true;
        this.trigger('on_open');
    }

    /**
     * Close and remove the overlay from the DOM.
     */
    close() {
        if ($('.modal:visible').length === 1) {
            $('body').removeClass('modal-open');
        }
        ajax_destroy(this.wrapper);
        this.wrapper.remove();
        this.is_open = false;
        this.trigger('on_close');
    }
}

/**
 * Return overlay instance by uid.
 *
 * @param {string} uid - Overlay UID.
 * @returns {Overlay} Overlay instance or null if not found.
 */
export function get_overlay(uid) {
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

/**
 * Message overlay with a close button in the footer.
 *
 * @extends Overlay
 */
export class Message extends Overlay {

    /**
     * @param {Object} opts - Message options. Accepts all ``Overlay`` options
     * plus ``message``.
     * @param {string} opts.message - Message text. Used as overlay content.
     */
    constructor(opts) {
        opts.content = opts.message ? opts.message : opts.content;
        super(opts);
        this.compile_actions();
    }

    /**
     * Compile the footer actions (close button).
     */
    compile_actions() {
        compile_template(this, `
          <button class="btn p-0 text-primary text-decoration-underline link-offset-2 close allowMultiSubmit"
                  t-prop="f_close_btn" t-bind-click="close">Close</button>
        `, this.footer);
    }
}

/**
 * Display overlay message::
 *
 *     ts.show_message({
 *         title: 'Message title',
 *         message: 'Message text',
 *         flavor: 'info',
 *         css: 'modal-xl
 *     });
 *
 * @param {Object} opts - Message options.
 * @param {string} opts.title - Optional message title to display in overlay
 * header.
 * @param {string} opts.message - Message to display in overlay content.
 * @param {string} opts.flavor - Optional message flavor. Either ``info``,
 * ``warning`` or ``error``.
 */
export function show_message(opts) {
    new Message({
        title: opts.title,
        message: opts.message,
        flavor: opts.flavor,
        css: opts.css,
        on_open: function(inst) {
            $('button', inst.elem).first().focus();
        }
    }).open();
}

/**
 * Display info message in overlay::
 *
 *     ts.show_info('Info text');
 *
 * @param {string} message - Info message to display in overlay content.
 */
export function show_info(message, css) {
    show_message({
        title: 'Info',
        message: message,
        flavor: 'info',
        css: css
    });
}

/**
 * Display warning message in overlay::
 *
 *     ts.show_warning('Warning text');
 *
 * @param {string} message - Warning message to display in overlay content.
 */
export function show_warning(message, css) {
    show_message({
        title: 'Warning',
        message: message,
        flavor: 'warning',
        css: css
    });
}

/**
 * Display error message in overlay::
 *
 *     ts.show_error('Error text');
 *
 * @param {string} message - Error message to display in overlay content.
 */
export function show_error(message, css) {
    show_message({
        title: 'Error',
        message: message,
        flavor: 'error',
        css: css
    });
}

/**
 * Confirmation dialog with OK and Cancel buttons.
 *
 * @extends Message
 * @fires on_confirm - Fired when the OK button is clicked.
 */
export class Dialog extends Message {

    /**
     * @param {Object} opts - Dialog options. Accepts all ``Message`` options
     * plus ``on_confirm``.
     * @param {function} opts.on_confirm - Callback when dialog is confirmed.
     */
    constructor(opts) {
        set_default(opts, 'css', 'dialog');
        super(opts);
        this.bind_from_options(['on_confirm'], opts);
    }

    /**
     * Compile the footer actions (OK and Cancel buttons).
     */
    compile_actions() {
        compile_template(this, `
          <button class="ok btn btn-primary allowMultiSubmit"
                  t-prop="ok_btn">OK</button>
          <button class="cancel btn btn-outline-primary allowMultiSubmit"
                  t-prop="cancel_btn" t-bind-click="close">Cancel</button>
        `, this.footer);
    }

    /** @private */
    on_ok_btn_click() {
        this.close();
        this.trigger('on_confirm');
    }
}

/**
 * Display confirmation dialog::
 *
 *     ts.show_dialog({
 *         title: 'Dialog title',
 *         message: 'Are you sure?',
 *         on_confirm: function(inst) {
 *             // inst is the dialog instance.
 *         }
 *     });
 *
 * @param {Object} opts - Dialog options.
 * @param {string} opts.title - Optional dialog title to display in overlay header.
 * @param {string} opts.message - Dialog message to display in overlay content.
 * @param {function} opts.on_confirm - Callback if dialog gets confirmed.
 */
export function show_dialog(opts) {
    new Dialog({
        title: opts.title,
        message: opts.message,
        on_confirm: opts.on_confirm
    }).open();
}
