import $ from 'jquery';
import {set_svg_attrs} from './utils.js';

/**
 * Base observable property.
 *
 * Defines a getter/setter on the target instance via
 * ``Object.defineProperty``. When the value changes, triggers an
 * ``on_{name}`` event on the instance (if it has a ``trigger`` method).
 */
export class Property {

    /**
     * Create a property on the given instance.
     *
     * @param {Object} inst - Instance to define the property on.
     * @param {string} name - Property name.
     * @param {any} val - Optional initial value.
     */
    constructor(inst, name, val) {
        this._inst = inst;
        this._name = name;
        this._val = null;
        Object.defineProperty(inst, name, {
            get: this.get.bind(this),
            set: this.set.bind(this),
            enumerable: true
        });
        if (val !== undefined) {
            inst[name] = val;
        }
    }

    /**
     * Get the current value.
     *
     * @returns {any} Current value.
     */
    get() {
        return this._val;
    }

    /**
     * Set the value. Triggers ``on_{name}`` event if value changed.
     *
     * @param {any} val - New value.
     */
    set(val) {
        let changed = val !== this._val;
        this._val = val;
        if (changed) {
            this.trigger(`on_${this._name}`, val);
        }
    }

    /**
     * Trigger an event on the owning instance.
     *
     * @param {string} evt - Event name.
     * @param {any} opts - Event arguments.
     */
    trigger(evt, opts) {
        let inst = this._inst;
        if (inst.trigger) {
            inst.trigger(evt, opts);
        }
    }
}

/**
 * Property bound to a DOM context element.
 *
 * Extends ``Property`` with a context element (``ctx``), a target
 * attribute name (``tgt``), and a context attribute name (``ctxa``)
 * for lazy context resolution.
 */
export class BoundProperty extends Property {

    /**
     * Create a bound property.
     *
     * @param {Object} inst - Instance to define the property on.
     * @param {string} name - Property name.
     * @param {Object} opts - Options.
     * @param {any} opts.ctx - Context element. Defaults to ``inst[ctxa]``.
     * @param {string} opts.ctxa - Context attribute name on the instance.
     * Defaults to ``'elem'``.
     * @param {string} opts.tgt - Target attribute name. Defaults to ``name``.
     * @param {any} opts.val - Optional initial value.
     */
    constructor(inst, name, opts) {
        super(inst, name);
        this._ctxa = 'elem';
        if (!opts) {
            this._ctx = inst[this._ctxa];
            this._tgt = name;
        } else {
            this._ctxa = opts.ctxa !== undefined ? opts.ctxa : this._ctxa;
            this._ctx = opts.ctx !== undefined ? opts.ctx : inst[this._ctxa];
            this._tgt = opts.tgt !== undefined ? opts.tgt : name;
        }
        let val = opts ? opts.val : undefined;
        if (val !== undefined) {
            inst[name] = val;
        }
    }

    /**
     * Property name.
     * @type {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Current property value.
     * @type {any}
     */
    get val() {
        return this._val;
    }

    /**
     * Context element. Lazily resolved from ``inst[ctxa]`` if not set.
     * @type {any}
     */
    get ctx() {
        if (!this._ctx) {
            this._ctx = this._inst[this._ctxa];
        }
        return this._ctx;
    }

    /**
     * Target attribute name.
     * @type {string}
     */
    get tgt() {
        return this._tgt;
    }
}

/**
 * Property that syncs its value to a plain data object.
 *
 * On set, writes ``val`` to ``ctx[tgt]``. The default context is
 * ``inst.data``.
 *
 * @extends BoundProperty
 */
export class DataProperty extends BoundProperty {

    /**
     * @param {Object} inst - Instance to define the property on.
     * @param {string} name - Property name.
     * @param {Object} opts - Options (see ``BoundProperty``). Context
     * defaults to ``inst.data``.
     */
    constructor(inst, name, opts) {
        if (!opts) {
            opts = {ctx: inst.data};
        } else {
            opts.ctx = opts.ctx !== undefined ? opts.ctx : inst.data;
        }
        opts.ctxa = 'data';
        super(inst, name, opts);
    }

    /** @override */
    set(val) {
        this.ctx[this.tgt] = val;
        super.set(val);
    }
}

