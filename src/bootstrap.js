import $ from 'jquery';
import {register_ajax_destroy_handle} from "./ssr/destroy.js";

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

$(function() {
    if (window.bootstrap !== undefined) {
        register_ajax_destroy_handle(destroy_bootstrap);
    }
});
