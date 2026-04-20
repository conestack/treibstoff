# Property Binding System

This guide explains how to use treibstoff's reactive property binding system.

## Context

Treibstoff properties create getter/setter pairs on object instances via
`Object.defineProperty`. When a property value changes, the system automatically
triggers an `on_{name}` event, enabling reactive updates to the DOM, CSS, SVG
attributes, or any custom logic.

## Key API

| Class | Constructor | Auto-Syncs To |
|-------|------------|---------------|
| `Property` | `new ts.Property(inst, 'name', default)` | Nothing (plain reactive value) |
| `BoundProperty` | `new ts.BoundProperty(inst, 'name', opts)` | Base for bound properties |
| `CSSProperty` | `new ts.CSSProperty(inst, 'name', {tgt: 'css-prop'})` | CSS style on element |
| `AttrProperty` | `new ts.AttrProperty(inst, 'name', {ctx: elem, tgt: 'attr'})` | HTML attribute |
| `TextProperty` | `new ts.TextProperty(inst, 'name', {ctx: elem})` | Element textContent |
| `DataProperty` | `new ts.DataProperty(inst, 'name', {val: v})` | Plain data object (`inst.data`) |
| `InputProperty` | `new ts.InputProperty(inst, 'name', {ctx: inputElem})` | Input element value (two-way) |
| `SVGProperty` | `new ts.SVGProperty(inst, 'name', {ctx: svgElem, tgt: 'attr'})` | SVG attribute |
| `ButtonProperty` | `new ts.ButtonProperty(inst, 'name', {ctx: btnElem})` | Button text + click/down/up events |

## Pattern 1: Basic Property

```javascript
import ts from 'treibstoff';

class Counter extends ts.Events {
    constructor() {
        super();
        new ts.Property(this, 'count', 0);
    }

    on_count(val) {
        console.log('Count changed to:', val);
    }
}

let counter = new Counter();
counter.count = 5;   // logs: "Count changed to: 5"
counter.count = 5;   // no log — value didn't change
counter.count = 10;  // logs: "Count changed to: 10"
```

**How it works:**
1. `new ts.Property(this, 'count', 0)` defines `get count()` and `set count()` on `this`
2. The setter checks if the value actually changed
3. If changed, it calls `this.trigger('on_count', val)` which:
   - Calls `this.on_count(val)` if the method exists
   - Notifies any external subscribers registered via `this.on('on_count', fn)`

## Pattern 2: CSS Property (DOM Style Binding)

```javascript
class Box extends ts.HTMLWidget {
    constructor(opts) {
        super({parent: opts.parent, elem: opts.elem});
        // Built-in: x, y, width, height are already CSSProperties

        // Custom CSS property
        new ts.CSSProperty(this, 'opacity', {val: 1});
        new ts.CSSProperty(this, 'bg_color', {tgt: 'background-color', val: '#fff'});
    }
}

let box = new Box({parent: null, elem: $('#my-box')});
box.opacity = 0.5;   // sets $(elem).css('opacity', 0.5)
box.bg_color = 'red'; // sets $(elem).css('background-color', 'red')
box.x = '100px';     // sets $(elem).css('left', '100px')
box.y = '50px';      // sets $(elem).css('top', '50px')
```

**Context element:** Defaults to `inst.elem`. Override with `{ctx: otherElem}`.

**Target name:** Defaults to the property name. Override with `{tgt: 'css-property-name'}`.

## Pattern 3: Attribute Property (HTML Attribute Binding)

```javascript
class Link extends ts.Events {
    constructor(elem) {
        super();
        this.elem = elem;
        new ts.AttrProperty(this, 'href', {val: '#'});
        new ts.AttrProperty(this, 'aria_label', {tgt: 'aria-label'});
    }
}

let link = new Link($('<a>'));
link.href = '/items/42';       // calls elem.attr('href', '/items/42')
link.aria_label = 'View item'; // calls elem.attr('aria-label', 'View item')
```

## Pattern 4: Text Property (textContent Binding)

```javascript
class Label extends ts.Events {
    constructor(elem) {
        super();
        this.elem = elem;
        new ts.TextProperty(this, 'text', {val: 'Hello'});
    }
}

let label = new Label($('<span>'));
label.text = 'World'; // calls elem.text('World')
```

## Pattern 5: Data Property (Object Sync)

Syncs the property value to a plain data object. Useful for serialization.

```javascript
class Node extends ts.Events {
    constructor(data) {
        super();
        this.data = data;
        new ts.DataProperty(this, 'x', {val: data.x});
        new ts.DataProperty(this, 'y', {val: data.y});
        new ts.DataProperty(this, 'label', {val: data.label});
    }

    on_x(val) {
        this.update_position();
    }

    on_y(val) {
        this.update_position();
    }

    toJSON() {
        // this.data.x, this.data.y, this.data.label are always in sync
        return this.data;
    }
}

let node = new Node({x: 10, y: 20, label: 'Start'});
node.x = 50;
console.log(node.data.x); // 50 — automatically synced
```

