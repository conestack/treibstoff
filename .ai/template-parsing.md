# Template Parsing

This guide explains how to use treibstoff's template and parser system to
build DOM structures with automatic property and element binding.

## Context

Treibstoff's template system compiles HTML or SVG strings into DOM elements
while processing special `t-*` attributes. Elements are assigned to widget
properties, and input/button elements get reactive property bindings
automatically.

## Key API

| Class/Function | Purpose |
|----------------|---------|
| `ts.compile_template(inst, tmpl, container)` | Compile HTML template |
| `ts.compile_svg(inst, tmpl, container)` | Compile SVG template |
| `ts.extract_number(val)` | Parse string to number (throws if NaN) |
| `ts.Parser` | Base DOM walker |
| `ts.TemplateParser` | Processes `t-elem` attributes |
| `ts.HTMLParser` | Processes all `t-*` attributes for HTML |
| `ts.SVGParser` | Processes `t-elem` for SVG elements |

## Template Attributes

| Attribute | Applies To | Purpose |
|-----------|-----------|---------|
| `t-elem` | Any element | Assign element to `widget[name]` |
| `t-prop` | `<input>`, `<select>`, `<button>` | Create a bound property |
| `t-val` | With `t-prop` | Initial property value |
| `t-type` | With `t-prop` on `<input>` | Value extractor type (`"number"`) |
| `t-extract` | With `t-prop` on `<input>` | Custom extractor method name |
| `t-state-evt` | With `t-prop` on `<input>` | Custom state event name |
| `t-options` | `<select>` | JSON array of `[value, label]` pairs |
| `t-bind-click` | `<button>` | Widget method to call on click |
| `t-bind-down` | `<button>` | Widget method to call on mousedown |
| `t-bind-up` | `<button>` | Widget method to call on mouseup |

## Pattern 1: Element References

```javascript
import ts from 'treibstoff';

class Panel extends ts.Events {
    constructor(container) {
        super();
        ts.compile_template(this, `
            <div class="panel" t-elem="panel">
                <div class="header" t-elem="header">
                    <h3 t-elem="title">Title</h3>
                </div>
                <div class="body" t-elem="body"></div>
                <div class="footer" t-elem="footer"></div>
            </div>
        `, container);

        // After compilation:
        // this.panel  → jQuery wrapped <div class="panel">
        // this.header → jQuery wrapped <div class="header">
        // this.title  → jQuery wrapped <h3>
        // this.body   → jQuery wrapped <div class="body">
        // this.footer → jQuery wrapped <div class="footer">
    }
}
```

**Key:** The `t-elem` value becomes the property name on the instance.

## Pattern 2: Input Property Binding

```javascript
class SettingsWidget extends ts.Events {
    constructor(container) {
        super();
        ts.compile_template(this, `
            <div class="settings">
                <label>Name</label>
                <input t-elem="name_input" t-prop="name" t-val="Default">

                <label>Count</label>
                <input t-elem="count_input" t-prop="count"
                       t-type="number" t-val="10">
            </div>
        `, container);

        // After compilation:
        // this.name_input → jQuery wrapped <input> (from t-elem)
        // this.name → InputProperty bound to the input (from t-prop)
        //             initial value: "Default" (from t-val)
        // this.count → InputProperty with number extraction
        //              initial value: 10 (from t-val + t-type="number")
    }

    // Auto-called when user changes the name input
    on_name(val) {
        console.log('Name changed to:', val);
    }

    // Auto-called when user changes the count input
    on_count(val) {
        console.log('Count changed to:', val);  // val is a number
    }
}
```

## Pattern 3: Custom Value Extraction

```javascript
class RangeWidget extends ts.Events {
    constructor(container) {
        super();
        ts.compile_template(this, `
            <div>
                <input t-prop="percentage" t-extract="extract_percentage" t-val="50">
            </div>
        `, container);
    }

    // Custom extractor method referenced by t-extract
    extract_percentage(val) {
        let num = parseFloat(val);
        if (isNaN(num)) throw 'Must be a number';
        if (num < 0 || num > 100) throw 'Must be between 0 and 100';
        return num;
    }

    on_percentage(val) {
        console.log('Percentage:', val);
    }
}
```

When extraction fails, the InputProperty's `error` flag is set to `true` and
`msg` contains the error message. The `on_prop_state` event (or custom
`t-state-evt`) is triggered.

## Pattern 4: Select with Options

```javascript
class FilterWidget extends ts.Events {
    constructor(container) {
        super();
        ts.compile_template(this, `
            <div>
                <select t-elem="status_select" t-prop="status" t-val="active"
                        t-options='[["all","All"],["active","Active"],["archived","Archived"]]'>
                </select>
            </div>
        `, container);
    }

    on_status(val) {
        console.log('Filter changed to:', val);
    }
}
```

