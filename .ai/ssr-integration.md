# SSR/Ajax Integration via HTML Template Attributes

This guide explains how to wire server-side rendering (SSR) and Ajax interactions
using declarative HTML attributes in treibstoff.

## Context

Treibstoff's SSR system lets you add Ajax behavior to server-rendered HTML without
writing JavaScript. The `AjaxParser` walks the DOM looking for `ajax:*` attributes.
The `AjaxDispatcher` intercepts DOM events and triggers the appropriate operation
(action, event, overlay, path). The server responds with JSON containing a payload
(HTML), and the `AjaxHandle` inserts it into the DOM.

## Key Concepts

- **`ajax:bind`** — Which DOM event(s) activate this element (e.g. `click`, `change`)
- **`ajax:target`** — Server URL to request from
- **`ajax:action`** — Fetch a tile/view and insert into DOM
- **`ajax:event`** — Trigger a custom event on other elements
- **`ajax:overlay`** — Load content into a modal overlay
- **`ajax:path`** — Update browser URL / history
- **`ajax:confirm`** — Show confirmation dialog before executing
- **`ajax:form`** — Mark a form for Ajax submission

## All ajax: Attributes

| Attribute | Purpose | Format |
|-----------|---------|--------|
| `ajax:bind` | DOM event(s) to listen for | `"click"`, `"change"`, `"contextchanged"` |
| `ajax:target` | Server URL for requests | URL string |
| `ajax:action` | Fetch tile, insert into DOM | `"tilename:#selector:mode"` |
| `ajax:event` | Trigger custom event | `"eventname:#selector"` |
| `ajax:overlay` | Load content into overlay | `"actionname"` or `"CLOSE:uid"` |
| `ajax:overlay-css` | CSS class for overlay | CSS class string |
| `ajax:overlay-uid` | Unique ID for overlay | UID string |
| `ajax:overlay-title` | Title for overlay header | Text string |
| `ajax:path` | Update browser URL | `"href"`, `"target"`, or path string |
| `ajax:path-target` | Override target for path op | URL string |
| `ajax:path-action` | Action for history popstate | Same as `ajax:action` |
| `ajax:path-event` | Event for history popstate | Same as `ajax:event` |
| `ajax:path-overlay` | Overlay for history popstate | Same as `ajax:overlay` |
| `ajax:path-overlay-css` | CSS for path overlay | CSS class string |
| `ajax:path-overlay-uid` | UID for path overlay | UID string |
| `ajax:path-overlay-title` | Title for path overlay | Text string |
| `ajax:confirm` | Confirmation message | Text string |
| `ajax:form` | Mark element for Ajax form | `"true"` |

## Pattern 1: Navigation Link (Click → Fetch → Update DOM)

The most common pattern: clicking a link fetches new content from the server
and updates a section of the page.

```html
<a href="/items/42"
   ajax:bind="click"
   ajax:target="/items/42"
   ajax:event="contextchanged:#layout"
   ajax:path="href">
   Item 42
</a>
```

**What happens on click:**
1. Browser default navigation is prevented
2. `ajax:path="href"` — Browser URL is updated to `/items/42`
3. `ajax:event="contextchanged:#layout"` — A `contextchanged` event is
   triggered on `#layout`, carrying the target URL
4. Elements bound to `contextchanged` (see Pattern 2) will fetch new content

## Pattern 2: Container Auto-Update (Event → Fetch → Replace)

A container that responds to custom events by fetching and replacing its content.

```html
<div id="content"
     ajax:bind="contextchanged"
     ajax:action="content:#content:inner">
</div>
```

**What happens when `contextchanged` fires on this element:**
1. `ajax:action="content:#content:inner"` is parsed as `tilename:selector:mode`
2. An HTTP request is sent to `{target_url}/ajaxaction?ajax.action=content&ajax.mode=inner&ajax.selector=#content`
3. The server returns JSON with a `payload` (HTML string)
4. The payload replaces the inner HTML of `#content`
5. `ts.ajax.bind()` is called on the new DOM to wire up any Ajax attributes inside

**Modes:**
- `inner` — Replace the element's inner HTML (element itself stays)
- `replace` — Replace the entire element (including itself)

## Pattern 3: Overlay Operations

Load server content into a modal overlay.

```html
<a ajax:bind="click"
   ajax:target="/items/42/edit"
   ajax:overlay="overlayedit"
   ajax:overlay-css="overlay-form"
   ajax:overlay-uid="edit-42"
   ajax:overlay-title="Edit Item">
   Edit
</a>
```

**What happens:**
1. An `Overlay` instance is created with the given CSS, UID, and title
2. The action `overlayedit` is requested from the server
3. The response payload is inserted into the overlay's `.modal-body`
4. The overlay opens

