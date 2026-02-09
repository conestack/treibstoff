# Treibstoff — Architecture Overview

Treibstoff is a JavaScript utility library for building browser-based applications.
It provides reactive properties, widget hierarchies, event handling, SVG graphics,
server-side rendering (SSR) via Ajax, forms, overlays, HTTP requests, WebSocket
communication, and template parsing.

All classes are exported through a single namespace object (`ts`):

```javascript
import ts from 'treibstoff';
```

## Module Map

```
src/
├── treibstoff.js          # Main aggregator — re-exports all public API members
├── events.js              # Events class — pub/sub event dispatcher (base for most classes)
├── properties.js          # 9 property types: Property, BoundProperty, CSSProperty,
│                          #   AttrProperty, InputProperty, DataProperty, TextProperty,
│                          #   SVGProperty, ButtonProperty
├── widget.js              # Widget (parent/child hierarchy), HTMLWidget, SVGContext,
│                          #   Button, Collapsible, Visibility
├── listener.js            # create_listener() factory, ClickListener, ChangeListener
├── motion.js              # Motion class — mousedown/move/up tracking
├── clock.js               # ClockFrameEvent, ClockTimeoutEvent, ClockIntervalEvent, Clock
├── keystate.js            # KeyState — keyboard modifier tracking (ctrl, shift, alt, etc.)
├── form.js                # Form, FormInput, FormField, FormCheckbox, FormSelect,
│                          #   FormRemoteSelect, lookup_form_elem
├── overlay.js             # Overlay, Dialog, Message, show_dialog, show_message,
│                          #   show_info, show_warning, show_error, get_overlay
├── spinner.js             # LoadingSpinner (singleton: spinner)
├── request.js             # HTTPRequest (singleton: http_request)
├── parser.js              # Parser, TemplateParser, HTMLParser, SVGParser,
│                          #   compile_template, compile_svg, extract_number
├── utils.js               # ~20 utility functions (URL parsing, cookies, SVG, DOM, etc.)
├── websocket.js           # Websocket class + state constants
├── bootstrap.js           # Bootstrap 5 cleanup integration
└── ssr/                   # Server-Side Rendering / Ajax system
    ├── ajax.js            # Ajax class (main orchestrator)
    ├── util.js            # AjaxUtil, AjaxOperation base classes
    ├── action.js          # AjaxAction — server action execution
    ├── dispatcher.js      # AjaxDispatcher — DOM attribute event handler
    ├── event.js           # AjaxEvent — event triggering
    ├── form.js            # AjaxForm — form submission
    ├── handle.js          # AjaxHandle — DOM manipulation & continuation
    ├── overlay.js         # AjaxOverlay — overlay operations
    ├── parser.js          # AjaxParser — parse ajax: attributes from DOM
    ├── path.js            # AjaxPath — browser history management
    └── destroy.js         # AjaxDestroy — DOM cleanup on replacement
```

## Inheritance Hierarchy

```
Events
├── Property
│   └── BoundProperty
│       ├── CSSProperty
│       ├── AttrProperty
│       ├── TextProperty
│       ├── DataProperty
│       ├── InputProperty
│       ├── SVGProperty
│       └── ButtonProperty
├── Motion
│   └── Widget
│       ├── HTMLWidget
│       │   └── SVGContext
│       └── Button (via ClickListener)
├── Visibility
│   └── FormField
├── KeyState
├── Overlay
│   └── Message
│       └── Dialog
├── LoadingSpinner
├── HTTPRequest
├── Websocket
├── Clock
├── ClockFrameEvent / ClockTimeoutEvent / ClockIntervalEvent
├── FormInput
│   ├── FormSelect (via changeListener mixin)
│   │   └── FormRemoteSelect
│   └── FormCheckbox (via changeListener mixin)
├── AjaxUtil
│   ├── AjaxOperation
│   │   ├── AjaxAction
│   │   │   └── AjaxOverlay
│   │   ├── AjaxEvent
│   │   └── AjaxPath
│   ├── AjaxHandle
│   ├── AjaxDispatcher
│   └── Ajax
├── Collapsible (plain class, no Events base)
└── Form (plain class, no Events base)
```

## Key Design Patterns

1. **Everything extends Events** — Nearly all classes inherit from `Events`,
   providing `on()`, `off()`, `trigger()`, and `suppress_events()`.

2. **Property binding** — `new ts.Property(this, 'name', default)` defines a
   getter/setter on the instance. When the value changes, `on_name(val)` is
   triggered automatically.

3. **Widget hierarchy** — `super({parent: p})` establishes parent-child
   relationships. `this.acquire(ClassName)` traverses ancestors to find a
   specific type.

4. **Lifecycle** — constructor → compile() → bind() → update() → destroy().

5. **Singletons** — `ts.spinner`, `ts.http_request`, `ts.ajax`, `ts.clock`.

6. **SSR/Ajax** — HTML attributes (`ajax:bind`, `ajax:action`, `ajax:event`,
   `ajax:overlay`, `ajax:path`) declaratively bind server interactions.
   The `AjaxParser` walks the DOM, the `AjaxDispatcher` intercepts events,
   and operation classes (`AjaxAction`, `AjaxEvent`, `AjaxOverlay`, `AjaxPath`)
   execute the work.

7. **Template compilation** — `ts.compile_template(widget, html, container)`
   parses HTML with `t-elem`, `t-prop`, `t-val`, `t-type` attributes to
   auto-wire DOM references and properties onto a widget instance.

## Public API Members

### Classes

