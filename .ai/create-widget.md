# Creating Custom Widgets

This guide explains how to create custom widgets using treibstoff's widget system.

## Context

Treibstoff provides a widget hierarchy based on `Widget` → `HTMLWidget` → `SVGContext`.
Widgets support parent/child relationships, ancestor lookup via `acquire()`, and
integrate with the property binding and motion tracking systems.

## Key API

| Class | Purpose |
|-------|---------|
| `ts.Widget` | Base widget with parent/child hierarchy and `acquire()` |
| `ts.HTMLWidget` | Widget wrapping a DOM element with CSS properties (x, y, width, height) |
| `ts.SVGContext` | Widget wrapping an SVG element with SVG helper methods |
| `ts.Property` | Observable property — triggers `on_name(val)` on change |
| `ts.compile_template` | Parse HTML template and wire DOM references onto widget |

## Pattern: Widget Lifecycle

The standard lifecycle is: **constructor → compile() → bind() → destroy()**.

```javascript
import ts from 'treibstoff';

class MyWidget extends ts.Widget {
    constructor(opts) {
        // 1. Establish hierarchy
        super({parent: opts.parent});

        // 2. Acquire context from ancestors (e.g. SVGContext)
        this.ctx = this.acquire(ts.SVGContext);

        // 3. Create reactive properties
        new ts.DataProperty(this, 'x', {val: opts.data.x});
        new ts.Property(this, 'selected', false);

        // 4. Build DOM/SVG
        this.compile();

        // 5. Attach event listeners
        this.bind();
    }

    compile() {
        this.elem = this.ctx.svg_elem('g', {}, this.ctx.elem);
        this.bg = this.ctx.svg_elem('rect', {
            x: 0, y: 0, width: 100, height: 50, fill: '#eee'
        }, this.elem);
    }

    bind() {
        // set_scope comes from Motion (inherited by Widget)
        this.set_scope(this.elem, this.ctx.elem);
    }

    // Auto-called when 'x' property changes
    on_x(val) {
        this.ctx.svg_attrs(this.elem, {
            transform: `translate(${val} 0)`
        });
    }

    // Auto-called when 'selected' property changes
    on_selected(val) {
        this.ctx.svg_attrs(this.bg, {
            fill: val ? '#cdf' : '#eee'
        });
    }

    destroy() {
        this.elem.remove();
    }
}
```

## Complete Example: HTML Widget with Template

```javascript
import ts from 'treibstoff';

class Panel extends ts.HTMLWidget {
    constructor(opts) {
        super({
            parent: opts.parent,
            elem: opts.elem       // jQuery wrapped DOM element
        });

        // Reactive properties bound to CSS
        new ts.CSSProperty(this, 'opacity', {val: 1});

        // Compile inner template
        ts.compile_template(this, `
            <div class="panel-header" t-elem="header">
                <span t-elem="title_elem" class="title"></span>
                <button t-prop="close_btn" t-bind-click="on_close_click">X</button>
            </div>
            <div class="panel-body" t-elem="body"></div>
        `, opts.elem);

        // After compile_template:
        // this.header  → DOM reference
        // this.title_elem → DOM reference
        // this.body    → DOM reference
        // this.close_btn → ButtonProperty
    }

    on_close_click() {
        this.opacity = 0;
        this.trigger('on_close');
    }
}

// Usage:
let panel = new Panel({
    parent: app,
    elem: $('#my-panel')
});
panel.on('on_close', function(inst) {
    console.log('Panel closed');
});
```

## Complete Example: SVG Widget with Drag

```javascript
import ts from 'treibstoff';

class DraggableNode extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);

        new ts.Property(this, 'x', opts.x || 0);
        new ts.Property(this, 'y', opts.y || 0);

        this.compile();
        this.bind();
    }

    compile() {
        this.elem = this.ctx.svg_elem('g', {}, this.ctx.elem);
        this.ctx.svg_elem('rect', {
            width: 80, height: 40, rx: 4, fill: '#4a90d9'
        }, this.elem);
    }

    bind() {
        // mousedown on element, mousemove within SVG context
        this.set_scope(this.elem, this.ctx.elem);
    }

    // Motion handlers (inherited from Widget → Motion)
    down(evt) {
        this._start_x = this.x;
        this._start_y = this.y;
    }

    move(evt) {
        let dx = evt.pageX - evt.prev_pos.x;
        let dy = evt.pageY - evt.prev_pos.y;
        this.x = this._start_x + dx;
        this.y = this._start_y + dy;
    }

    on_x(val) {
        this._update_position();
    }

    on_y(val) {
        this._update_position();
    }

    _update_position() {
        this.ctx.svg_attrs(this.elem, {
            transform: `translate(${this.x} ${this.y})`
        });
    }
}
```

## Pattern: acquire() for Context Lookup

`acquire(ClassName)` traverses the widget's ancestors and returns the first
instance of the given class. This is the standard way to access shared context.

```javascript
class ToolbarButton extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        // Find the nearest SVGContext ancestor
        this.ctx = this.acquire(ts.SVGContext);
        // Find a custom application-level ancestor
        this.app = this.acquire(Application);
    }
}
```

## Pattern: Adding/Removing Children

```javascript
let parent = new ts.Widget({parent: null});
let child = new ts.Widget({parent: null});

parent.add_widget(child);
// child.parent === parent
// parent.children includes child

parent.remove_widget(child);
// child.parent === null
```

## Pitfalls

1. **Always pass `{parent: ...}` to the Widget constructor.** The parent can be
   `null` for root widgets.

2. **Call `super(opts)` before accessing `this`.** The parent property is set up
   in the Widget constructor.

3. **`acquire()` returns `null` if no ancestor matches.** Always check the
   result if the context might not exist.

4. **`set_scope()` cannot be called during a motion sequence.** It throws if
   called while mousedown is active.

5. **HTMLWidget expects a jQuery-wrapped element** in `opts.elem`.

6. **SVGContext creates its own `<svg>` element** from `opts.name`. The parent
   widget must have an `elem` property (jQuery-wrapped) for the SVG to attach to.

7. **Widget extends Motion**, so every widget can track mouse events via
   `set_scope()`, `down()`, `move()`, `up()` — even if you don't need drag.