The `t-options` attribute is a JSON array of `[value, label]` pairs. Options
are populated before the InputProperty is created.

## Pattern 5: Button with Event Binding

```javascript
class Toolbar extends ts.Events {
    constructor(container) {
        super();
        ts.compile_template(this, `
            <div class="toolbar">
                <button t-prop="save_btn" t-val="Save"
                        t-bind-click="handle_save"
                        t-bind-down="handle_save_down">
                </button>
                <button t-prop="cancel_btn" t-val="Cancel"
                        t-bind-click="handle_cancel">
                </button>
            </div>
        `, container);
    }

    handle_save() {
        console.log('Save clicked');
    }

    handle_save_down() {
        console.log('Save mousedown');
    }

    handle_cancel() {
        console.log('Cancel clicked');
    }
}

let toolbar = new Toolbar($('#container'));
toolbar.save_btn = 'Saving...';  // updates button text
```

**ButtonProperty events:**
- `on_{name}_click` → bound to `t-bind-click`
- `on_{name}_down` → bound to `t-bind-down`
- `on_{name}_up` → bound to `t-bind-up`

## Pattern 6: SVG Template

```javascript
class IconWidget extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);

        ts.compile_svg(this, `
            <g t-elem="group">
                <rect t-elem="bg" width="24" height="24" fill="none"/>
                <path t-elem="icon" d="M4 4L20 20" stroke="currentColor"/>
            </g>
        `, this.ctx.elem);

        // this.group → raw SVG <g> element
        // this.bg → raw SVG <rect> element
        // this.icon → raw SVG <path> element
    }
}
```

**Note:** `compile_svg` returns raw SVG DOM elements (not jQuery-wrapped).
Only `t-elem` is supported for SVG — no `t-prop`, `t-val`, etc.

## Pattern 7: Template with Dynamic Values

Template strings are standard JavaScript template literals — use `${}` for
dynamic values:

```javascript
class UserCard extends ts.Events {
    constructor(container, user) {
        super();
        ts.compile_template(this, `
            <div class="card" t-elem="card">
                <h4 t-elem="name_elem">${user.name}</h4>
                <p t-elem="email_elem">${user.email}</p>
                <input t-prop="nickname" t-val="${user.nickname || ''}">
            </div>
        `, container);
    }
}
```

## Pattern 8: Appending to Existing Container

The third argument to `compile_template` is optional. If provided, the
compiled element is appended to it.

```javascript
// Append to existing container
ts.compile_template(this, '<div t-elem="item">...</div>', this.list);

// Without container — compile only, append manually later
let elem = ts.compile_template(this, '<div t-elem="item">...</div>');
this.list.prepend(elem);  // insert at beginning
```

`compile_template` returns the jQuery-wrapped root element.

## Complete Example

```javascript
import ts from 'treibstoff';

class TodoItem extends ts.Events {
    constructor(container, data) {
        super();
        this.data = data;

        let elem = ts.compile_template(this, `
            <div class="todo-item" t-elem="wrapper">
                <input type="checkbox" t-elem="checkbox">
                <input t-elem="title_input" t-prop="title" t-val="${data.title}">
                <select t-prop="priority" t-val="${data.priority}"
                        t-options='[["low","Low"],["medium","Medium"],["high","High"]]'>
                </select>
                <button t-prop="delete_btn" t-val="X"
                        t-bind-click="on_delete_click">
                </button>
            </div>
        `, container);

        // Wire checkbox manually (not a t-prop)
        this.checkbox.prop('checked', data.done);
        this.checkbox.on('change', () => {
            this.trigger('on_done_changed', this.checkbox.is(':checked'));
        });
    }

    on_title(val) {
        this.data.title = val;
        this.trigger('on_changed', this.data);
    }

    on_priority(val) {
        this.data.priority = val;
        this.trigger('on_changed', this.data);
    }

    on_delete_click() {
        this.trigger('on_delete', this.data);
        this.wrapper.remove();
    }
}
```

## Pitfalls

1. **`t-prop` without `t-elem`** still works — the property is created but
   the element reference is not stored on the widget.

2. **`t-type="number"`** uses `extract_number` which throws if the value is
   `NaN`. The InputProperty catches the error and sets its `error` flag.

3. **`t-options` must be valid JSON.** Use single quotes for the attribute
   and double quotes inside the JSON: `t-options='[["a","A"]]'`.

4. **`compile_template` wraps nodes with jQuery.** `compile_svg` does not —
   SVG elements are raw DOM nodes.

5. **The parser walks depth-first.** Child elements are parsed before their
   parents. This means `t-elem` references on children are available by the
   time the parent is parsed.

6. **`t-extract` references a method name on the widget**, not a function.
   Ensure the method exists at template compilation time.

7. **Button `t-val`** sets the initial button text (via `ButtonProperty.set()`
   which calls `ctx.text(val)`).
