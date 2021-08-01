import * as ajax from './ajax.js';
import * as events from './events.js';
import * as keystate from './keystate.js';
import * as motion from './motion.js';
import * as overlay from './overlay.js';
import * as parser from './parser.js';
import * as properties from './properties.js';
import * as utils from './utils.js';
import * as widget from './widget.js';

let api = {};

Object.assign(api, ajax);
Object.assign(api, events);
Object.assign(api, keystate);
Object.assign(api, motion);
Object.assign(api, overlay);
Object.assign(api, parser);
Object.assign(api, properties);
Object.assign(api, utils);
Object.assign(api, widget);

const ts = api;
export default ts;