## Pattern 6: Input Property (Two-Way Binding)

Listens for `change` events on the input and updates the property. On set,
updates the input's value.

```javascript
class NameField extends ts.Events {
    constructor(inputElem) {
        super();
        new ts.InputProperty(this, 'name', {
            ctx: inputElem,
            val: 'Default'
        });
    }

    on_name(val) {
        console.log('Name is now:', val);
    }
}

let field = new NameField($('#name-input'));
field.name = 'Alice';  // updates input value to 'Alice'
// User types 'Bob' → on_name('Bob') is called
```

**With extraction/validation:**
```javascript
new ts.InputProperty(this, 'age', {
    ctx: inputElem,
    val: 0,
    extract: function(val) {
        let num = parseInt(val, 10);
        if (isNaN(num) || num < 0) {
            throw 'Age must be a positive number';
        }
        return num;
    },
    state_evt: 'on_age_state'  // optional custom state event name
});

// After extraction error:
// this._age_property.error === true
// this._age_property.msg === 'Age must be a positive number'
// 'on_age_state' event is triggered
```

## Pattern 7: SVG Property

```javascript
class Circle extends ts.Events {
    constructor(svgElem) {
        super();
        this.elem = svgElem;
        new ts.SVGProperty(this, 'cx', {val: 50});
        new ts.SVGProperty(this, 'cy', {val: 50});
        new ts.SVGProperty(this, 'r', {val: 25});
    }
}

let circle = new Circle(svgCircleElem);
circle.r = 40; // calls setAttributeNS(null, 'r', 40)
```

## Pattern 8: Button Property

```javascript
class Toolbar extends ts.Events {
    constructor(btnElem) {
        super();
        new ts.ButtonProperty(this, 'save', {
            ctx: btnElem,
            val: 'Save'
        });
    }

    on_save_click() {
        console.log('Save clicked');
    }

    on_save_down() {
        console.log('Mouse down on save');
    }

    on_save_up() {
        console.log('Mouse up on save');
    }
}
```

Setting the value updates the button text: `toolbar.save = 'Saving...'`.

## Pattern 9: Cascading Property Updates

Properties can trigger updates on other properties or child widgets.

```javascript
class ResizableNode extends ts.Events {
    constructor(data, children) {
        super();
        this.data = data;
        this.children = children;
        this.min_width = 80;

        new ts.DataProperty(this, 'w', {val: data.w});
    }

    on_w(val) {
        // Enforce minimum
        val = val < this.min_width ? this.min_width : val;

        // Cascade to child layout
        this.children.layout.width = val;

        // Update SVG representation
        this.ctx.svg_attrs(this.bg_elem, {width: val});

        // Update sibling
        this.children.resize_btn.update_position();
    }
}
```

## Pattern 10: BoundProperty Options

All bound properties (subclasses of `BoundProperty`) accept these options:

| Option | Default | Description |
|--------|---------|-------------|
| `ctx` | `inst[ctxa]` | Context element to bind to |
| `ctxa` | `'elem'` | Attribute name on instance to get context from |
| `tgt` | `name` | Target attribute/property name |
| `val` | `undefined` | Initial value |

```javascript
// Bind 'bg_color' property to CSS 'background-color' on a specific element
new ts.CSSProperty(this, 'bg_color', {
    ctx: this.header_elem,       // bind to specific element, not this.elem
    tgt: 'background-color',     // CSS property name differs from JS name
    val: '#f0f0f0'               // initial value
});
```

## Pitfalls

1. **The `on_name` handler is called via `trigger()`.** The instance must have
   a `trigger` method (i.e. extend `Events`) for auto-handlers to work. If not,
   the property still works as a getter/setter but doesn't fire events.

2. **Properties only trigger on actual value changes.** Setting the same value
   twice does not re-trigger the handler.

3. **BoundProperty context is lazily resolved.** If `ctx` is not passed in opts,
   it reads `inst[ctxa]` (default: `inst.elem`). If `inst.elem` doesn't exist
   yet at property creation time, the context is resolved on first access.

4. **InputProperty listens for `change` events**, not `input` events. The
   handler fires when the user leaves the field or presses Enter, not on
   every keystroke.

5. **DataProperty defaults to `inst.data`** as its context. Ensure `this.data`
   exists before creating DataProperty instances.

6. **Property names become getter/setter pairs** via `Object.defineProperty`.
   They cannot be deleted or redefined. Don't create two properties with the
   same name on the same instance.
