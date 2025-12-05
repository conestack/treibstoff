import $ from 'jquery';
import {
    parse_path,
    set_default,
} from '../utils.js';
import {AjaxOperation} from './util.js';


/**
 * Handle for path operation.
 */
export class AjaxPath extends AjaxOperation {

    constructor(opts) {
        opts.event = 'on_path';
        super(opts);
        this.win = opts.win;
        $(this.win).on('popstate', this.state_handle.bind(this));
    }

    execute(opts) {
        let history = this.win.history;
        if (history.pushState === undefined) {
            return;
        }
        let path = opts.path.charAt(0) !== '/' ? `/${opts.path}` : opts.path;
        set_default(opts, 'target', this.win.location.origin + path);
        set_default(opts, 'replace', false);
        let replace = opts.replace;
        // delete options which should not end up in state
        delete opts.path;
        delete opts.replace;
        opts._t_ajax = true;
        if (replace) {
            history.replaceState(opts, '', path);
        } else {
            history.pushState(opts, '', path);
        }
    }

    state_handle(evt) {
        let state = evt.originalEvent.state;
        if (!state) {
            return;
        }
        if (!state._t_ajax) {
            return;
        }
        evt.preventDefault();
        let target;
        if (state.target.url) {
            target = state.target;
        } else {
            target = this.parse_target(state.target);
        }
        target.params.popstate = '1';
        if (state.action) {
            this.dispatcher.trigger('on_action', {
                target: target,
                action: state.action
            });
        }
        if (state.event) {
            this.dispatcher.trigger('on_event', {
                target: target,
                event: state.event
            });
        }
        if (state.overlay) {
            this.dispatcher.trigger('on_overlay', {
                target: target,
                overlay: state.overlay,
                css: state.overlay_css,
                uid: state.overlay_uid,
                title: state.overlay_title
            });
        }
        if (!state.action && !state.event && !state.overlay) {
            this.win.location = target.url;
        }
    }

    handle(inst, opts) {
        let elem = opts.elem,
            evt = opts.event,
            path = elem.attr('ajax:path');
        if (path === 'href') {
            let href = elem.attr('href');
            path = parse_path(href, true);
        } else if (path === 'target') {
            let tgt = this.action_target(elem, evt);
            path = tgt.path + tgt.query;
        }
        let target;
        if (this.has_attr(elem, 'ajax:path-target')) {
            let path_target = elem.attr('ajax:path-target');
            if (path_target) {
                target = this.parse_target(path_target);
            }
        } else {
            target = this.action_target(elem, evt);
        }
        let p_opts = {
            path: path,
            target: target
        }
        p_opts.action = this.attr_val(elem, 'ajax:path-action', 'ajax:action');
        p_opts.event = this.attr_val(elem, 'ajax:path-event', 'ajax:event');
        p_opts.overlay = this.attr_val(elem, 'ajax:path-overlay', 'ajax:overlay');
        if (p_opts.overlay) {
            p_opts.overlay_css = this.attr_val(
                elem,
                'ajax:path-overlay-css',
                'ajax:overlay-css'
            );
            p_opts.overlay_uid = this.attr_val(
                elem,
                'ajax:path-overlay-uid',
                'ajax:overlay-uid'
            );
            p_opts.overlay_title = this.attr_val(
                elem,
                'ajax:path-overlay-title',
                'ajax:overlay-title'
            );
        }
        this.execute(p_opts);
    }

    has_attr(elem, name) {
        let val = elem.attr(name);
        // In some browsers val is undefined, in others it's false.
        return val !== undefined && val !== false;
    }

    attr_val(elem, name, fallback) {
        if (this.has_attr(elem, name)) {
            return elem.attr(name);
        } else {
            return elem.attr(fallback);
        }
    }
}
