/**
 * Event dispatcher class.
 */
export class Events {

    constructor() {
        this._subscribers = {};
        this._suppress_events = false;
    }

    /**
     * Bind subscriber to event.
     *
     * @param {string} event - The event to bind to.
     * @param {function} subscriber - The function to call when event gets
     * triggered.
     */
    on(event, subscriber) {
        let subscribers = this._subscribers[event];
        if (subscribers === undefined) {
            this._subscribers[event] = subscribers = new Array();
        }
        if (this._contains_subscriber(event, subscriber)) {
            return this;
        }
        subscribers.push(subscriber);
        return this;
    }

    /**
     * Unbind subscriber from event.
     *
     * @param {string} event - The event to unbind from.
     * @param {function} subscriber - The registered subscriber function. If
     * omitted, all subscribers for event get removed.
     */
    off(event, subscriber) {
        let subscribers = this._subscribers[event];
        if (subscribers === undefined) {
            return this;
        }
        if (!subscriber) {
            delete this._subscribers[event];
            return this;
        }
        let idx = subscribers.indexOf(subscriber);
        if (idx > -1) {
            subscribers = subscribers.splice(idx, 1);
        }
        this._subscribers[event] = subscribers;
        return this;
    }

    /**
     * Trigger event.
     *
     * @param {string} event - The event to trigger.
     * @param {Object} opts - An optional options object which gets passed to
     * subscriber.
     */
    trigger(event, opts) {
        if (this._suppress_events) {
            return;
        }
        if (this[event]) {
            this[event](opts);
        }
        let subscribers = this._subscribers[event];
        if (!subscribers) {
            return this;
        }
        for (let i = 0; i < subscribers.length; i++) {
            subscribers[i](this, opts);
        }
        return this;
    }

    /**
     * Suppress triggering of events on this object while executing given
     * function.
     *
     * @param {function} fn - Function to execute.
     */
    suppress_events(fn) {
        this._suppress_events = true;
        fn();
        this._suppress_events = false;
    }

    /**
     * Bind events from options.
     *
     * This is shortcut for looking up event subscribers for events from an
     * options object and bind them if present.
     *
     * @param {Array} events - Event names to search subscribers for in options.
     * @param {Object} opts - The options object in which to search for
     * subscribers.
     */
    bind_from_options(events, opts) {
        for (let event of events) {
            if (opts[event]) {
                this.on(event, opts[event]);
            }
        }
    }

    _contains_subscriber(event, subscriber) {
        let subscribers = this._subscribers[event];
        if (!subscribers) {
            return false;
        }
        for (let i = 0; i < subscribers.length; i++) {
            if (subscribers[i] === subscriber) {
                return true;
            }
        }
        return false;
    }
}
