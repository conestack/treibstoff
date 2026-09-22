import $ from 'jquery';
import { compile_template } from '../parser.js';

/**
 * Handle for Ajax form.
 */
export class AjaxForm {
    /**
     * @param {Object} opts - Options.
     * @param {AjaxHandle} opts.handle - DOM manipulation handle.
     * @param {LoadingSpinner} opts.spinner - Loading spinner instance.
     */
    constructor(opts) {
        this.handle = opts.handle;
        this.spinner = opts.spinner;
        this.afr = null;
    }

    /**
     * Bind a form element for Ajax submission via hidden iframe.
     *
     * @param {HTMLFormElement} form - The form DOM element.
     */
    bind(form) {
        this.ensure_afr();
        $(form)
            .append('<input type="hidden" name="ajax" value="1" />')
            .attr('target', 'ajaxformresponse')
            .off()
            .on(
                'submit',
                function (_event) {
                    // Again here, and not only on bind: a page can carry more
                    // than one ajax form, the iframe is shared by all of them
                    // and a successful submit removes it. A form bound before
                    // that and not re rendered since still points at it by
                    // name - and a target name the browser cannot resolve
                    // opens a new tab instead of submitting in place. Creating
                    // it in the handler is soon enough: the browser resolves
                    // the target after the submit event has run.
                    this.ensure_afr();
                    this.spinner.show();
                }.bind(this),
            );
    }

    /**
     * Create the hidden iframe all bound forms submit into, unless it is
     * already there.
     */
    ensure_afr() {
        if (this.afr) {
            return;
        }
        compile_template(
            this,
            `
          <iframe t-elem="afr" id="ajaxformresponse"
                  name="ajaxformresponse" src="about:blank"
                  style="width:0px;height:0px;display:none">
          </iframe>
        `,
            $('body'),
        );
    }

    /**
     * Render the form response after server-side processing.
     *
     * @param {Object} opts - Render options.
     * @param {string} opts.payload - The rendered form HTML.
     * @param {string} opts.selector - CSS selector of the form.
     * @param {string} opts.mode - DOM manipulation mode.
     * @param {Array} opts.next - Continuation operations.
     * @param {boolean} opts.error - Whether an error occurred.
     */
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
