import $ from 'jquery';
import {ajax} from './ssr/ajax.js';

export * from './ssr/ajax.js';
export * from './ssr/action.js';
export * from './ssr/destroy.js';
export * from './ssr/dispatcher.js';
export * from './ssr/event.js';
export * from './ssr/form.js';
export * from './ssr/handle.js';
export * from './ssr/overlay.js';
export * from './ssr/parser.js';
export * from './ssr/path.js';
export * from './ssr/util.js';

export * from './bootstrap.js';
export * from './clock.js';
export * from './events.js';
export * from './form.js';
export * from './keystate.js';
export * from './listener.js';
export * from './motion.js';
export * from './overlay.js';
export * from './parser.js';
export * from './properties.js';
export * from './request.js';
export * from './spinner.js';
export * from './utils.js';
export * from './websocket.js';
export * from './widget.js';

$(function() {
    ajax.spinner.hide();
    $(document).tsajax();
});
