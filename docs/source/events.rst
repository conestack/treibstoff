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
     * @param {Object} options - Options passed to ``trigger``.
     */
    function on_event(inst, options) {
        console.log('`on_event` has been triggered.');
    }

    let dispatcher = new Events();
    dispatcher.on('on_event', on_event);

When triggering ``event`` on our dispatcher, the handler gets called:

.. code-block:: js

    > dispatcher.trigger('on_event', {'option': 'value'});
      `on_event` has been triggered.

Both ``on()`` and ``off()`` return ``this`` for chaining:

.. code-block:: js

    dispatcher.on('on_a', handlerA).on('on_b', handlerB);

Unbinding event handler. If handler gets omitted, all registered handlers for
event are removed:

.. code-block:: js

    dispatcher.off('on_event', on_event);

Duplicate subscribers are silently ignored — registering the same function
twice for the same event has no effect.


Default Handlers
~~~~~~~~~~~~~~~~

A default event handler is a method named after the event. If present, it
gets called first when the event is triggered.

Note: Instance is not passed as argument to default handler function since
``this`` is already available:

.. code-block:: js

    class Dispatcher extends Events {

        on_event(options) {
            console.log('Default `on_event` handler called.');
        }
    }

    let dispatcher = new Dispatcher();

    > dispatcher.trigger('on_event');
      Default `on_event` handler called.

Both the default handler and external subscribers fire on trigger:

.. code-block:: js

    class Widget extends Events {
        on_update(val) {
            console.log('Default handler:', val);
        }
    }

    let w = new Widget();
    w.on('on_update', function(inst, val) {
        console.log('External handler:', val);
    });
    w.trigger('on_update', 'data');
    // logs: "Default handler: data"
    // logs: "External handler: data"


Bind from Options
~~~~~~~~~~~~~~~~~

Shortcut for subscribing to events from a constructor options object:

.. code-block:: js

    class Overlay extends Events {
        constructor(opts) {
            super();
            this.bind_from_options(['on_open', 'on_close'], opts);
        }
    }

    let ol = new Overlay({
        on_open: function(inst) { console.log('opened'); },
        on_close: function(inst) { console.log('closed'); }
    });
    ol.trigger('on_open');  // logs: "opened"


Event Suppression
~~~~~~~~~~~~~~~~~

Batch operations without triggering events, then fire a single summary event:

.. code-block:: js

    class DataStore extends Events {
        reload(data) {
            this.suppress_events(() => {
                this.delete_all();      // no events fired
                this._data = data;
                this.create_all();      // no events fired
            });
            this.trigger('data_changed', data);  // single event after batch
        }
    }

During ``suppress_events(fn)``, all calls to ``trigger()`` are no-ops.


Pitfalls
~~~~~~~~

- **Subscriber arguments differ from default handlers.** Subscribers receive
  ``(instance, ...args)`` — the emitting object is always the first argument.
  Default method handlers on the instance receive only ``(...args)``.

- **``suppress_events()`` is synchronous.** If the callback throws, events
  remain suppressed. The implementation resets the flag after the function
  returns.

- **``trigger(event, ...args)``** passes all extra arguments to subscribers.
  There is no event object — all data must be passed as explicit arguments.


API
---

.. js:autoclass:: Events
    :members:
        on,
        off,
        trigger,
        suppress_events,
        bind_from_options
