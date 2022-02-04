/**
 * Create listener base or mixin class.
 *
 * A mixin is an object in the following format::
 *
 *     let ClickListenerMixin = {
 *
 *         // ``listen`` is responsible to bind the event handler to the
 *         // instance and the desired event to ``this.elem`` if found.
 *         // This function not ends up on the newly created class but gets
 *         // called as closure in the generated constructor.
 *         listen: function() {
 *             this.on_click = this.on_click.bind(this);
 *             if (this.elem) {
 *                 this.elem.on('click', this.on_click);
 *             }
 *         },
 *
 *         // The actual event handler. Supposed to be implemented on a
 *         // subclass of the newly created listener class.
 *         on_click: function(evt) {
 *         }
 *     };
 *
 * @param {Object} mixin - Mixin assigned to the newly created class.
 * @param {class} base - Optional base class to extend.
 * @returns {class} Newly created listener class.
 **/
function create_listener(mixin, base=null) {
    let listen = mixin.listen,
        mixin_ = {};
    Object.assign(mixin_, mixin);
    delete mixin_.listen;
    let listener;
    if (base) {
        listener = class extends base {
            constructor(...args) {
                super(...args);
                listen.bind(this)();
            }
        };
    } else {
        listener = class {
            constructor(opts) {
                if (!opts.elem) {
                    throw `No element given`;
                }
                this.elem = opts.elem;
                listen.bind(this)();
            }
        };
    }
    Object.assign(listener.prototype, mixin_);
    return listener;
}

/**
 * Object for listening to DOM click event on element.
 *
 * @mixin
 **/
let ClickListenerMixin = {

    listen: function() {
        this.on_click = this.on_click.bind(this);
        if (this.elem) {
            this.elem.on('click', this.on_click);
        }
    },

    on_click: function(evt) {
    }
};
export let ClickListener = create_listener(ClickListenerMixin);
export let clickListener = Base => create_listener(ClickListenerMixin, Base);

/**
 * Object for listening to DOM change event on element.
 *
 * @mixin
 **/
let ChangeListenerMixin = {

    listen: function() {
        this.on_change = this.on_change.bind(this);
        if (this.elem) {
            this.elem.on('change', this.on_change);
        }
    },

    on_change: function(evt) {
    }
};
export let ChangeListener = create_listener(ChangeListenerMixin);
export let changeListener = Base => create_listener(ChangeListenerMixin, Base);
