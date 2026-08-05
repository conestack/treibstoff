Architecture
============

Module Map
----------

::

    src/
    ├── treibstoff.js          Main aggregator — exports all public API members
    ├── events.js              Events class — pub/sub event dispatcher
    ├── properties.js          9 property types for two-way binding
    ├── widget.js              Widget hierarchy, HTMLWidget, SVGContext, etc.
    ├── listener.js            DOM event listener factory
    ├── motion.js              Mouse motion tracking
    ├── clock.js               Timer/animation frame scheduling
    ├── keystate.js            Keyboard modifier tracking
    ├── form.js                Form field abstractions
    ├── overlay.js             Modal overlays and dialogs
    ├── spinner.js             Loading spinner singleton
    ├── request.js             HTTP request wrapper
    ├── parser.js              Template parser for DOM/SVG creation
    ├── utils.js               Utility functions (URL, DOM, SVG, cookies)
    ├── websocket.js           WebSocket wrapper
    ├── bootstrap.js           Bootstrap 5 cleanup integration
    └── ssr/                   Server-Side Rendering / Ajax system
        ├── ajax.js            Ajax singleton (main orchestrator)
        ├── util.js            AjaxUtil, AjaxOperation base classes
        ├── action.js          Server action execution
        ├── dispatcher.js      DOM attribute event handler
        ├── event.js           Event triggering
        ├── form.js            Form submission
        ├── handle.js          DOM manipulation and continuation
        ├── overlay.js         Overlay operations
        ├── parser.js          Parse ajax: attributes from DOM
        ├── path.js            Browser history management
        └── destroy.js         DOM cleanup on element replacement

Inheritance Hierarchy
---------------------

::

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
    ├── Widget (via Motion)
    │   ├── HTMLWidget
    │   ├── SVGContext
    │   ├── Button (via ClickListener)
    │   ├── Collapsible
    │   └── Visibility
    ├── Motion
    ├── KeyState
    ├── Overlay
    ├── LoadingSpinner
    ├── HTTPRequest
    ├── Websocket
    ├── Clock
    └── Ajax (via AjaxUtil)

Key Design Patterns
-------------------

Everything Extends Events
~~~~~~~~~~~~~~~~~~~~~~~~~

Nearly all classes inherit from ``Events``, providing a unified pub/sub
mechanism. Default handlers are methods named after the event (e.g.
``on_open``). External subscribers are added via ``.on('on_open', fn)``.

Property Binding
~~~~~~~~~~~~~~~~

Properties define getter/setter pairs via ``Object.defineProperty`` that
automatically trigger ``on_{name}`` events. Subclasses bind the value to
DOM elements, CSS styles, SVG attributes, or data objects.

Widget Hierarchy
~~~~~~~~~~~~~~~~

``Widget`` provides parent/child tree management with ``acquire()`` for
looking up ancestors by class. ``HTMLWidget`` and ``SVGContext`` add
DOM-specific functionality.

SSR System
~~~~~~~~~~

The Ajax system (``src/ssr/``) enables Server-Side Rendered Single-Page
Applications via HTML attributes (``ajax:action``, ``ajax:event``,
``ajax:overlay``, ``ajax:path``). The server controls DOM updates and
the client handles rendering, history, and event dispatch.
