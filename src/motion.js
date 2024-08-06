import $ from 'jquery';
import { Events } from './events.js';

export class Motion extends Events {

    constructor() {
        super();
        this._down_handle = null;
        this._down_scope = null;
        this._move_scope = null;
        this._touchstart_scope = null;
        this._touchmove_scope = null;
    }

    reset_state() {
        this._move_handle = null;
        this._touchmove_handle = null;
        this._up_handle = null;
        this._touchend_handle = null;
        this._prev_pos = null;
        this._motion = null;
    }

    set_scope(down, move, touchstart, touchmove) {
        if (this._up_handle || this._touchend_handle) {
            throw 'Attempt to set motion scope while handling';
        }
        this.reset_state();
        if (this._down_handle) {
            $(this._down_scope).off('mousedown', this._down_handle);
            $(this._down_scope).off('touchstart', this._touchstart.bind(this));
        }
        this._down_handle = this._mousedown.bind(this);
        this._down_scope = down;
        $(down).on('mousedown', this._down_handle);
        this._move_scope = move ? move : null;
        // touch events
        const touch_start = this._touchstart_scope = touchstart ? touchstart : down;
        $(touch_start).on('touchstart', this._touchstart.bind(this));
        this._touchmove_scope = touchmove ? touchmove : this._move_scope;
    }

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

    _mousemove(evt) {
        evt.stopPropagation();
        this._motion = true;
        evt.motion = this._motion;
        evt.prev_pos = this._prev_pos;
        this.trigger('move', evt);
        this._prev_pos.x = evt.pageX;
        this._prev_pos.y = evt.pageY;
    }

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

    _touchstart(evt) {
        evt.stopPropagation();
        let touch = evt.originalEvent.touches[0];
        this._motion = false;
        this._prev_pos = {
            x: touch.pageX,
            y: touch.pageY
        };
        if (this._touchmove_scope) {
            this._touchmove_handle = this._touchmove.bind(this);
            $(this._touchmove_scope).on('touchmove', this._touchmove_handle);
        }
        this._touchend_handle = this._touchend.bind(this);
        $(document).on('touchend', this._touchend_handle);
        this.trigger('touchstart', evt);
    }

    _touchmove(evt) {
        evt.stopPropagation();
        let touch = evt.originalEvent.touches[0];
        this._motion = true;
        evt.motion = this._motion;
        evt.prev_pos = this._prev_pos;
        this.trigger('touchmove', evt);
        this._prev_pos.x = touch.pageX;
        this._prev_pos.y = touch.pageY;
    }

    _touchend(evt) {
        evt.stopPropagation();
        if (this._touchmove_scope) {
            $(this._touchmove_scope).off('touchmove', this._touchmove_handle);
        }
        $(document).off('touchend', this._touchend_handle);
        evt.motion = this._motion;
        this.trigger('touchend', evt);
        this.reset_state();
    }
}
