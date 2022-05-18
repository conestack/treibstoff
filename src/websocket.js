import {Events} from './events.js';

export const WS_STATE_CONNECTING = 0;
export const WS_STATE_OPEN = 1;
export const WS_STATE_CLOSING = 2;
export const WS_STATE_CLOSED = 3;

/**
 * A websocket connection wrapper.
 *
 * The following events are triggered:
 *
 * - ``on_open``
 *     The websocket connection has been opened.
 *
 * - ``on_close``
 *     The websocket connection has been closed.
 *
 * - ``on_error``
 *     An error occurred on the websocket connection.
 *
 * - ``on_message``
 *     A message has been received from the websocket.
 *
 * - ``on_raw_message``
 *     A raw message has been received from the websocket.
 *
 * @extends Events
 */
export class Websocket extends Events {

    /**
     * Create Websocket instance.
     *
     * @param {string} path - The path to connect to.
     */
    constructor(path, factory=WebSocket) {
        super();
        // factory injection for tests
        this._ws_factory = factory;
        this.path = path;
        this.on_open = this.on_open.bind(this);
        this.on_close = this.on_close.bind(this);
        this.on_error = this.on_error.bind(this);
        this.on_message = this.on_message.bind(this);
        this.on_raw_message = this.on_raw_message.bind(this);
        this.sock = null;
    }

    /**
     * The full websocket URI. Build from window location and ``path``.
     * Considers TLS.
     *
     * @returns {string} The full websocket URI.
     */
    get uri() {
        let scheme;
        if (window.location.protocol == 'http:') {
            scheme = 'ws://';
        } else {
            scheme = 'wss://';
        }
        return scheme + window.location.hostname + this.path;
    }

    /**
     * The connection ready state. One out of ``WS_STATE_CONNECTING``,
     * ``WS_STATE_OPEN``, ``WS_STATE_CLOSING`` or ``WS_STATE_CLOSED``.
     *
     * @returns {number} The connection ready state.
     */
    get state() {
        return this.sock.readyState;
    }

    /**
     * Open connection to server.
     */
    open() {
        if (this.sock !== null) {
            this.sock.close();
        }
        let sock = this.sock = new this._ws_factory(this.uri);
        sock.onopen = function() {
            this.trigger('on_open');
        }.bind(this);
        sock.onclose = function(evt) {
            this.trigger('on_close', evt);
        }.bind(this);
        sock.onerror = function() {
            this.trigger('on_error');
        }.bind(this);
        sock.onmessage = function(evt) {
            this.trigger('on_raw_message', evt);
        }.bind(this);
    }

    /**
     * Send data to server.
     *
     * @param {string} data - Data to send.
     */
    send(data) {
        this.sock.send(data);
    }

    /**
     * Send JSON data to server.
     *
     * @param {Object} data - Data to send.
     */
    send_json(data) {
        this.sock.send(JSON.stringify(data));
    }

    /**
     * Close connection to server.
     */
    close() {
        if (this.sock !== null) {
            this.sock.close();
            this.sock = null;
        }
    }

    /**
     * Subscriber when connection has been opened.
     */
    on_open() {
    }

    /**
     * Subscriber when connection has been closed.
     *
     * @param {CloseEvent} evt - See
     * `CloseEvent <https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent>`_
     * documentation.
     */
    on_close(evt) {
    }

    /**
     * Subscriber when connection error has occurred.
     */
    on_error() {
    }

    /**
     * Subscriber when a message has been received from server.
     *
     * The data received from server gets passed as ``Object`` parsed from JSON
     * string. Heartbeat frames are ignored. If it's desired to change this
     * behavior, a subclass must be created which overrides ``on_raw_message``.
     *
     * @param {Object} data - Data received from server.
     */
    on_message(data) {
    }

    /**
     * Default subscriber when messages are received from server.
     *
     * The data received from server gets parsed to JSON. Heartbeat
     * frames are ignored. ``on_message`` event gets triggered with parsed data.
     *
     * @param {MessageEvent} evt - See
     * `MessageEvent <https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent>`_
     * documentation.
     */
    on_raw_message(evt) {
        let data = JSON.parse(evt.data);
        if (data.HEARTBEAT !== undefined) {
            return;
        }
        this.trigger('on_message', data);
    }
}
