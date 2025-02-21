import $ from 'jquery';
import {compile_template} from './parser.js';

/**
 * Loading spinner.
 *
 * The loading spinner displays a loading animation indicating something is
 * going to be prepared, usually waiting for a HTTP request to complete.
 *
 * Internally it holds a display count which gets increased every time the
 * ``show`` function is called. With each ``hide`` call, the counter gets
 * decreased, and as soon as it reaches 0 the spinner disappears. This
 * way it's possible to perform simultaneous tasks using the spinner while
 * avoiding flickering of the animation or the spinner disappearing while a
 * task is still in progress.
 *
 * The loading spinner is provided as singleton.
 *
 * Show the spinner::
 *
 *     ts.spinner.show();
 *
 * Hide the spinner. Spinner not disappears before count reaches 0::
 *
 *     ts.spinner.hide();
 *
 * Force closing of the spinner and reset count::
 *
 *     ts.spinner.close(true);
 */
export class LoadingSpinner {

    constructor() {
        this._count = 0;
        this.compile();
    }

    compile() {
        compile_template(this, `
          <div id="t-loading-spinner" t-elem="elem" class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        `);
    }

    /**
     * Show spinner animation.
     */
    show() {
        this._count++;
        if (this._count > 1) {
            return;
        }
        $('body').append(this.elem);
    }

    /**
     * Hide spinner animation.
     *
     * @param {boolean} force - Forces spinner to disappear and resets display
     * count.
     */
    hide(force) {
        this._count--;
        if (force) {
            this._count = 0;
            this.elem.remove();
            return;
        } else if (this._count <= 0) {
            this._count = 0;
            this.elem.remove();
        }
    }
}

const spinner = new LoadingSpinner();
export {spinner};
