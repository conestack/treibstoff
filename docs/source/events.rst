Events
======

Overview
--------

Treibstoff contains an event dispatcher to inherit from. It supports subscribing
and unsubscribing handlers to (named) events and implementing default handlers
for events on the class directly.

.. code-block:: js

    import {Events} from 'events'

    /**
      * Custom event dispatcher.
      */
    class MyDispatcher extends Events {

        /**
         * Default event handler if 'on_my_event' gets triggered on an
         * instance of ``MyDispatcher``
         *
         * @param {Object} options - Options passed to ``tigger``.
         */
        on_my_event(options) {
        }
    }

    /**
     * External subscriber function.
     *
     * @param {Events} inst - ``Events`` instance the ``trigger``
     * function was called on.
     * @param {Object} options - Options passed to ``tigger``.
     */
    let my_subscriber(inst, options) {
    }

    // Create dispatcher
    let dsp = new MyDispatcher();

    // Bind external subscriber function
    dsp.on('on_my_event', my_subscriber);

    // Trigger event
    dsp.trigger('on_my_event', {foo: 'bar'});

    // Unbind external subscriber function.
    dsp.off('on_my_event', my_subscriber);
