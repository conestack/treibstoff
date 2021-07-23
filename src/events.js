export class Events {

    constructor() {
        this._subscribers = {};
        this._suppress_events = false;
    }

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

    trigger(event, options) {
        if (this._suppress_events) {
            return;
        }
        if (this[event]) {
            this[event](options);
        }
        let subscribers = this._subscribers[event];
        if (!subscribers) {
            return this;
        }
        for (let i = 0; i < subscribers.length; i++) {
            subscribers[i](this, options);
        }
        return this;
    }

    suppress_events(fn) {
        this._suppress_events = true;
        fn();
        this._suppress_events = false;
    }

    bind_from_options(events, options) {
        for (let event of events) {
            if (options[event]) {
                this.on(event, options[event]);
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
