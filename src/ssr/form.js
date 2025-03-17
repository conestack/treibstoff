import $ from 'jquery';
import {compile_template} from '../parser.js';


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
