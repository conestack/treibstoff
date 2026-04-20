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

``Widget`` extends ``Motion``, so every widget can use motion tracking without
additional setup.


Motion Lifecycle
~~~~~~~~~~~~~~~~

::

    mousedown on down_scope
      → stores initial position, binds mousemove on move_scope
      → triggers 'down' event

    mousemove on move_scope (repeated)
      → sets evt.prev_pos and evt.motion
      → triggers 'move' event
      → updates prev_pos

    mouseup on document
      → unbinds mousemove, sets evt.motion flag
      → triggers 'up' event
      → reset_state()


Scope Variants
~~~~~~~~~~~~~~

+-----------------+-----------------+----------------------------------------------+
| Down Scope      | Move Scope      | Use Case                                     |
+=================+=================+==============================================+
| ``elem``        | ``elem``        | Simple drag within the element               |
+-----------------+-----------------+----------------------------------------------+
| ``handle``      | ``document``    | Resize via grab handle (wide movement range) |
+-----------------+-----------------+----------------------------------------------+
| ``elem``        | ``container``   | Drag within a bounded area (e.g. SVG)        |
+-----------------+-----------------+----------------------------------------------+
| ``background``  | ``background``  | Rubber-band selection on canvas              |
+-----------------+-----------------+----------------------------------------------+


Resize Handle
~~~~~~~~~~~~~

Use a narrow down scope (the grab handle) and a wider move scope so the mouse
can move freely during resize:

.. code-block:: js

    import {Motion} from 'motion';

    class Resizer extends Motion {
        constructor(handle, target) {
            super();
            this._handle = handle;
            this._target = target;
            // mousedown on the handle, mousemove on the entire document
            this.set_scope(handle, document);
        }

        down(evt) {
            this._initial_w = this._target.offsetWidth;
            this._initial_h = this._target.offsetHeight;
            this._start_x = evt.pageX;
            this._start_y = evt.pageY;
        }

        move(evt) {
            let dx = evt.pageX - this._start_x;
            let dy = evt.pageY - this._start_y;
            this._target.style.width = Math.max(50, this._initial_w + dx) + 'px';
            this._target.style.height = Math.max(50, this._initial_h + dy) + 'px';
        }

        up(evt) {
            if (evt.motion) {
                console.log('Resized');
            }
        }
    }


Rubber-Band Selection
~~~~~~~~~~~~~~~~~~~~~

Down on the background element, move within a container scope:

.. code-block:: js

    import {Motion} from 'motion';

    class BoxSelect extends Motion {
        constructor(container) {
            super();
            this._container = container;
            this._rect = null;
            this.set_scope(container, container);
        }

        down(evt) {
            this._start = {x: evt.pageX, y: evt.pageY};
            this._rect = document.createElement('div');
            this._rect.className = 'selection-rect';
            this._container.appendChild(this._rect);
        }

        move(evt) {
            let x = Math.min(this._start.x, evt.pageX);
            let y = Math.min(this._start.y, evt.pageY);
            let w = Math.abs(evt.pageX - this._start.x);
            let h = Math.abs(evt.pageY - this._start.y);
            Object.assign(this._rect.style, {
                left: x + 'px', top: y + 'px',
                width: w + 'px', height: h + 'px'
            });
        }

        up(evt) {
            if (this._rect) {
                this._container.removeChild(this._rect);
                this._rect = null;
            }
            if (evt.motion) {
                console.log('Selection complete');
            }
        }
    }


Using Events Instead of Methods
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Instead of overriding ``down``/``move``/``up`` methods, you can subscribe to
events:

.. code-block:: js

    let motion = new Motion();
    motion.set_scope(downElem, moveElem);

    motion.on('down', function(inst, evt) {
        console.log('mousedown at', evt.pageX, evt.pageY);
    });

    motion.on('move', function(inst, evt) {
        let dx = evt.pageX - evt.prev_pos.x;
        let dy = evt.pageY - evt.prev_pos.y;
        console.log('delta:', dx, dy);
    });

    motion.on('up', function(inst, evt) {
        console.log('mouseup, was drag:', evt.motion);
    });


Pitfalls
~~~~~~~~

- **``set_scope()`` cannot be called during a motion sequence.** It throws
  ``'Attempt to set motion scope while handling'`` if mousedown is active.

- **``set_scope()`` unbinds the previous scope** automatically. Calling it
  again re-binds to the new elements.

- **``mouseup`` is always bound to ``document``**, not to the move scope. This
  ensures the up event is captured even if the mouse leaves the move scope.

- **``evt.stopPropagation()`` is called** in all three handlers. This prevents
  parent elements from receiving the same mouse events.

- **If move scope is ``null``**, only ``down`` and ``up`` are tracked (no
  ``move`` events). Useful for click-only detection with motion awareness.

- **``evt.prev_pos``** is only available in ``move`` events. In ``down``, use
  ``evt.pageX/pageY`` directly. In ``up``, ``evt.motion`` tells you if
  movement occurred.


API
---

.. js:autoclass:: Motion
    :members:
        set_scope,
        reset_state
