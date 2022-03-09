KeyState
========

Overview
--------

``KeyState`` is an event dispatcher for implementing actions depending on
typical keyboard control keys.

It listens to window DOM ``keydown`` and ``keyup`` events.

It holds the state of ``ctrl``, ``shift``, ``alt``, ``enter``, ``esc`` and
``delete`` keys as attributes with boolean values. ``true`` means pressed,
``false`` released.

The events triggered by this dispatcher are ``keydown`` and ``keyup``.

An example reacting to `[ctlr]+[alt]+[enter]`:

.. code-block:: js

    import {KeyState} from 'keystate';

    function ctrl_alt_enter_action(inst, evt) {
        // ``evt`` is the original DOM key event.
        if (inst.ctrl && inst.alt && inst.enter) {
            console.log('`[ctlr]+[alt]+[enter]` detected!');
        }
    }

    let key_state = new KeyState();
    key_state.on('keydown', ctrl_alt_enter_action);


API
---

.. js:autoclass:: KeyState
    :members: unload
