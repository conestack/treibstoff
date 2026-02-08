Widget
======

Overview
--------

The widget module provides a hierarchy system for building UI components.
Widgets can have parent/child relationships and support acquisition (looking
up ancestors by class).

Widget
~~~~~~

``Widget`` extends ``Motion`` (which extends ``Events``), so every widget
has event dispatching and mouse tracking capabilities. Widgets manage a
tree structure via ``parent``, ``children``, ``add_widget`` and
``remove_widget``.

.. code-block:: js

    import {Widget} from 'widget';

    class App extends Widget {
        on_parent(val) {
            console.log('Parent set to', val);
        }
    }

    class Panel extends Widget {}

    let app = new App({parent: null});
    let panel = new Panel({parent: app});

    // Acquire the App instance from a child
    let found = panel.acquire(App);  // returns app

HTMLWidget
~~~~~~~~~~

``HTMLWidget`` wraps a jQuery DOM element and provides CSS properties for
position and size (``x``, ``y``, ``width``, ``height``).

.. code-block:: js

    import {HTMLWidget} from 'widget';

    let elem = $('<div style="position: absolute;" />');
    $('body').append(elem);

    let widget = new HTMLWidget({parent: null, elem: elem});
    widget.x = 100;
    widget.y = 50;
    widget.width = 200;
    widget.height = 150;

SVGContext
~~~~~~~~~~

``SVGContext`` creates an SVG container element and provides helper methods
for creating SVG elements and setting their attributes.

.. code-block:: js

    import {SVGContext} from 'widget';

    let parent = { elem: $('<div />') };
    let ctx = new SVGContext({parent: parent, name: 'my-canvas'});

    let rect = ctx.svg_elem('rect', {
        x: 10, y: 10, width: 100, height: 50
    }, ctx.elem);

    ctx.svg_attrs(rect, {fill: 'blue'});

Visibility
~~~~~~~~~~

``Visibility`` toggles a ``hidden`` CSS class on an element and fires
``on_visible`` events when the state changes.

.. code-block:: js

    import {Visibility} from 'widget';

    let vis = new Visibility({elem: $('<div />')});
    vis.visible = false;  // adds 'hidden' class
    vis.visible = true;   // removes 'hidden' class

Collapsible
~~~~~~~~~~~

``Collapsible`` wraps Bootstrap's collapse jQuery plugin to toggle
show/hide state.

Button
~~~~~~

``Button`` extends ``ClickListener`` and provides selected/unselected
state with configurable CSS classes.

.. code-block:: js

    import {Button} from 'widget';

    class ToggleButton extends Button {
        on_click() {
            this.selected = !this.selected;
        }
    }

    let btn = new ToggleButton({elem: $('<button />')});

API
---

.. js:autoclass:: Widget
    :members:
        add_widget,
        remove_widget,
        acquire

.. js:autoclass:: HTMLWidget
    :members: offset

.. js:autoclass:: SVGContext
    :members:
        svg_attrs,
        svg_elem

.. js:autoclass:: Visibility
    :members: visible, hidden

.. js:autoclass:: Collapsible
    :members: collapsed

.. js:autoclass:: Button
    :members: selected
