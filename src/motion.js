import $ from 'jquery';
import {Events} from './events.js';


export class Motion extends Events {

    constructor() {
        super();
        this._down_handle = null;
        this._down_scope = null;
        this._move_scope = null;
    }

    reset_state() {
        this._move_handle = null;
        this._up_handle = null;
        this._prev_pos = null;
        this._motion = null;
    }

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
}
