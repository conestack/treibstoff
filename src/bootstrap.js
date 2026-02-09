/**
 * Bootstrap 5 cleanup integration.
 *
 * Registers an Ajax destroy handler that disposes Bootstrap Dropdown
 * and Tooltip instances when DOM elements are removed by the Ajax
 * system. Only active when ``window.bootstrap`` is defined.
 *
 * @module bootstrap
 */
import $ from 'jquery';
import { register_ajax_destroy_handle } from './ssr/destroy.js';

/**
 * Dispose Bootstrap Dropdown and Tooltip instances attached to a DOM node.
 *
 * @param {Node} node - DOM node to clean up.
 * @private
 */
function destroy_bootstrap(node) {
    let dd = window.bootstrap.Dropdown.getInstance(node);
    let tt = window.bootstrap.Tooltip.getInstance(node);
    if (dd) {
        dd.dispose();
    }
    if (tt) {
        tt.dispose();
    }
    dd = null;
    tt = null;
}

$(() => {
    if (window.bootstrap !== undefined) {
        register_ajax_destroy_handle(destroy_bootstrap);
    }
});
