/**
 * Class for deferring function call prior to the next repaint.
 */
export class ClockFrameEvent {
    /**
     * Create frame event. The callback gets passed a timestamp as first
     * argument.
     *
     * @param {function} callback - Function to be called before next repaint.
     * @param {...any} opts - Arbitrary arguments which additionally gets passed
     * to callback.
     */
    constructor(callback, ...opts) {
        this._request_id = window.requestAnimationFrame((timestamp) => {
            callback(timestamp, ...opts);
        });
    }

    /**
     * Abort frame event.
     */
    cancel() {
        if (this._request_id !== null) {
            window.cancelAnimationFrame(this._request_id);
            this._request_id = null;
        }
    }
}

/**
 * Class for deferring function call after timeout.
 */
export class ClockTimeoutEvent {
    /**
     * Create timeout event. The callback gets passed a timestamp as first
     * argument.
     *
     * @param {function} callback - Function to be called after timeout.
     * @param {number} delay - Time in milliseconds to wait before callback
     * execution.
     * @param {...any} opts - Arbitrary arguments which additionally gets passed
     * to callback.
     */
    constructor(callback, delay, ...opts) {
        this._timeout_id = window.setTimeout(() => {
            callback(document.timeline.currentTime, ...opts);
        }, delay);
    }

    /**
     * Abort timeout event.
     */
    cancel() {
        if (this._timeout_id !== null) {
            window.clearTimeout(this._timeout_id);
            this._timeout_id = null;
        }
    }
}

/**
 * Class for executing function call periodically.
 */
export class ClockIntervalEvent {
    /**
     * Create interval event. The callback gets passed a timestamp as first
     * argument and the event instance as second argument.
     *
     * @param {function} callback - Function to be called before next repaint.
     * @param {number} interval - Execution interval time in milliseconds.
     * @param {...any} opts - Arbitrary arguments which gets additionally passed
     * to callback.
     */
    constructor(callback, interval, ...opts) {
        this._interval_id = window.setInterval(() => {
            callback(document.timeline.currentTime, this, ...opts);
        }, interval);
    }

    /**
     * Abort interval event.
     */
    cancel() {
        if (this._interval_id !== null) {
            window.clearInterval(this._interval_id);
            this._interval_id = null;
        }
    }
}

/**
 * Class for creating clock events.
 */
export class Clock {
    /**
     * Creates and returns a frame event instance. See ``ClockFrameEvent``
     * documentation for details.
     */
    schedule_frame(callback, ...opts) {
        return new ClockFrameEvent(callback, ...opts);
    }

    /**
     * Creates and returns a timout event instance. See ``ClockTimeoutEvent``
     * documentation for details.
     */
    schedule_timeout(callback, delay, ...opts) {
        return new ClockTimeoutEvent(callback, delay, ...opts);
    }

    /**
     * Creates and returns an interval event instance. See
     * ``ClockIntervalEvent`` documentation for details.
     */
    schedule_interval(callback, interval, ...opts) {
        return new ClockIntervalEvent(callback, interval, ...opts);
    }
}

const clock = new Clock();
export { clock };
