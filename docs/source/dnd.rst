DnD
===

Overview
--------

``DnD`` provides native HTML5 Drag and Drop event tracking on configurable DOM
scopes. It extends ``Events`` and fires ``dragstart``, ``dragover``,
``dragleave``, ``drop`` and ``dragend`` events during a drag-and-drop
interaction.

The tracking is configured with two scopes: a *drag scope* where
``dragstart``/``dragend`` are listened for, and a *drop scope* where
``dragover``/``dragleave``/``drop`` are tracked. This is analogous to
``Motion``'s *down scope* and *move scope*.

.. code-block:: js

    import {DnD} from 'dnd';

    let dnd = new DnD();
    let item = $('#sortable-item');

    dnd.set_scope(item, item);

    dnd.on('dragstart', function(inst, evt) {
        item.addClass('dragging');
    });

    dnd.on('dragover', function(inst, evt) {
        item.addClass('drag-over');
    });

    dnd.on('dragleave', function(inst, evt) {
        item.removeClass('drag-over');
    });

    dnd.on('drop', function(inst, evt) {
        item.removeClass('drag-over');
        console.log('Dropped! Source:', evt.source);
    });

    dnd.on('dragend', function(inst, evt) {
        item.removeClass('dragging');
    });

The ``dragover`` and ``drop`` events augment the DOM event with a ``source``
property referencing the ``DnD`` instance that initiated the drag. This enables
cross-instance coordination — when item A is dragged onto item B, B's drop
handler knows which instance started the drag.


DnD Lifecycle
~~~~~~~~~~~~~

::

    dragstart on drag_scope
      → sets DnD._drag_source = this
      → calls dataTransfer.setData (Firefox compatibility)
      → triggers 'dragstart' event

    dragover on drop_scope (repeated)
      → calls preventDefault() to allow drop
      → sets evt.source = DnD._drag_source
      → triggers 'dragover' event

    dragleave on drop_scope
      → triggers 'dragleave' event

    drop on drop_scope
      → calls preventDefault()
      → sets evt.source = DnD._drag_source
      → triggers 'drop' event

    dragend on drag_scope
      → clears DnD._drag_source = null
      → triggers 'dragend' event


Comparison with Motion
~~~~~~~~~~~~~~~~~~~~~~

+----------------------------+----------------------------+-------------------------------+
| Motion                     | DnD                        | Purpose                       |
+============================+============================+===============================+
| ``set_scope(down, move)``  | ``set_scope(drag, drop)``  | Bind scopes                   |
+----------------------------+----------------------------+-------------------------------+
| ``reset_state()``          | ``reset_scope()``          | Cleanup                       |
+----------------------------+----------------------------+-------------------------------+
| ``trigger('down', evt)``   | ``trigger('dragstart')``   | Interaction begins            |
+----------------------------+----------------------------+-------------------------------+
| ``trigger('move', evt)``   | ``trigger('dragover')``    | Interaction continues         |
+----------------------------+----------------------------+-------------------------------+
| ``trigger('up', evt)``     | ``trigger('drop', evt)``   | Interaction ends              |
+----------------------------+----------------------------+-------------------------------+
| ``evt.motion``             | ``evt.source``             | Event annotation              |
+----------------------------+----------------------------+-------------------------------+
| Mouse events               | Native HTML5 DnD API       | Underlying mechanism          |
+----------------------------+----------------------------+-------------------------------+


Scope Variants
~~~~~~~~~~~~~~

+-----------------+-----------------+----------------------------------------------+
| Drag Scope      | Drop Scope      | Use Case                                     |
+=================+=================+==============================================+
| ``elem``        | ``elem``        | Sortable item (drag and drop on same elem)   |
+-----------------+-----------------+----------------------------------------------+
| ``header``      | ``card``        | Group card with drag handle                  |
+-----------------+-----------------+----------------------------------------------+
| ``elem``        | ``null``        | Drag-only source (no drop target)            |
+-----------------+-----------------+----------------------------------------------+
| ``null``        | ``elem``        | Drop-only target (not draggable itself)      |
+-----------------+-----------------+----------------------------------------------+


Separate Drag Handle
~~~~~~~~~~~~~~~~~~~~

Use different elements for drag and drop scopes, e.g. a header as drag handle
and the entire card as drop zone:

.. code-block:: js

    import {DnD} from 'dnd';

    let header = group.find('.card-header');
    let card = group.find('.card');

    let dnd = new DnD();
    dnd.set_scope(header, card);

    dnd.on('dragstart', function(inst, evt) {
        evt.originalEvent.dataTransfer.effectAllowed = 'move';
        card.addClass('dragging');
    });

    dnd.on('drop', function(inst, evt) {
        card.removeClass('drag-over');
        handle_drop(evt.source);
    });

    dnd.on('dragend', function(inst, evt) {
        card.removeClass('dragging');
    });


Cross-Instance Coordination
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each widget creates its own ``DnD`` instance. When item A is dragged onto
item B, B's drop handler receives A's ``DnD`` instance via ``evt.source``.

The parent/orchestrator maintains a ``Map`` to resolve which widget a ``DnD``
instance belongs to:

.. code-block:: js

    import {DnD} from 'dnd';
    import {Events} from 'events';

    class SortableItem extends Events {
        constructor(elem) {
            super();
            this.elem = elem;
            this.dnd = new DnD();
            this.dnd.set_scope(elem, elem);

            this.dnd.on('drop', (inst, evt) => {
                this.elem.removeClass('drag-over');
                this.trigger('on_drop_received', evt.source);
            });
        }

        destroy() {
            this.dnd.reset_scope();
        }
    }

    class SortableList extends Events {
        constructor() {
            super();
            this._dnd_map = new Map();
        }

        add_item(data, container) {
            let item = new SortableItem(container);
            this._dnd_map.set(item.dnd, {id: data.id});

            item.on('on_drop_received', (inst, source_dnd) => {
                let drag_data = this._dnd_map.get(source_dnd);
                if (drag_data) {
                    this.reorder(drag_data, data);
                }
            });
        }
    }


Using Default Handler Methods
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Instead of subscribing to events, you can define methods directly on the
instance:

.. code-block:: js

    let dnd = new DnD();
    dnd.dragstart = function(evt) {
        console.log('drag started');
    };
    dnd.drop = function(evt) {
        console.log('dropped, source:', evt.source);
    };
    dnd.set_scope(drag_elem, drop_elem);


Pitfalls
~~~~~~~~

- **``set_scope()`` resets the previous scope** automatically. Calling it again
  re-binds to the new elements.

- **``reset_scope()`` is safe to call** without a prior ``set_scope()``.

- **Firefox requires ``dataTransfer.setData()``** in ``dragstart``. The ``DnD``
  class handles this automatically.

- **``preventDefault()`` is required** in ``dragover`` to allow drops. The
  ``DnD`` class calls it automatically on ``evt.originalEvent``.

- **``evt.source`` is only set on ``dragover`` and ``drop``**. It is not
  available on ``dragstart``, ``dragleave``, or ``dragend``.

- **``DnD._drag_source`` is cleared on ``dragend``**. Capture the source
  reference during ``drop`` if needed afterwards.

- **``reset_scope()`` removes the ``draggable`` attribute** from the drag
  element.


API
---

.. js:autoclass:: DnD
    :members:
        set_scope,
        reset_scope
