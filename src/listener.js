import { Events } from './events.js';
import { ajax } from './ssr/ajax.js';

/**
 * Create listener base or mixin class handling given DOM event.
 *
 * The created listener receives the DOM event and triggers it as treibstoff
 * event, prefixed by ``on_``.
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
 * Create a listener mixin::
 *
 *     let clickListener = Base => create_listener('click', Base);
 *
 * Use the listener mixin. The base class must be an instance of ``Events``::
 *
 *     class MixedInClickEventHandle extends clickListener(Events) {
 *         on_click(evt) {
 *             // default event handle
 *         }
 *     }
 *
 * Listeners expect the attribute ``elem`` on the instance, containing a jQuery
 * wrapped DOM element, to which the DOM event gets bound to. It can either be
 * passed in an ``opts`` object to the constructor or be set by the superclass
 * (if created as mixin). If element is missing, an error gets thrown::
 *
 *     let listener = new ClickEventHandle({elem: $('<div />')});
 *
 * In case of use as mixin, the opts gets passed to the superclass
 * constructor::
 *
 *     class Superclass extends Events {
 *         constructor(opts) {
 *             // opts get passed to superclass.
 *             super();
 *             this.elem = $('<div />');
 *         }
 *     }
 *
 *     class MixedInClickEventHandle extends clickListener(Superclass) {
 *     }
 *
 * @param {Object} event - DOM event to bind to.
 * @param {class} base - Optional base class to extend. Must extend ``Events``.
 * @returns {class} Newly created listener class.
 */
export function create_listener(event, base = null) {
    base = base || Events;
    if (!(base === Events || base.prototype instanceof Events)) {
        throw 'Base class must be subclass of or Events';
    }
    return class extends base {
        constructor(opts) {
            if (base === Events) {
                super();
            } else {
                super(opts);
            }
            let elem = this.elem;
            if (!elem && opts !== undefined) {
                elem = this.elem = opts.elem;
            }
            if (!elem) {
                throw 'No element found';
            }
            this.event = event;
            this.trigger_event = this.trigger_event.bind(this);
            this.elem.on(this.event, this.trigger_event);

            ajax.attach(this, this.elem);
        }

        trigger_event(evt) {
            this.trigger(`on_${event}`, evt);
        }

        destroy() {
            this.elem.off(this.event, this.trigger_event);
        }
    };
}

/**
 * DOM ``click`` event listener as base class.
 */
export const ClickListener = create_listener('click');

/**
 * DOM ``click`` event listener as mixin class.
 */
export const clickListener = (Base) => create_listener('click', Base);

/**
 * DOM ``change`` event listener as base class.
 */
export const ChangeListener = create_listener('change');

/**
 * DOM ``change`` event listener as mixin class.
 */
export const changeListener = (Base) => create_listener('change', Base);
