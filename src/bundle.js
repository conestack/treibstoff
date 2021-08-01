import $ from 'jquery';
import {ajax} from './ajax.js';

export * from './ajax.js';
export * from './events.js';
export * from './keystate.js';
export * from './motion.js';
export * from './overlay.js';
export * from './parser.js';
export * from './properties.js';
export * from './utils.js';
export * from './widget.js';

$(function() {
    ajax.spinner.hide();
    $(document).tsajax();
});
