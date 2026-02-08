Motion
======

Overview
--------

``Motion`` provides mouse motion tracking for drag, resize and selection
interactions. It extends ``Events`` and fires ``down``, ``move`` and ``up``
events during a mouse interaction sequence.

The tracking is configured with two scopes: a *down scope* where ``mousedown``
is listened for, and an optional *move scope* where ``mousemove`` is tracked
during the interaction.

.. code-block:: js

    import {Motion} from 'motion';

    let motion = new Motion();
    let handle = document.getElementById('drag-handle');
    let canvas = document.getElementById('canvas');

    // Track mousedown on handle, mousemove on canvas
    motion.set_scope(handle, canvas);

    motion.on('down', function(inst, evt) {
        console.log('Drag started at', evt.pageX, evt.pageY);
    });

    motion.on('move', function(inst, evt) {
        let dx = evt.pageX - evt.prev_pos.x;
        let dy = evt.pageY - evt.prev_pos.y;
        console.log('Moved by', dx, dy);
    });

    motion.on('up', function(inst, evt) {
        if (evt.motion) {
            console.log('Drag ended');
        } else {
            console.log('Click (no motion)');
        }
    });

The ``move`` event augments the DOM event with ``prev_pos`` (previous position)
and ``motion`` (boolean flag). The ``up`` event includes the ``motion`` flag
to distinguish clicks from drags.

API
---

.. js:autoclass:: Motion
    :members:
        set_scope,
        reset_state
