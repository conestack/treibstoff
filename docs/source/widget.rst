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


Widget Lifecycle
^^^^^^^^^^^^^^^^

The standard lifecycle is: **constructor → compile() → bind() → destroy()**:

.. code-block:: js

    class MyWidget extends Widget {
        constructor(opts) {
            // 1. Establish hierarchy
            super({parent: opts.parent});

            // 2. Acquire context from ancestors
            this.ctx = this.acquire(SVGContext);

            // 3. Create reactive properties
            new DataProperty(this, 'x', {val: opts.data.x});
            new Property(this, 'selected', false);

            // 4. Build DOM/SVG
            this.compile();

            // 5. Attach event listeners
            this.bind();
        }

        compile() {
            this.elem = this.ctx.svg_elem('g', {}, this.ctx.elem);
        }

        bind() {
            this.set_scope(this.elem, this.ctx.elem);
        }

        on_x(val) {
            this.ctx.svg_attrs(this.elem, {
                transform: `translate(${val} 0)`
            });
        }

        destroy() {
            this.elem.remove();
        }
    }


Acquire
^^^^^^^

``acquire(ClassName)`` traverses the widget's ancestors and returns the first
instance of the given class. This is the standard way to access shared context:

.. code-block:: js

    class ToolbarButton extends Widget {
        constructor(opts) {
            super({parent: opts.parent});
            this.ctx = this.acquire(SVGContext);  // nearest SVGContext ancestor
            this.app = this.acquire(Application); // custom ancestor
        }
    }

``acquire()`` returns ``null`` if no ancestor matches. Always check the result
if the context might not exist.


Adding and Removing Children
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    let parent = new Widget({parent: null});
    let child = new Widget({parent: null});

    parent.add_widget(child);
    // child.parent === parent
    // parent.children includes child

    parent.remove_widget(child);
    // child.parent === null


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

Example with template compilation:

.. code-block:: js

    import {HTMLWidget} from 'widget';
    import {CSSProperty} from 'properties';
    import {compile_template} from 'parser';

    class Panel extends HTMLWidget {
        constructor(opts) {
            super({parent: opts.parent, elem: opts.elem});

            new CSSProperty(this, 'opacity', {val: 1});

            compile_template(this, `
                <div class="panel-header" t-elem="header">
                    <span t-elem="title_elem" class="title"></span>
                    <button t-prop="close_btn" t-bind-click="on_close_click">X</button>
                </div>
                <div class="panel-body" t-elem="body"></div>
            `, opts.elem);
        }

        on_close_click() {
            this.opacity = 0;
            this.trigger('on_close');
        }
    }

``HTMLWidget`` expects a jQuery-wrapped element in ``opts.elem``.


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

``SVGContext`` creates its own ``<svg>`` element from ``opts.name``. The parent
widget must have a jQuery-wrapped ``elem`` property for the SVG to attach to.
See the :doc:`SVG <svg>` section for a comprehensive guide.


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
show/hide state:

.. code-block:: js

    import {Collapsible} from 'widget';

    let col = new Collapsible({elem: $('<div class="collapse" />')});
    col.collapsed = true;   // hides the element
    col.collapsed = false;  // shows the element


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


Pitfalls
~~~~~~~~

- **Always pass ``{parent: ...}`` to the Widget constructor.** The parent can
  be ``null`` for root widgets.

- **Call ``super(opts)`` before accessing ``this``.** The parent property is
  set up in the Widget constructor.

- **Widget extends Motion**, so every widget can track mouse events via
  ``set_scope()``, ``down()``, ``move()``, ``up()`` — even if you don't need
  drag behavior.

- **``set_scope()`` cannot be called during a motion sequence.** It throws if
  called while mousedown is active.


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
