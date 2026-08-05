# Motion Tracking (Drag, Resize, Select)

This guide explains how to implement drag, resize, and selection interactions
using treibstoff's `Motion` class.

## Context

The `Motion` class tracks mouse interactions in three phases: `down` (mousedown),
`move` (mousemove), and `up` (mouseup). It separates the "down scope" (where
mousedown is detected) from the "move scope" (where mousemove is tracked),
enabling flexible interaction patterns like grab handles, resize corners, and
rubber-band selection.

`Widget` extends `Motion`, so every widget can use motion tracking without
additional setup.

## Key API

| Member | Description |
|--------|-------------|
| `set_scope(down, move)` | Set DOM scopes for motion tracking |
| `reset_state()` | Reset internal motion state |
| `trigger('down', evt)` | Fired on mousedown |
| `trigger('move', evt)` | Fired on mousemove (evt has `prev_pos` and `motion`) |
| `trigger('up', evt)` | Fired on mouseup (evt has `motion` flag) |

## Motion Lifecycle

```
mousedown on down_scope
  → _mousedown: stores initial position, binds mousemove on move_scope
  → triggers 'down' event

mousemove on move_scope (repeated)
  → _mousemove: sets evt.prev_pos and evt.motion
  → triggers 'move' event
  → updates prev_pos

mouseup on document
  → _mouseup: unbinds mousemove, sets evt.motion flag
  → triggers 'up' event
  → reset_state()
```

**`evt.motion`** is `false` if the mouse didn't actually move (just a click),
`true` if it did. Use this to distinguish clicks from drags.

**`evt.prev_pos`** contains `{x, y}` from the previous move event (or the
mousedown position for the first move). Use it to calculate deltas.

## Pattern 1: Simple Drag

```javascript
import ts from 'treibstoff';

class DraggableBox extends ts.Motion {
    constructor(elem) {
        super();
        this._elem = elem;
        this._offset = {x: 0, y: 0};
        // mousedown and mousemove on the same element
        this.set_scope(elem, elem);
    }

    down(evt) {
        this._offset = {
            x: evt.pageX - parseInt(this._elem.style.left || 0),
            y: evt.pageY - parseInt(this._elem.style.top || 0)
        };
    }

    move(evt) {
        this._elem.style.left = (evt.pageX - this._offset.x) + 'px';
        this._elem.style.top = (evt.pageY - this._offset.y) + 'px';
    }

    up(evt) {
        if (evt.motion) {
            console.log('Dragged to:', this._elem.style.left, this._elem.style.top);
        } else {
            console.log('Clicked (no drag)');
        }
    }
}
```

## Pattern 2: Resize Handle

Use a narrow down scope (the grab handle) and a wider move scope (the document)
so the mouse can move freely during resize.

```javascript
class Resizer extends ts.Motion {
    constructor(handle, target) {
        super();
        this._handle = handle;
        this._target = target;
        this._initial_w = 0;
        this._initial_h = 0;
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
            console.log('Resized to:', this._target.style.width, this._target.style.height);
        }
    }
}
```

## Pattern 3: Rubber-Band Selection

Down on the background element, move within a container scope.

```javascript
class BoxSelect extends ts.Motion {
    constructor(container) {
        super();
        this._container = container;
        this._rect = null;
        // mousedown on container, mousemove within container
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
            // Calculate selection area and find items within
            console.log('Selection from', this._start, 'to', {x: evt.pageX, y: evt.pageY});
        }
    }
}
```

## Pattern 4: SVG Widget Drag

When used inside a Widget hierarchy with SVGContext:

```javascript
class DraggableNode extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);

        new ts.Property(this, 'x', opts.x || 0);
        new ts.Property(this, 'y', opts.y || 0);

        this.elem = this.ctx.svg_elem('g', {}, this.ctx.elem);
        this.ctx.svg_elem('rect', {
            width: 80, height: 40, fill: '#4a90d9'
        }, this.elem);

        // mousedown on this element, mousemove within SVG viewport
        this.set_scope(this.elem, this.ctx.elem);
    }

    down(evt) {
        this._drag_start = {x: evt.pageX, y: evt.pageY};
        this._pos_start = {x: this.x, y: this.y};
    }

    move(evt) {
        let dx = evt.pageX - this._drag_start.x;
        let dy = evt.pageY - this._drag_start.y;
        this.x = this._pos_start.x + dx;
        this.y = this._pos_start.y + dy;
    }

    on_x(val) { this._update_transform(); }
    on_y(val) { this._update_transform(); }

    _update_transform() {
        this.ctx.svg_attrs(this.elem, {
            transform: `translate(${this.x} ${this.y})`
        });
    }
}
```

## Pattern 5: Using Motion Events Instead of Methods

Instead of overriding `down/move/up` methods, you can subscribe to events:

```javascript
let motion = new ts.Motion();
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
```

## Scope Variants

| Down Scope | Move Scope | Use Case |
|------------|------------|----------|
| `elem` | `elem` | Simple drag within the element |
| `handle` | `document` | Resize via grab handle (wide movement range) |
| `elem` | `container` | Drag within a bounded area (e.g. SVG viewport) |
| `background` | `background` | Rubber-band selection on canvas |

## Complete Example: Pan and Zoom

```javascript
class Pane extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);
        this.elem = this.ctx.svg_elem('g', {}, this.ctx.elem);

        // Pan: drag on SVG background
        this.set_scope(this.ctx.elem, this.ctx.elem);
    }

    down(evt) {
        this._pan_start = {
            x: this.ctx.xyz.x,
            y: this.ctx.xyz.y
        };
    }

    move(evt) {
        let dx = evt.pageX - evt.prev_pos.x;
        let dy = evt.pageY - evt.prev_pos.y;
        this.ctx.xyz.x = this._pan_start.x + dx;
        this.ctx.xyz.y = this._pan_start.y + dy;
        this._apply_transform();
    }

    _apply_transform() {
        let xyz = this.ctx.xyz;
        this.ctx.svg_attrs(this.elem, {
            transform: `translate(${xyz.x} ${xyz.y}) scale(${xyz.z})`
        });
    }
}
```

## Pitfalls

1. **`set_scope()` cannot be called during a motion sequence.** It throws
   `'Attempt to set motion scope while handling'` if mousedown is active.

2. **`set_scope()` unbinds the previous scope** automatically. Calling it
   again re-binds to the new elements.

3. **`mouseup` is always bound to `document`**, not to the move scope. This
   ensures the up event is captured even if the mouse leaves the move scope.

4. **`evt.stopPropagation()` is called** in all three handlers. This prevents
   parent elements from receiving the same mouse events.

5. **If `move` scope is `null`**, only `down` and `up` are tracked (no
   `move` events). Useful for click-only detection with motion awareness.

6. **`evt.prev_pos`** is only available in `move` events. In `down`, use
   `evt.pageX/pageY` directly. In `up`, `evt.motion` tells you if movement
   occurred.

7. **Widget extends Motion**, so `set_scope()`, `down()`, `move()`, `up()`
   are available on all widgets without explicit inheritance.
