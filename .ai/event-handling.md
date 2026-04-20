# Event Handling

This guide explains how to use treibstoff's event system, DOM listeners,
keyboard state tracking, and event suppression.

## Context

Nearly every class in treibstoff extends `Events`, which provides a pub/sub
event dispatcher. On top of this, `create_listener` creates classes that bridge
DOM events to treibstoff events, and `KeyState` tracks keyboard modifier keys.

## Key API

| Class/Function | Purpose |
|----------------|---------|
| `ts.Events` | Base pub/sub dispatcher — `on()`, `off()`, `trigger()` |
| `ts.create_listener(event, base)` | Factory for DOM event listener classes |
| `ts.ClickListener` | Pre-built click listener class |
| `ts.clickListener` | Pre-built click listener mixin |
| `ts.ChangeListener` | Pre-built change listener class |
| `ts.changeListener` | Pre-built change listener mixin |
| `ts.KeyState` | Keyboard modifier state tracker |

## Pattern 1: Basic Events

```javascript
import ts from 'treibstoff';

class Model extends ts.Events {
    constructor() {
        super();
    }

    save() {
        // do save work...
        this.trigger('on_save', {id: 42});
    }
}

let model = new Model();

// Subscribe
let handler = function(inst, data) {
    console.log('Saved:', data.id);  // inst = model, data = {id: 42}
};
model.on('on_save', handler);

// Trigger
model.save();  // logs: "Saved: 42"

// Unsubscribe specific handler
model.off('on_save', handler);

// Unsubscribe all handlers for event
model.off('on_save');
```

**Key points:**
- `on()` returns `this` for chaining: `obj.on('a', fn1).on('b', fn2)`
- `off()` returns `this` for chaining
- Duplicate subscribers are silently ignored (same function registered twice)
- `trigger(event, ...args)` passes all extra arguments to subscribers
- Subscribers receive `(instance, ...args)` — the emitting instance is always first

## Pattern 2: Default Event Handlers

If a method with the event name exists on the instance, it's called first.

```javascript
class Widget extends ts.Events {
    constructor() {
        super();
    }

    // Called when trigger('on_update', val) fires
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
```

## Pattern 3: Bind from Options

Shortcut for subscribing to events from a constructor options object.

```javascript
class Overlay extends ts.Events {
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
```

## Pattern 4: Event Suppression

Batch operations without triggering events, then fire a single summary event.

```javascript
class DataStore extends ts.Events {
    constructor() {
        super();
    }

    reload(data) {
        this.suppress_events(() => {
            this.delete_all();      // no events fired
            this._data = data;
            this.create_all();      // no events fired
        });
        this.trigger('data_changed', data);  // single event after batch
    }
}
```

During `suppress_events(fn)`, all calls to `trigger()` are no-ops.

## Pattern 5: Click Listener (Base Class)

```javascript
class ToggleButton extends ts.ClickListener {
    constructor(elem) {
        // elem must be a jQuery-wrapped DOM element
        super({elem: elem});
        this.active = false;
    }

    on_click(evt) {
        this.active = !this.active;
        this.elem.toggleClass('active', this.active);
    }

    destroy() {
        // Unbinds the DOM event listener
        super.destroy();
    }
}

let btn = new ToggleButton($('#my-button'));
```

**How it works:**
1. Constructor binds `click` event on `elem`
2. On click, triggers `on_click` as a treibstoff event
3. `on_click(evt)` method is called as the default handler
4. External subscribers can also listen: `btn.on('on_click', fn)`
5. `destroy()` unbinds the DOM event

## Pattern 6: Listener as Mixin

Use when your class already has a base class that extends `Events`.

```javascript
// Create a click listener mixin
let clickListener = Base => ts.create_listener('click', Base);

class InteractiveInput extends clickListener(ts.FormInput) {
    // FormInput extends Events, so this works
    on_click(evt) {
        this.elem.select();
    }
}
```

The pre-built mixins are:
- `ts.clickListener(Base)` — click events
- `ts.changeListener(Base)` — change events

## Pattern 7: Custom Listener

```javascript
// Create a custom listener for any DOM event
let DblClickListener = ts.create_listener('dblclick');

class EditableLabel extends DblClickListener {
    constructor(elem) {
        super({elem: elem});
    }

    on_dblclick(evt) {
        this.elem.attr('contenteditable', 'true');
        this.elem.focus();
    }
}

// As a mixin:
let dblclickListener = Base => ts.create_listener('dblclick', Base);
```

