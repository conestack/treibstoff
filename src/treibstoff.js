import * as ajax from './ajax.js';
import * as clock from './clock.js';
import * as events from './events.js';
import * as form from './form.js';
import * as keystate from './keystate.js';
import * as listener from './listener.js';
import * as motion from './motion.js';
import * as overlay from './overlay.js';
import * as parser from './parser.js';
import * as properties from './properties.js';
import * as request from './request.js';
import * as spinner from './spinner.js';
import * as utils from './utils.js';
import * as websocket from './websocket.js';
import * as widget from './widget.js';

let api = {};

Object.assign(api, ajax);
Object.assign(api, clock);
Object.assign(api, events);
Object.assign(api, form);
Object.assign(api, keystate);
Object.assign(api, listener);
Object.assign(api, motion);
Object.assign(api, overlay);
Object.assign(api, parser);
Object.assign(api, properties);
Object.assign(api, request);
Object.assign(api, spinner);
Object.assign(api, utils);
Object.assign(api, websocket);
Object.assign(api, widget);

const ts = api;
export default ts;