**Close an overlay:**
```html
<a ajax:bind="click"
   ajax:overlay="CLOSE:edit-42">
   Close
</a>
```

## Pattern 4: Dynamic Event Binding (Tables, Pagination)

For elements that need dynamic targets — e.g. a select that changes which
page of results to show.

```html
<select ajax:bind="change"
        ajax:target="/items/list"
        ajax:event="filterchanged:#item-table"
        ajax:path="target"
        ajax:path-event="filterchanged:#item-table">
    <option value="10">10 per page</option>
    <option value="25">25 per page</option>
</select>
```

## Pattern 5: Confirmation Dialog

Show a confirmation dialog before executing an action.

```html
<a ajax:bind="click"
   ajax:target="/items/42"
   ajax:confirm="Are you sure you want to delete this item?"
   ajax:action="delete:NONE:NONE">
   Delete
</a>
```

The user sees a dialog with "Are you sure...?" and OK/Cancel buttons.
The action only executes if OK is clicked.

**`NONE` selector/mode** means the server action has no DOM update — it
performs a side effect only (delete, state change, etc.).

## Pattern 6: No-DOM-Update Actions

Actions that only trigger server-side effects without modifying the page.

```html
<a ajax:bind="click"
   ajax:target="/settings/language/en"
   ajax:action="change_language:NONE:NONE">
   English
</a>
```

## Pattern 7: Ajax Forms

Forms submitted via Ajax using a hidden iframe.

```html
<form id="my-form" class="ajax"
      action="/items/42/save"
      method="POST"
      enctype="multipart/form-data">
    <input type="text" name="title" value="">
    <button type="submit">Save</button>
</form>
```

Or explicitly with the attribute:
```html
<form ajax:form="true" action="/items/42/save" method="POST">
    ...
</form>
```

The form is submitted to a hidden iframe. The server responds by calling
`ts.ajax.form()` from within the iframe, which triggers DOM updates and
continuation operations.

## Complete Example: Navigation Layout

```html
<!-- Navigation links -->
<nav id="mainmenu">
    <a href="/dashboard"
       ajax:bind="click"
       ajax:target="/dashboard"
       ajax:event="contextchanged:#layout"
       ajax:path="href">
       Dashboard
    </a>
    <a href="/items"
       ajax:bind="click"
       ajax:target="/items"
       ajax:event="contextchanged:#layout"
       ajax:path="href">
       Items
    </a>
</nav>

<!-- Content area that reloads on context change -->
<div id="layout">
    <div id="content"
         ajax:bind="contextchanged"
         ajax:action="content:#content:inner">
        <!-- Server-rendered content here -->
    </div>
    <div id="sidebar"
         ajax:bind="contextchanged"
         ajax:action="sidebar:#sidebar:inner">
        <!-- Sidebar content here -->
    </div>
</div>
```

**Flow:** Click "Items" → URL changes to `/items` → `contextchanged` fires on
`#layout` → Both `#content` and `#sidebar` fetch their respective tiles from
`/items/ajaxaction` → DOM is updated → New content is Ajax-bound.

## Server Response Format

The server must respond to `/ajaxaction` requests with JSON:

```json
{
    "mode": "inner",
    "selector": "#content",
    "payload": "<div>...new HTML...</div>",
    "continuation": [
        {"type": "path", "path": "/items", "target": "/items", "action": "content:#content:inner"},
        {"type": "event", "name": "itemsloaded", "selector": "#sidebar"},
        {"type": "message", "payload": "Saved!", "flavor": "info"}
    ]
}
```

**Continuation types:** `path`, `action`, `event`, `overlay`, `message`.

## Pitfalls

1. **`ajax:bind` is required** for `ajax:action`, `ajax:event`, and
   `ajax:overlay` to work. Without it, the parser skips the element.

2. **`ajax:target` is the server URL**, not the DOM target. The DOM target
   is specified in `ajax:action` (the `#selector` part).

3. **Modes `inner` vs `replace`**: Use `inner` when the container element
   should persist. Use `replace` when the entire element (including its
   attributes) needs to be swapped.

4. **After DOM replacement, `ts.ajax.bind()` is called automatically** on
   the new content. Any `ajax:*` attributes in the new HTML will be wired up.

5. **`ajax:path="href"`** reads the path from the element's `href` attribute.
   `ajax:path="target"` reads from `ajax:target`.

6. **Multiple actions** can be space-separated:
   `ajax:action="content:#content:inner sidebar:#sidebar:inner"`.

7. **Custom events** (like `contextchanged`) are application-defined. They
   are standard jQuery events triggered via `ts.ajax.trigger()`.
