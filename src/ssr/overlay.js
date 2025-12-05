import {
    get_overlay,
    Overlay,
} from '../overlay.js';
import {
    uuid4
} from '../utils.js';
import {AjaxAction} from './action.js';


/**
 * Handle for overlay operation.
 */
export class AjaxOverlay extends AjaxAction {

    constructor(opts) {
        opts.event = 'on_overlay';
        super(opts);
        this.overlay_content_sel = '.modal-body';
    }

    execute(opts) {
        let ol;
        if (opts.close) {
            ol = get_overlay(opts.uid);
            if (ol) {
                ol.close();
            }
            return ol;
        }
        let url, params;
        if (opts.target) {
            let target = opts.target;
            if (!target.url) {
                target = this.parse_target(target);
            }
            url = target.url;
            params = target.params;
        } else {
            url = opts.url;
            params = opts.params;
        }
        let uid = opts.uid ? opts.uid : uuid4();
        params['ajax.overlay-uid'] = uid;
        ol = new Overlay({
            uid: uid,
            css: opts.css,
            title: opts.title,
            on_close: opts.on_close
        })
        this.request({
            name: opts.action,
            selector: `#${uid} ${this.overlay_content_sel}`,
            mode: 'inner',
            url: url,
            params: params,
            success: function(data) {
                // overlays are not displayed if no payload is received.
                if (!data.payload) {
                    // ensure continuation gets performed anyway.
                    this.complete(data);
                    return;
                }
                ol.open();
                this.complete(data);
            }.bind(this)
        });
        return ol;
    }

    handle(inst, opts) {
        let target = opts.target,
            overlay = opts.overlay;
        if (overlay.indexOf('CLOSE') > -1) {
            this.execute({
                close: true,
                uid: overlay.indexOf(':') > -1 ? overlay.split(':')[1] : opts.uid
            });
            return;
        }
        this.execute({
            action: overlay,
            url: target.url,
            params: target.params,
            css: opts.css,
            uid: opts.uid,
            title: opts.title
        });
    }
}
