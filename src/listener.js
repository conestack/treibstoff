import {Events} from '../src/events.js';

/**
 * Create listener base or mixin class handling given DOM event.
 *
 * Create a listener base class to inherit from::
 *
 *     let ClickListener = create_listener('click');
 *
 * Create a listener mixin class::
 *
 *     let clickListener = Base => create_listener('click', Base);
 *
 * @param {Object} event - DOM event to bind to.
 * @param {class} base - Optional base class to extend. Must extend ``Events``.
 * @returns {class} Newly created listener class.
 **/
function create_listener(event, base=null) {
    base = base || Events;
    return class extends base {
        constructor(opts) {
            super(opts);
            if (!opts.elem) {
                throw `No element given`;
            }
            this.elem = opts.elem;
            this.elem.on(event, (evt) => {
                this.trigger(`on_${event}`, evt);
            });
        }
    };
}

export let ClickListener = create_listener('click');
export let clickListener = Base => create_listener('click', Base);

export let ChangeListener = create_listener('change');
export let changeListener = Base => create_listener('change', Base);
