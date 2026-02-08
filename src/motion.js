import $ from 'jquery';
import {Events} from './events.js';

/**
 * Mouse motion tracking class.
 *
 * Provides mousedown, mousemove and mouseup tracking on configurable
 * DOM scopes. Used for drag, resize and selection interactions.
 *
 * @fires down - Fired on mousedown. Receives the DOM event.
 * @fires move - Fired on mousemove. The event has ``motion`` and
 * ``prev_pos`` properties.
 * @fires up - Fired on mouseup. The event has a ``motion`` flag.
 */
export class Motion extends Events {

    constructor() {
        super();
        this._down_handle = null;
        this._down_scope = null;
        this._move_scope = null;
    }

    /**
     * Reset internal motion state. Called after mouseup and when
     * setting a new scope.
     */
    reset_state() {
        this._move_handle = null;
        this._up_handle = null;
        this._prev_pos = null;
        this._motion = null;
    }

    /**
     * Set the DOM scopes for motion tracking.
     *
     * Binds a ``mousedown`` listener on the down scope. When
     * mousedown fires, ``mousemove`` is bound on the move scope
     * and ``mouseup`` on the document.
     *
     * @param {jQuery|HTMLElement} down - Element to listen for mousedown.
     * @param {jQuery|HTMLElement} move - Element to listen for mousemove.
     * If omitted, mousemove is not tracked.
     * @throws {string} If called while a motion sequence is in progress.
     */
    set_scope(down, move) {
        if (this._up_handle) {
            throw 'Attempt to set motion scope while handling';
        }
        this.reset_state();
        if (this._down_handle) {
            $(this._down_scope).off('mousedown', this._down_handle);
        }
        this._down_handle = this._mousedown.bind(this);
        this._down_scope = down;
        $(down).on('mousedown', this._down_handle);
        this._move_scope = move ? move : null;
    }

    /** @private */
    _mousedown(evt) {
        evt.stopPropagation();
        this._motion = false;
        this._prev_pos = {
            x: evt.pageX,
            y: evt.pageY
        };
        if (this._move_scope) {
            this._move_handle = this._mousemove.bind(this);
            $(this._move_scope).on('mousemove', this._move_handle);
        }
        this._up_handle = this._mouseup.bind(this);
        $(document).on('mouseup', this._up_handle);
        this.trigger('down', evt);
    }

    /** @private */
    _mousemove(evt) {
        evt.stopPropagation();
        this._motion = true;
        evt.motion = this._motion;
        evt.prev_pos = this._prev_pos;
        this.trigger('move', evt);
        this._prev_pos.x = evt.pageX;
        this._prev_pos.y = evt.pageY;
    }

    /** @private */
    _mouseup(evt) {
        evt.stopPropagation();
        if (this._move_scope) {
            $(this._move_scope).off('mousemove', this._move_handle);
        }
        $(document).off('mouseup', this._up_handle);
        evt.motion = this._motion;
        this.trigger('up', evt);
        this.reset_state();
    }
}
