Events
======

Overview
--------

``Events`` is a basic event dispatcher. It is supposed to inherit from. It
supports subscribing and unsubscribing handlers to (named) events and
implementing default handlers for events on the class directly.

Bind a handler to an event dispatcher:

.. code-block:: js

    import {Events} from 'events';

    /**
     * Handler function.
     *
     * @param {Events} inst - ``Events`` instance the ``trigger`` function was
     * called on.
     * @param {Object} options - Options passed to ``tigger``.
     */
    function on_event(inst, options) {
        console.log('`on_event` has been triggered.');
    }

    let dispatcher = new Events();
    dispatcher.on('on_event', on_event);

When triggering `event` on our dispatcher, the handler gets called:

.. code-block:: js

    > dispatcher.trigger('on_event', {'option': 'value'});
      `on_event` has been triggered.

Unbinding event handler. If handler gets omitted, all registered handlers for
event are removed:

.. code-block:: js

    dispatcher.off('on_event', on_event);

A default event handlers is a function named after the event. If present, it
gets called very first when the event is triggered.

Note: Instance is not passed as argument to default handler function:

.. code-block:: js

    class Dispatcher extends Events {

        on_event(options) {
            console.log('Default `on_event` handler called.');
        }
    }

    let dispatcher = new Dispatcher();

    > dispatcher.trigger('on_event');
      Default `on_event` handler called.

API
---

.. js:autoclass:: Events
    :members:
        on,
        off,
        trigger,
        suppress_events,
        bind_from_options
