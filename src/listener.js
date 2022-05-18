import {Events} from '../src/events.js';

/**
 * Create listener base or mixin class handling given DOM event.
 *
 * The created listener receives the DOM event and triggers it as treibstoff
 * event, prefixed by 'on_'.
 *
 * Create a listener base class to inherit from::
 *
 *     let ClickListener = create_listener('click');
 *
 * Use the listener base class::
 *
 *     class ClickEventHandle extends ClickListener {
 *         on_click(evt) {
 *             // default event handle
 *         }
 *     }
 *
 * Create a listener mixin class::
 *
 *     let clickListener = Base => create_listener('click', Base);
 *
 * Use the listener mixin class::
 *
 *     class MixedInClickEventHandle extends clickListener(Events) {
 *         on_click(evt) {
 *             // default event handle
 *         }
 *     }
 *
 * Listener classes expect an ``opts`` object at initialization time containing
 * an ``elem`` property with the jQuery wrapped DOM element to listen to. If
 * this is missing, an error gets thrown::
 *
 *     let listener = new ClickEventHandle({elem: $('<div />')});
 *
 * In case of use as mixin class, the opts gets passed to the superclass
 * constructor::
 *
 *     class Superclass extends Events {
 *         constructor(opts) {
 *             super();
 *             // handle custom stuff from options here
 *         }
 *     }
 *
 *     class MixedInClickEventHandle extends clickListener(Superclass) {
 *     }
 *
 * @param {Object} event - DOM event to bind to.
 * @param {class} base - Optional base class to extend. Must extend ``Events``.
 * @returns {class} Newly created listener class.
 **/
export function create_listener(event, base=null) {
    base = base || Events;
    return class extends base {
        constructor(opts) {
            if (opts === undefined) {
                throw 'No options given';
            }
            if (!opts.elem) {
                throw 'No element given';
            }
            if (base === Events) {
                super();
            } else {
                super(opts);
            }
            this.elem = opts.elem;
            this.elem.on(event, (evt) => {
                this.trigger(`on_${event}`, evt);
            });
        }
    };
}

/**
 * DOM ``click`` event listener as base class.
 */
export let ClickListener = create_listener('click');

/**
 * DOM ``click`` event listener as mixin class.
 */
export let clickListener = Base => create_listener('click', Base);

/**
 * DOM ``change`` event listener as base class.
 */
export let ChangeListener = create_listener('change');

/**
 * DOM ``change`` event listener as mixin class.
 */
export let changeListener = Base => create_listener('change', Base);
