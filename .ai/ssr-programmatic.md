# SSR/Ajax — Programmatic JavaScript API

This guide explains how to use treibstoff's Ajax system from JavaScript code,
as opposed to the declarative HTML attribute approach.

## Context

The `ts.ajax` singleton provides methods to programmatically trigger all Ajax
operations: actions, events, overlays, paths, and forms. This is useful when
you need dynamic behavior that cannot be expressed through HTML attributes alone.

## Key API

| Method | Purpose |
|--------|---------|
| `ts.ajax.action(opts)` | Fetch a tile and insert into DOM |
| `ts.ajax.trigger(opts)` | Trigger a custom event on DOM elements |
| `ts.ajax.overlay(opts)` | Load content into a modal overlay |
| `ts.ajax.path(opts)` | Push/replace browser history entry |
| `ts.ajax.form(opts)` | Render Ajax form response |
| `ts.ajax.register(fn, instant)` | Register a binder callback |
| `ts.ajax.bind(context)` | Parse and bind Ajax attributes in DOM |
| `ts.ajax.attach(instance, elem)` | Attach JS instance for lifecycle management |
| `ts.ajax.parse_target(url)` | Parse URL into {url, params, path, query} |

## Pattern 1: Execute an Action

Request a server-side tile and insert its HTML into the DOM.

```javascript
let target = ts.ajax.parse_target('http://example.com/items?page=2');
ts.ajax.action({
    name: 'content',           // server-side tile/action name
    selector: '#content',      // DOM element to update
    mode: 'inner',             // 'inner' or 'replace'
    url: target.url,           // URL without query
    params: target.params      // query parameters as object
});
```

## Pattern 2: Trigger a Custom Event

Create and dispatch a custom event on matching DOM elements.

```javascript
ts.ajax.trigger({
    name: 'contextchanged',
    selector: '#layout',
    target: 'http://example.com/items/42',
    data: {key: 'value'}     // optional extra data
});
```

Elements bound to `contextchanged` via `ajax:bind` will receive the event
with `evt.ajaxtarget` and `evt.ajaxdata` properties.

## Pattern 3: Open an Overlay

Load server content into a modal overlay.

```javascript
let overlay = ts.ajax.overlay({
    action: 'editform',
    target: 'http://example.com/items/42/edit',
    css: 'overlay-form',
    title: 'Edit Item',
    on_close: function(inst) {
        console.log('Overlay closed');
    }
});

// The overlay UID for later reference
let uid = overlay.uid;
```

**With explicit URL and params:**
```javascript
ts.ajax.overlay({
    action: 'editform',
    url: 'http://example.com/items/42/edit',
    params: {mode: 'advanced'},
    title: 'Edit Item'
});
```

**Close an overlay by UID:**
```javascript
ts.ajax.overlay({
    close: true,
    uid: uid
});
```

## Pattern 4: Manage Browser History

Push or replace a browser history entry with associated Ajax operations.

```javascript
ts.ajax.path({
    path: '/items/42',
    target: 'http://example.com/items/42',
    action: 'content:#content:inner',
    event: 'contextchanged:#layout'
});
```

When the user clicks the back button, the saved `action` and `event` are
replayed automatically.

**Replace instead of push:**
```javascript
ts.ajax.path({
    path: '/items/42',
    target: 'http://example.com/items/42',
    action: 'content:#content:inner',
    replace: true
});
```

## Pattern 5: Register Binder Callbacks

Register JavaScript that runs every time Ajax updates the DOM. This is the
primary integration point for custom widgets.

```javascript
$(function() {
    ts.ajax.register(function(context) {
        // 'context' is the jQuery-wrapped DOM that was just updated
        $('.my-widget', context).each(function() {
            new MyWidget($(this));
        });
    }, true);  // true = also execute immediately on registration
});
```

**Best practice pattern for widget initialization:**
```javascript
class ItemList {
    static initialize(context) {
        $('.item-list', context).each(function() {
            new ItemList($(this));
        });
    }

    constructor(elem) {
        this.elem = elem;
        ts.ajax.attach(this, elem);  // register for lifecycle
        this.setup();
    }

    setup() {
        this.elem.find('.item').on('click', this.on_item_click.bind(this));
    }

    destroy() {
        // Called automatically when this DOM element is replaced by Ajax
        this.elem.find('.item').off('click');
    }
}

$(function() {
    ts.ajax.register(ItemList.initialize, true);
});
```

## Pattern 6: Attach Instances for Lifecycle Management

When Ajax replaces DOM elements, attached instances get their `destroy()`
method called automatically.

```javascript
class Tooltip {
    constructor(elem) {
        this.elem = elem;
        ts.ajax.attach(this, elem);
        this.tip = new ExternalTooltip(elem[0]);
    }

    destroy() {
        this.tip.dispose();
    }
}
```

## Pattern 7: Spinner Management

The loading spinner shows during Ajax requests automatically. For manual
control:

```javascript
ts.ajax.spinner.show();
// ... do work ...
ts.ajax.spinner.hide();

// Force hide (resets counter):
ts.ajax.spinner.hide(true);
```

## Pattern 8: Error Display

```javascript
ts.show_error('<pre>' + error_message + '</pre>');
ts.show_warning('Something might be wrong');
ts.show_info('Operation completed');
ts.show_message({
    title: 'Custom Title',
    message: 'Detailed message',
    flavor: 'info',       // 'info', 'warning', 'error'
    css: 'modal-xl'       // optional size class
});
```

## Complete Example: Custom Action with Overlay Feedback

```javascript
function saveAndNotify(itemId, data) {
    ts.http_request({
        url: `/api/items/${itemId}`,
        method: 'POST',
        type: 'json',
        params: data,
        success: function(response) {
            // Update the item display
            ts.ajax.action({
                name: 'itemdetail',
                selector: '#item-detail',
                mode: 'inner',
                url: `/items/${itemId}`,
                params: {}
            });
            // Trigger context change for sidebar etc.
            ts.ajax.trigger({
                name: 'contextchanged',
                selector: '#layout',
                target: `/items/${itemId}`
            });
            // Update browser URL
            ts.ajax.path({
                path: `/items/${itemId}`,
                target: `/items/${itemId}`,
                action: 'itemdetail:#item-detail:inner'
            });
        }
    });
}
```

## Pitfalls

1. **`ts.ajax.register()` with `instant=true` only fires immediately if
   `ts.ajax.bind()` has already been called** (i.e. after document ready).
   If registered before document ready, the callback runs once on initial bind.

2. **`ts.ajax.attach()` requires exactly one DOM element.** If a jQuery
   collection has 0 or 2+ elements, it throws.

3. **`ts.ajax.parse_target()` returns `{url, params, path, query}`.** Always
   use this to split a URL before passing to `action()` or `overlay()`.

4. **Continuation operations** from server responses are executed automatically.
   Ensure server-side code returns proper continuation arrays.

5. **The `ts.ajax.trigger()` method** is the treibstoff-level trigger (Ajax events),
   not the `Events.trigger()` method. When called on the `ajax` singleton,
   it dispatches Ajax events on DOM elements.