| Class | Module | Description |
|-------|--------|-------------|
| `Events` | events.js | Pub/sub event dispatcher |
| `Property` | properties.js | Observable property |
| `BoundProperty` | properties.js | Property bound to DOM context |
| `CSSProperty` | properties.js | Syncs to CSS style |
| `AttrProperty` | properties.js | Syncs to HTML attribute |
| `TextProperty` | properties.js | Syncs to textContent |
| `DataProperty` | properties.js | Syncs to data object |
| `InputProperty` | properties.js | Syncs to input element value |
| `SVGProperty` | properties.js | Syncs to SVG attribute |
| `ButtonProperty` | properties.js | Syncs to button, fires click/down/up |
| `Widget` | widget.js | Parent/child hierarchy |
| `HTMLWidget` | widget.js | Widget wrapping a DOM element |
| `SVGContext` | widget.js | Widget wrapping an SVG element |
| `Button` | widget.js | Selectable button widget |
| `Visibility` | widget.js | Show/hide element |
| `Collapsible` | widget.js | Collapse/expand element |
| `Motion` | motion.js | Mouse motion tracking |
| `KeyState` | keystate.js | Keyboard modifier tracking |
| `Clock` | clock.js | Clock event factory |
| `ClockFrameEvent` | clock.js | requestAnimationFrame wrapper |
| `ClockTimeoutEvent` | clock.js | setTimeout wrapper |
| `ClockIntervalEvent` | clock.js | setInterval wrapper |
| `Overlay` | overlay.js | Modal overlay |
| `Message` | overlay.js | Message overlay |
| `Dialog` | overlay.js | Confirmation dialog |
| `Form` | form.js | Form container |
| `FormInput` | form.js | Form input wrapper |
| `FormField` | form.js | Form field with visibility |
| `FormCheckbox` | form.js | Checkbox input |
| `FormSelect` | form.js | Select input |
| `FormRemoteSelect` | form.js | Select with remote data fetch |
| `LoadingSpinner` | spinner.js | Loading animation |
| `HTTPRequest` | request.js | HTTP request handler |
| `Websocket` | websocket.js | WebSocket wrapper |
| `Parser` | parser.js | Base DOM walker |
| `TemplateParser` | parser.js | Template attribute parser |
| `HTMLParser` | parser.js | HTML template parser |
| `SVGParser` | parser.js | SVG template parser |
| `Ajax` | ssr/ajax.js | SSR orchestrator singleton |

### Functions

| Function | Module | Description |
|----------|--------|-------------|
| `create_listener(event, base)` | listener.js | Create listener class/mixin |
| `compile_template(inst, tmpl, container)` | parser.js | Compile HTML template |
| `compile_svg(inst, tmpl, container)` | parser.js | Compile SVG template |
| `extract_number(val)` | parser.js | Parse string to number |
| `http_request(opts)` | request.js | Execute HTTP request |
| `show_dialog(opts)` | overlay.js | Show confirmation dialog |
| `show_message(opts)` | overlay.js | Show message overlay |
| `show_info(message)` | overlay.js | Show info message |
| `show_warning(message)` | overlay.js | Show warning message |
| `show_error(message)` | overlay.js | Show error message |
| `get_overlay(uid)` | overlay.js | Get overlay by UID |
| `lookup_form_elem(opts, prefix)` | form.js | Find form element |
| `uuid4()` | utils.js | Generate UUID v4 |
| `set_default(ob, name, val)` | utils.js | Set default property |
| `json_merge(base, other)` | utils.js | Shallow merge objects |
| `parse_url(url)` | utils.js | Parse URL without query |
| `parse_query(url, as_string)` | utils.js | Parse query parameters |
| `parse_path(url, include_query)` | utils.js | Parse relative path |
| `set_visible(elem, visible)` | utils.js | Toggle hidden class |
| `query_elem(selector, context)` | utils.js | Query element (nullable) |
| `get_elem(selector, context)` | utils.js | Get element (throws) |
| `object_by_path(path)` | utils.js | Resolve dotted path on window |
| `deprecate(dep, sub, as_of)` | utils.js | Log deprecation warning |
| `create_cookie(name, value, days)` | utils.js | Create browser cookie |
| `read_cookie(name)` | utils.js | Read browser cookie |
| `create_svg_elem(name, opts, container)` | utils.js | Create SVG element |
| `set_svg_attrs(el, opts)` | utils.js | Set SVG attributes |
| `parse_svg(tmpl, container)` | utils.js | Parse SVG template string |
| `load_svg(url, callback)` | utils.js | Load SVG from URL |
| `ajax_destroy(elem)` | ssr/destroy.js | Destroy Ajax-bound element |
| `register_ajax_destroy_handle(cb)` | ssr/destroy.js | Register destroy callback |
| `unregister_ajax_destroy_handle(cb)` | ssr/destroy.js | Unregister destroy callback |

### Singletons

| Name | Type | Description |
|------|------|-------------|
| `spinner` | `LoadingSpinner` | Global loading spinner |
| `clock` | `Clock` | Global clock event factory |
| `ajax` | `Ajax` | Global SSR/Ajax orchestrator |

### Listener Shortcuts

| Name | Description |
|------|-------------|
| `ClickListener` | Base class for click listeners |
| `clickListener` | Mixin factory for click listeners |
| `ChangeListener` | Base class for change listeners |
| `changeListener` | Mixin factory for change listeners |

### Constants

| Name | Value | Description |
|------|-------|-------------|
| `svg_ns` | `'http://www.w3.org/2000/svg'` | SVG namespace URI |
| `WS_STATE_CONNECTING` | `0` | WebSocket connecting |
| `WS_STATE_OPEN` | `1` | WebSocket open |
| `WS_STATE_CLOSING` | `2` | WebSocket closing |
| `WS_STATE_CLOSED` | `3` | WebSocket closed |