## Pattern 8: KeyState (Keyboard Modifiers)

Track modifier keys (Ctrl, Shift, Alt, Enter, Escape, Delete) globally.

```javascript
class Editor extends ts.Events {
    constructor() {
        super();
        // Optional filter: return true to suppress the event
        this.key_state = new ts.KeyState(function(evt) {
            // Don't track keys when a text input is focused
            return evt.target.tagName === 'INPUT';
        });

        this.key_state.on('keydown', this.on_keydown.bind(this));
        this.key_state.on('keyup', this.on_keyup.bind(this));
    }

    on_keydown(key_state, evt) {
        if (key_state.ctrl && evt.keyCode === 65) {
            // Ctrl+A: select all
            evt.preventDefault();
            this.select_all();
        }
        if (key_state.delete) {
            this.delete_selected();
        }
        if (key_state.esc) {
            this.deselect_all();
        }
    }

    on_keyup(key_state, evt) {
        // modifier released
    }

    destroy() {
        this.key_state.unload();  // remove window keydown/keyup listeners
    }
}
```

**Available modifier properties:**
| Property | Key Code | Key |
|----------|----------|-----|
| `ctrl` | 17 | Control |
| `shift` | 16 | Shift |
| `alt` | 18 | Alt |
| `enter` | 13 | Enter |
| `esc` | 27 | Escape |
| `delete` | 46 | Delete |

These are boolean flags — `true` while the key is held down, `false` when released.

## Pattern 9: Lifecycle Integration with Ajax

Listeners automatically call `ts.ajax.attach(this, elem)` in their constructor.
When the DOM element is replaced by an Ajax operation, `destroy()` is called
automatically.

```javascript
class AutoCleanWidget extends ts.ClickListener {
    constructor(elem) {
        super({elem: elem});
        // ts.ajax.attach(this, elem) is called internally
        this.tooltip = new ExternalTooltip(elem[0]);
    }

    on_click(evt) {
        this.tooltip.toggle();
    }

    destroy() {
        this.tooltip.dispose();
        super.destroy();
    }
}

// Register via ajax.register for automatic lifecycle management
$(function() {
    ts.ajax.register(function(context) {
        $('.my-widget', context).each(function() {
            new AutoCleanWidget($(this));
        });
    }, true);
});
```

## Complete Example

```javascript
import ts from 'treibstoff';

class InteractivePanel extends ts.ClickListener {
    constructor(elem) {
        super({elem: elem});
        this.key_state = new ts.KeyState();
        this.key_state.on('keydown', this.on_keydown.bind(this));
    }

    on_click(evt) {
        if (this.key_state.ctrl) {
            // Ctrl+Click: add to selection
            this.trigger('on_multi_select');
        } else {
            // Normal click: single select
            this.trigger('on_select');
        }
    }

    on_keydown(ks, evt) {
        if (ks.esc) {
            this.trigger('on_deselect');
        }
    }

    destroy() {
        this.key_state.unload();
        super.destroy();
    }
}

let panel = new InteractivePanel($('#panel'));
panel.on('on_select', (inst) => console.log('Selected'));
panel.on('on_multi_select', (inst) => console.log('Multi-selected'));
panel.on('on_deselect', (inst) => console.log('Deselected'));
```

## Pitfalls

1. **`create_listener` requires the base class to extend `Events`** (or be
   `Events` itself). It throws if the base doesn't inherit from `Events`.

2. **Listeners require `this.elem`** (a jQuery-wrapped element). It must be
   set before the listener constructor runs — either via `opts.elem` or by the
   superclass.

3. **Always call `destroy()`** (or `super.destroy()` in subclasses) to unbind
   DOM events. Failing to do so causes memory leaks.

4. **KeyState binds to `window`.** Only one KeyState should be active at a time
   (per logical keyboard context). Call `unload()` when done.

5. **`suppress_events()` is synchronous.** If the callback throws, events
   remain suppressed. The implementation resets the flag after the function
   returns.

6. **Event subscriber functions receive `(instance, ...args)`** — the emitting
   object is always the first argument. Default method handlers on the instance
   receive only `(...args)` (no instance prefix, since `this` is available).
