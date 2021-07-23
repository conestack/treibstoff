import $ from 'jquery';
import {compile_template} from './parser.js';
import {Events} from './events.js';
import {uuid4} from './utils.js';

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

export class Message extends Overlay {

    constructor(opts) {
        opts.content = opts.message ? opts.message : opts.content;
        opts.css = opts.flavor ? opts.flavor : opts.css;
        super(opts);
        this.compile_actions()
    }

    compile_actions() {
        compile_template(this, `
          <button class="close btn btn-default allowMultiSubmit"
                  t-prop="f_close_btn" t-bind-click="close">Close</button>
        `, this.footer);
    }
}

export class Dialog extends Message {

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
