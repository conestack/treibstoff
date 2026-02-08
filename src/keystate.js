import $ from 'jquery';
import {Events} from './events.js';

/**
 * Keystate event dispatcher.
 */
export class KeyState extends Events {

    /**
     * @param {function} filter_keyevent - callback function to filter out
     * key events.
     */
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

    /**
     * Unloads this event dispatcher from window `keydown` and `keyup` DOM
     * events.
     *
     * XXX: Rename to ``destroy``
     */
    unload() {
        $(window)
            .off('keydown', this._on_dom_keydown)
            .off('keyup', this._on_dom_keyup);
    }

    /**
     * Bind this event dispatcher to window `keydown` and `keyup` DOM
     * events.
     *
     * This function gets called from the constructor.
     *
     * XXX: Probably no need to expose as API.
     */
    bind() {
        this._on_dom_keydown = this._on_dom_keydown.bind(this);
        this._on_dom_keyup = this._on_dom_keyup.bind(this);
        $(window)
            .on('keydown', this._on_dom_keydown)
            .on('keyup', this._on_dom_keyup);
    }

    /** @private */
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

    /** @private */
    _set_keys(evt) {
        for (let name of this._keys) {
            this[name] = evt;
        }
    }

    /** @private */
    _filter_event(evt) {
        return this.filter_keyevent && this.filter_keyevent(evt);
    }

    /** @private */
    _on_dom_keydown(evt) {
        this._set_keys(evt);
        if (!this._filter_event(evt)) {
            this.trigger('keydown', evt);
        }
    }

    /** @private */
    _on_dom_keyup(evt) {
        this._set_keys(evt);
        if (!this._filter_event(evt)) {
            this.trigger('keyup', evt);
        }
    }
}
