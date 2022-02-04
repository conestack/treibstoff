import * as ajax from './ajax.js';
import * as events from './events.js';
import * as form from './form.js';
import * as keystate from './keystate.js';
import * as listener from './listener.js';
import * as motion from './motion.js';
import * as overlay from './overlay.js';
import * as parser from './parser.js';
import * as properties from './properties.js';
import * as utils from './utils.js';
import * as widget from './widget.js';
import * as websocket from './websocket.js';

let api = {};

Object.assign(api, ajax);
Object.assign(api, events);
Object.assign(api, form);
Object.assign(api, keystate);
Object.assign(api, listener);
Object.assign(api, motion);
Object.assign(api, overlay);
Object.assign(api, parser);
Object.assign(api, properties);
Object.assign(api, utils);
Object.assign(api, widget);
Object.assign(api, websocket);

const ts = api;
export default ts;
