# Drag and Drop (Native HTML5 DnD)

This guide explains how to implement drag-and-drop interactions using
treibstoff's `DnD` class.

## Context

The `DnD` class wraps the native HTML5 Drag and Drop API into treibstoff's
event system. It is the DnD counterpart to `Motion` (which handles mouse
tracking). Where `Motion` uses `down/move/up` phases, `DnD` uses
`dragstart/dragover/dragleave/drop/dragend` phases.

Each draggable widget creates its own `DnD` instance. Cross-instance
coordination (knowing *what* is being dragged when a drop occurs) is handled
via the class-level `DnD._drag_source` reference.

## Key API

| Member | Description |
|--------|-------------|
| `set_scope(drag, drop)` | Bind drag events on `drag` element, drop events on `drop` element |
| `reset_scope()` | Unbind all event handlers and clear scopes |
| `DnD._drag_source` | Class-level reference to the DnD instance currently being dragged |
| `trigger('dragstart', evt)` | Fired when drag begins |
| `trigger('dragover', evt)` | Fired when dragged over drop target (`evt.source` = drag source) |
| `trigger('dragleave', evt)` | Fired when drag leaves drop target |
| `trigger('drop', evt)` | Fired on drop (`evt.source` = drag source) |
| `trigger('dragend', evt)` | Fired when drag ends (cleanup) |

## DnD Lifecycle

```
User starts dragging element
  → _dragstart: sets DnD._drag_source = this, calls dataTransfer.setData
  → triggers 'dragstart' event

Dragged over drop target (repeated)
  → _dragover: calls preventDefault() (required to allow drop)
  → sets evt.source = DnD._drag_source
  → triggers 'dragover' event

Drag leaves drop target
  → triggers 'dragleave' event

Drop on target
  → _drop: calls preventDefault()
  → sets evt.source = DnD._drag_source
  → triggers 'drop' event

Drag ends (on the dragged element)
  → _dragend: clears DnD._drag_source = null
  → triggers 'dragend' event
```

**`evt.source`** is set on `dragover` and `drop` events. It references the
`DnD` instance that initiated the drag, enabling cross-instance communication.

## Comparison with Motion

| Motion | DnD | Purpose |
|--------|-----|---------|
| `set_scope(down, move)` | `set_scope(drag, drop)` | Bind scopes |
| `reset_state()` | `reset_scope()` | Cleanup |
| `trigger('down', evt)` | `trigger('dragstart', evt)` | Interaction begins |
| `trigger('move', evt)` | `trigger('dragover', evt)` | Interaction continues |
| `trigger('up', evt)` | `trigger('drop', evt)` | Interaction ends |
| `evt.motion` (was it a drag?) | `evt.source` (who is being dragged?) | Event annotation |
| Mouse-based, custom tracking | Native HTML5 DnD API | Underlying mechanism |

## Pattern 1: Single Element (Drag and Drop on Same Element)

```javascript
import ts from 'treibstoff';

let elem = $('#my-item');
let dnd = new ts.DnD();
dnd.set_scope(elem, elem);

dnd.on('dragstart', function(inst, evt) {
    evt.originalEvent.dataTransfer.effectAllowed = 'move';
    elem.addClass('dragging');
});

dnd.on('dragover', function(inst, evt) {
    elem.addClass('drag-over');
});

dnd.on('dragleave', function(inst, evt) {
    elem.removeClass('drag-over');
});

dnd.on('drop', function(inst, evt) {
    elem.removeClass('drag-over');
    console.log('Dropped! Source:', evt.source);
});

dnd.on('dragend', function(inst, evt) {
    elem.removeClass('dragging');
});
```

## Pattern 2: Separate Drag Handle and Drop Zone

Use different elements for drag and drop scopes, e.g. a header as drag
handle and the entire card as drop zone.

```javascript
let header = group.find('.card-header');
let card = group.find('.card');

let dnd = new ts.DnD();
dnd.set_scope(header, card);

dnd.on('dragstart', function(inst, evt) {
    evt.originalEvent.dataTransfer.effectAllowed = 'move';
    card.addClass('dragging');
});

dnd.on('drop', function(inst, evt) {
    card.removeClass('drag-over');
    // evt.source is the DnD instance of whatever was dragged
    handle_drop(evt.source);
});

dnd.on('dragend', function(inst, evt) {
    card.removeClass('dragging');
});
```

## Pattern 3: Cross-Instance Drag and Drop

