import $ from 'jquery';
import {set_svg_attrs} from './utils.js';


export class Property {

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

    get() {
        return this._val;
    }

    set(val) {
        let changed = val !== this._val;
        this._val = val;
        if (changed) {
            this.trigger(`on_${this._name}`, val);
        }
    }

    trigger(evt, opts) {
        let inst = this._inst;
        if (inst.trigger) {
            inst.trigger(evt, opts);
        }
    }
}

export class BoundProperty extends Property {

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

    get name() {
        return this._name;
    }

    get val() {
        return this._val;
    }

    get ctx() {
        if (!this._ctx) {
            this._ctx = this._inst[this._ctxa];
        }
        return this._ctx;
    }

    get tgt() {
        return this._tgt;
    }
}

export class DataProperty extends BoundProperty {

    constructor(inst, name, opts) {
        if (!opts) {
            opts = {ctx: inst.data};
        } else {
            opts.ctx = opts.ctx !== undefined ? opts.ctx : inst.data;
        }
        opts.ctxa = 'data';
        super(inst, name, opts);
    }

    set(val) {
        this.ctx[this.tgt] = val;
        super.set(val);
    }
}

export class AttrProperty extends BoundProperty {

    set(val) {
        this.ctx.attr(this.tgt, val);
        super.set(val);
    }
}

export class TextProperty extends BoundProperty {

    set(val) {
        this.ctx.text(val);
        super.set(val);
    }
}

export class CSSProperty extends BoundProperty {

    set(val) {
        $(this.ctx).css(this.tgt, val);
        super.set(val);
    }
}

export class InputProperty extends BoundProperty {

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

    set(val) {
        $(this.ctx).val(val);
        this._set(val);
    }

    _change(evt) {
        let val = $(evt.currentTarget).val();
        this._set(val);
    }

    _set(val) {
        val = this._extract(val);
        if (val !== this._err_marker) {
            super.set(val);
        }
        if (this.extract) {
            this.trigger(this.state_evt, this);
        }
    }

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

export class ButtonProperty extends BoundProperty {

    constructor(inst, name, opts) {
        super(inst, name, opts);
        this.ctx.on('mousedown', this._down.bind(this));
        this.ctx.on('mouseup', this._up.bind(this));
    }

    set(val) {
        this.ctx.text(val);
        super.set(val);
    }

    _down(evt) {
        this.trigger(`on_${this.name}_down`, this);
    }

    _up(evt) {
        this.trigger(`on_${this.name}_up`, this);
    }
}

export class SVGProperty extends BoundProperty {

    set(val) {
        let attrs = {};
        attrs[this._name] = val;
        set_svg_attrs(this.ctx, attrs);
        super.set(val);
    }
}
