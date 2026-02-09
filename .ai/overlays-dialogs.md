# Overlays, Dialogs, and Messages

This guide explains how to create modal overlays, confirmation dialogs, and
message popups using treibstoff.

## Context

Treibstoff provides a Bootstrap-compatible modal overlay system with stacking
support (multiple overlays at once), lifecycle events, and Ajax integration.

## Key API

| Class/Function | Purpose |
|----------------|---------|
| `ts.Overlay` | Base modal overlay with header, body, footer |
| `ts.Message` | Overlay with message content and close button |
| `ts.Dialog` | Confirmation dialog with OK/Cancel buttons |
| `ts.show_message(opts)` | Show a message overlay |
| `ts.show_info(message)` | Show an info message |
| `ts.show_warning(message)` | Show a warning message |
| `ts.show_error(message)` | Show an error message |
| `ts.show_dialog(opts)` | Show a confirmation dialog |
| `ts.get_overlay(uid)` | Get an open overlay by its UID |
| `ts.ajax.overlay(opts)` | Load server content into an overlay |

## Pattern 1: Quick Messages

```javascript
// Info message
ts.show_info('Operation completed successfully.');

// Warning
ts.show_warning('This action cannot be undone.');

// Error
ts.show_error('<pre>Error: Connection timeout</pre>');

// Custom message with title and flavor
ts.show_message({
    title: 'Import Results',
    message: '<p>42 records imported.</p><p>3 records skipped.</p>',
    flavor: 'info',
    css: 'modal-lg'    // optional: Bootstrap size class
});
```

**Flavors:** `'info'`, `'warning'`, `'error'` — applied as CSS class on the modal.

## Pattern 2: Confirmation Dialog

```javascript
ts.show_dialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this item?',
    on_confirm: function(inst) {
        // inst is the Dialog instance
        console.log('User confirmed');
        delete_item(42);
    }
});
```

The dialog shows OK and Cancel buttons. OK triggers `on_confirm` and closes.
Cancel just closes.

## Pattern 3: Custom Overlay

```javascript
let overlay = new ts.Overlay({
    uid: 'my-overlay',           // optional, auto-generated if omitted
    title: 'Custom Overlay',
    content: '<p>Loading...</p>',
    flavor: 'info',
    css: 'my-custom-class',
    container: $('#overlay-container'),  // defaults to $('body')
    on_open: function(inst) {
        console.log('Overlay opened');
    },
    on_close: function(inst) {
        console.log('Overlay closed');
    }
});

overlay.open();

// Later:
overlay.close();
```

**Overlay DOM structure after `open()`:**
```html
<div class="modal-wrapper position-absolute" style="z-index: 1055">
    <div class="modal-backdrop opacity-25"></div>
    <div class="modal info my-custom-class" id="my-overlay">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Custom Overlay</h5>
                    <button class="btn-close close">...</button>
                </div>
                <div class="modal-body"><p>Loading...</p></div>
                <div class="modal-footer"></div>
            </div>
        </div>
    </div>
</div>
```

## Pattern 4: Programmatic Content Update

```javascript
let overlay = new ts.Overlay({title: 'Loading...'});
overlay.open();

// Update body content
overlay.body.html('<p>New content loaded</p>');

// Add footer buttons via compile_template
ts.compile_template(overlay, `
    <button class="btn btn-primary"
            t-prop="save_btn" t-bind-click="on_save">Save</button>
`, overlay.footer);

overlay.on_save = function() {
    console.log('Save clicked');
    overlay.close();
};
```

## Pattern 5: Stacked Overlays

Overlays automatically stack with increasing z-index.

```javascript
let first = new ts.Overlay({title: 'First'});
first.open();

let second = new ts.Overlay({title: 'Second'});
second.open();
// second appears above first (z-index is higher)

second.close();
// first is still visible
first.close();
```

## Pattern 6: Ajax Overlay (Server Content)

Load content from the server into an overlay:

```javascript
let overlay = ts.ajax.overlay({
    action: 'editform',
    target: 'http://example.com/items/42/edit',
    title: 'Edit Item',
    css: 'overlay-form',
    on_close: function(inst) {
        // Refresh the item list after edit
        ts.ajax.trigger({
            name: 'contextchanged',
            selector: '#item-list',
            target: '/items'
        });
    }
});

// Overlay UID for later reference
let uid = overlay.uid;
```

**Close by UID:**
```javascript
ts.ajax.overlay({close: true, uid: uid});
```

## Pattern 7: Lookup Open Overlay

```javascript
let overlay = ts.get_overlay('my-overlay');
if (overlay) {
    overlay.body.html('<p>Updated content</p>');
} else {
    console.log('Overlay not found or not open');
}
```

## Pattern 8: Custom Dialog Subclass

```javascript
class ConfirmWithInput extends ts.Dialog {
    constructor(opts) {
        super(opts);
        this.input = $('<input type="text" class="form-control mt-2">');
        this.body.append(this.input);
    }

    on_ok_btn_click() {
        let value = this.input.val();
        this.close();
        this.trigger('on_confirm', value);
    }
}

let dialog = new ConfirmWithInput({
    title: 'Enter Name',
    message: 'Please provide a name:',
    on_confirm: function(inst, value) {
        console.log('Name entered:', value);
    }
});
dialog.open();
```

## Complete Example

```javascript
import ts from 'treibstoff';

function deleteItemWithConfirm(itemId) {
    ts.show_dialog({
        title: 'Delete Item',
        message: `Are you sure you want to delete item #${itemId}?`,
        on_confirm: function() {
            ts.http_request({
                url: `/api/items/${itemId}`,
                method: 'POST',
                type: 'json',
                params: {action: 'delete'},
                success: function(data) {
                    ts.show_info('Item deleted successfully.');
                    ts.ajax.action({
                        name: 'itemlist',
                        selector: '#item-list',
                        mode: 'inner',
                        url: '/items',
                        params: {}
                    });
                }
            });
        }
    });
}
```

## Pitfalls

1. **Overlays use `compile_template` internally.** The overlay's `wrapper`,
   `backdrop`, `elem`, `body`, `footer` are all available as properties after
   construction.

2. **`close()` calls `ajax_destroy` on the wrapper** before removing it from
   the DOM. This properly cleans up any Ajax-bound widgets inside the overlay.

3. **`show_message/info/warning/error` auto-focus** the first button on open.

4. **The `body` class `modal-open`** is added when an overlay opens and removed
   when the last visible overlay closes. This prevents body scrolling.

5. **`get_overlay(uid)` returns `null`** if the element doesn't exist or has
   no overlay data. Always null-check the result.

6. **Dialog's OK button handler** fires `on_confirm` after closing. Subscribe
   to `on_confirm` via the constructor options, not via a method override.

7. **Overlay UIDs** can be specified or auto-generated. When using Ajax overlays,
   the UID is sent as `ajax.overlay-uid` parameter to the server.