Each widget has its own DnD instance. When item A is dragged onto item B,
B's drop handler receives A's DnD instance via `evt.source`.

```javascript
class SortableItem extends ts.Events {
    constructor(elem) {
        super();
        this.elem = elem;
        this.dnd = new ts.DnD();
        this.dnd.set_scope(elem, elem);

        this.dnd.on('dragstart', (inst, evt) => {
            evt.originalEvent.dataTransfer.effectAllowed = 'move';
            this.elem.addClass('dragging');
        });

        this.dnd.on('dragover', (inst, evt) => {
            this.elem.addClass('drag-over');
        });

        this.dnd.on('dragleave', (inst, evt) => {
            this.elem.removeClass('drag-over');
        });

        this.dnd.on('drop', (inst, evt) => {
            this.elem.removeClass('drag-over');
            // evt.source is the DnD instance of the dragged item
            // Use a map to resolve DnD instance → widget data
            this.trigger('on_drop_received', evt.source);
        });

        this.dnd.on('dragend', (inst, evt) => {
            this.elem.removeClass('dragging');
        });
    }

    destroy() {
        this.dnd.reset_scope();
    }
}
```

The parent/orchestrator maintains a `Map<DnD, data>` to resolve which widget
a DnD instance belongs to:

```javascript
class SortableList extends ts.Events {
    constructor() {
        super();
        this._dnd_map = new Map();
        this.items = [];
    }

    add_item(data, container) {
        let item = new SortableItem(/* ... */);
        this._dnd_map.set(item.dnd, {id: data.id, type: 'item'});

        item.on('on_drop_received', (inst, source_dnd) => {
            let drag_data = this._dnd_map.get(source_dnd);
            if (drag_data) {
                this.handle_reorder(drag_data, data);
            }
        });

        this.items.push(item);
    }
}
```

## Pattern 4: Default Handler Methods

Like Motion's `down()`/`move()`/`up()` default handlers, DnD supports
instance methods as default handlers:

```javascript
let dnd = new ts.DnD();
dnd.dragstart = function(evt) {
    console.log('drag started');
};
dnd.drop = function(evt) {
    console.log('dropped, source:', evt.source);
};
dnd.set_scope(drag_elem, drop_elem);
```

## Scope Variants

| Drag Scope | Drop Scope | Use Case |
|------------|------------|----------|
| `elem` | `elem` | Sortable item (drag and drop on same element) |
| `header` | `card` | Group card with drag handle |
| `elem` | `null` | Drag-only (source element, no drop target) |
| `null` | `elem` | Drop-only (target element, not draggable itself) |

## Event Flow: Item A Dropped on Item B

```
User drags Item A onto Item B:
  → Item A: DnD._dragstart()
    → DnD._drag_source = item_a.dnd
    → item_a.dnd triggers 'dragstart'
    → Item A adds .dragging class

  → Item B: DnD._dragover()
    → evt.source = item_a.dnd (from DnD._drag_source)
    → item_b.dnd triggers 'dragover'
    → Item B adds .drag-over class

  → Item B: DnD._drop()
    → evt.source = item_a.dnd
    → item_b.dnd triggers 'drop'
    → Item B handler: trigger('on_drop_received', evt.source)
    → Parent resolves source via _dnd_map, executes reorder

  → Item A: DnD._dragend()
    → DnD._drag_source = null
    → item_a.dnd triggers 'dragend'
    → Item A removes .dragging class
```

## Pitfalls

1. **`set_scope()` resets the previous scope** automatically. Calling it again
   re-binds to the new elements (same behavior as `Motion.set_scope()`).

2. **`reset_scope()` is safe to call** without a prior `set_scope()`. No error
   is thrown.

3. **Firefox requires `dataTransfer.setData()`** in the `dragstart` handler.
   The DnD class handles this automatically with an empty string.

4. **`preventDefault()` is required** in `dragover` to allow drops. The DnD
   class calls it automatically on `evt.originalEvent`.

5. **`evt.source` is only set on `dragover` and `drop` events.** It is not
   available on `dragstart`, `dragleave`, or `dragend`.

6. **`DnD._drag_source` is cleared on `dragend`.** If you need the source
   reference after dragend, capture it during the `drop` event.

7. **`set_scope(drag, null)` sets up drag-only** (no drop target). Useful for
   source-only elements. Similarly, `set_scope(null, drop)` sets up a
   drop-only target.

8. **`reset_scope()` removes the `draggable` attribute** from the drag element.
   This is different from Motion where no DOM attributes are involved.
