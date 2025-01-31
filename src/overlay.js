import $ from 'jquery';
import {compile_template} from './parser.js';
import {Events} from './events.js';
import {
    set_default,
    uuid4
} from './utils.js';

export class Overlay extends Events {

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
                  <button class="btn p-0 text-primary text-decoration-underline link-offset-2 close" t-prop="close_btn" t-bind-click="close">
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

export class Message extends Overlay {

    constructor(opts) {
        opts.content = opts.message ? opts.message : opts.content;
        opts.css = opts.flavor ? opts.flavor : opts.css;
        super(opts);
        this.compile_actions()
    }

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
 *         flavor: 'info'
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
export function show_info(message) {
    show_message({
        title: 'Info',
        message: message,
        flavor: 'info'
    });
}

/**
 * Display warning message in overlay::
 *
 *     ts.show_warning('Warning text');
 *
 * @param {string} message - Warning message to display in overlay content.
 */
export function show_warning(message) {
    show_message({
        title: 'Warning',
        message: message,
        flavor: 'warning'
    });
}

/**
 * Display error message in overlay::
 *
 *     ts.show_error('Error text');
 *
 * @param {string} message - Error message to display in overlay content.
 */
export function show_error(message) {
    show_message({
        title: 'Error',
        message: message,
        flavor: 'error'
    });
}

export class Dialog extends Message {

    constructor(opts) {
        set_default(opts, 'css', 'dialog');
        super(opts);
        this.bind_from_options(['on_confirm'], opts);
    }

    compile_actions() {
        compile_template(this, `
          <button class="ok btn btn-primary allowMultiSubmit"
                  t-prop="ok_btn">OK</button>
          <button class="cancel btn btn-outline-primary allowMultiSubmit"
                  t-prop="cancel_btn" t-bind-click="close">Cancel</button>
        `, this.footer);
    }

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