/**
 * Property that syncs its value to a jQuery element attribute.
 *
 * On set, calls ``ctx.attr(tgt, val)``.
 *
 * @extends BoundProperty
 */
export class AttrProperty extends BoundProperty {

    /** @override */
    set(val) {
        this.ctx.attr(this.tgt, val);
        super.set(val);
    }
}

/**
 * Property that syncs its value to a jQuery element's text content.
 *
 * On set, calls ``ctx.text(val)``.
 *
 * @extends BoundProperty
 */
export class TextProperty extends BoundProperty {

    /** @override */
    set(val) {
        this.ctx.text(val);
        super.set(val);
    }
}

/**
 * Property that syncs its value to a CSS style on the context element.
 *
 * On set, calls ``$(ctx).css(tgt, val)``.
 *
 * @extends BoundProperty
 */
export class CSSProperty extends BoundProperty {

    /** @override */
    set(val) {
        $(this.ctx).css(this.tgt, val);
        super.set(val);
    }
}

/**
 * Property bound to an ``<input>`` element.
 *
 * Listens for ``change`` events on the input and updates the property
 * value. Supports value extraction/validation via an ``extract``
 * function. On extraction error, sets ``error`` flag and ``msg``.
 *
 * @extends BoundProperty
 */
export class InputProperty extends BoundProperty {

    /**
     * @param {Object} inst - Instance to define the property on.
     * @param {string} name - Property name.
     * @param {Object} opts - Options (see ``BoundProperty``).
     * @param {function} opts.extract - Optional value extractor/validator.
     * @param {string} opts.state_evt - Event name for state changes.
     * Defaults to ``'on_prop_state'``.
     */
    constructor(inst, name, opts) {
        super(inst, name, opts);
        this.extract = opts ? opts.extract : null;
        this.state_evt = opts
            ? (opts.state_evt ? opts.state_evt : 'on_prop_state')
            : 'on_prop_state';
        this.error = false;
        this.msg = '';
        this._err_marker = {};
        this.ctx.on('change', this._change.bind(this));
    }

    /** @override */
    set(val) {
        $(this.ctx).val(val);
        this._set(val);
    }

    /** @private */
    _change(evt) {
        let val = $(evt.currentTarget).val();
        this._set(val);
    }

    /** @private */
    _set(val) {
        val = this._extract(val);
        if (val !== this._err_marker) {
            super.set(val);
        }
        if (this.extract) {
            this.trigger(this.state_evt, this);
        }
    }

    /** @private */
    _extract(val) {
        if (this.extract) {
            try {
                val = this.extract(val);
                this.error = false;
                this.msg = '';
            } catch (err) {
                val = this._err_marker;
                this.error = true;
                this.msg = err;
            }
        }
        return val;
    }
}

/**
 * Property bound to a ``<button>`` element.
 *
 * Fires ``on_{name}_down``, ``on_{name}_up`` and ``on_{name}_click``
 * events on mousedown, mouseup and click respectively. On set, updates
 * the button text.
 *
 * @extends BoundProperty
 */
export class ButtonProperty extends BoundProperty {

    /**
     * @param {Object} inst - Instance to define the property on.
     * @param {string} name - Property name.
     * @param {Object} opts - Options (see ``BoundProperty``).
     */
    constructor(inst, name, opts) {
        super(inst, name, opts);
        this.ctx.on('mousedown', this._down.bind(this));
        this.ctx.on('mouseup', this._up.bind(this));
        this.ctx.on('click', this._click.bind(this));
    }

    /** @override */
    set(val) {
        this.ctx.text(val);
        super.set(val);
    }

    /** @private */
    _down(evt) {
        this.trigger(`on_${this.name}_down`, this);
    }

    /** @private */
    _up(evt) {
        this.trigger(`on_${this.name}_up`, this);
    }

    /** @private */
    _click(evt) {
        this.trigger(`on_${this.name}_click`, this);
    }
}

/**
 * Property that syncs its value to an SVG element attribute.
 *
 * On set, calls ``set_svg_attrs`` with the property name and value.
 *
 * @extends BoundProperty
 */
export class SVGProperty extends BoundProperty {

    /** @override */
    set(val) {
        let attrs = {};
        attrs[this._name] = val;
        set_svg_attrs(this.ctx, attrs);
        super.set(val);
    }
}
