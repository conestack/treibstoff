import $ from 'jquery';
import {Events} from './events.js';

export class KeyState extends Events {

    constructor(filter_keyevent) {
        super();
        this.filter_keyevent = filter_keyevent;
        this._keys = [];
        this._add_key('ctrl', 17);
        this._add_key('shift', 16);
        this._add_key('alt', 18);
        this._add_key('enter', 13);
        this._add_key('esc', 27);
        this._add_key('delete', 46);
        this.bind();
    }

    unload() {
        $(window).off('keydown', this._keydown_handle);
        $(window).off('keyup', this._keyup_handle);
    }

    bind() {
        this._keydown_handle = this._keydown.bind(this);
        this._keyup_handle = this._keyup.bind(this);
        $(window).on('keydown', this._keydown_handle);
        $(window).on('keyup', this._keyup_handle);
    }

    _add_key(name, key_code) {
        this._keys.push(name);
        this[`_${name}`] = false;
        Object.defineProperty(this, name, {
            get: function() {
                return this[`_${name}`];
            },
            set: function(evt) {
                let val = this[`_${name}`];
                if (evt.type == 'keydown') {
                    if (!val && evt.keyCode == key_code) {
                        this[`_${name}`] = true;
                    }
                } else {
                    if (val && evt.keyCode == key_code) {
                        this[`_${name}`] = false;
                    }
                }
            }
        });
    }

    _set_keys(evt) {
        for (let name of this._keys) {
            this[name] = evt;
        }
    }

    _filter_event(evt) {
        return this.filter_keyevent && this.filter_keyevent(evt);
    }

    _keydown(evt) {
        this._set_keys(evt);
        if (!this._filter_event(evt)) {
            this.trigger('keydown', evt);
        }
    }

    _keyup(evt) {
        this._set_keys(evt);
        if (!this._filter_event(evt)) {
            this.trigger('keyup', evt);
        }
    }
}
