Properties
==========

Overview
--------

Properties provide two-way binding between JavaScript objects and DOM elements.
They integrate with the event system by triggering ``on_{name}`` events when
values change.

.. code-block:: js

    import {Events} from 'events';
    import {Property} from 'properties';

    class MyObject extends Events {

        constructor() {
            super();
            new Property(this, 'some_prop');
        }

        on_some_prop(val) {
            console.log('Property changed to', val);
        }
    }

    let ob = new MyObject();
    ob.some_prop = 'New Value';  // triggers on_some_prop

Properties only trigger on actual value changes — setting the same value twice
does not re-trigger the handler.


Property Types
~~~~~~~~~~~~~~

+--------------------+-------------------------------------------+
| Type               | Binds to                                  |
+====================+===========================================+
| ``Property``       | Plain value with change events            |
+--------------------+-------------------------------------------+
| ``BoundProperty``  | Base for context-bound properties         |
+--------------------+-------------------------------------------+
| ``CSSProperty``    | CSS style on context element              |
+--------------------+-------------------------------------------+
| ``AttrProperty``   | HTML attribute on context element         |
+--------------------+-------------------------------------------+
| ``TextProperty``   | Text content of context element           |
+--------------------+-------------------------------------------+
| ``DataProperty``   | Key on a plain data object                |
+--------------------+-------------------------------------------+
| ``InputProperty``  | ``<input>`` element value with validation |
+--------------------+-------------------------------------------+
| ``ButtonProperty`` | ``<button>`` element with click events    |
+--------------------+-------------------------------------------+
| ``SVGProperty``    | SVG element attribute                     |
+--------------------+-------------------------------------------+


Handler Convention
~~~~~~~~~~~~~~~~~~

When a property named ``foo`` changes, treibstoff calls:

1. ``instance.on_foo(val)`` — the default handler (if defined)
2. All subscribers bound via ``instance.on('on_foo', handler)``


CSS Property
~~~~~~~~~~~~

Syncs a property value to a CSS style on a DOM element:

.. code-block:: js

    import {HTMLWidget} from 'widget';
    import {CSSProperty} from 'properties';

    class Box extends HTMLWidget {
        constructor(opts) {
            super({parent: opts.parent, elem: opts.elem});
            // HTMLWidget already provides x, y, width, height as CSSProperties
            new CSSProperty(this, 'opacity', {val: 1});
            new CSSProperty(this, 'bg_color', {tgt: 'background-color', val: '#fff'});
        }
    }

    let box = new Box({parent: null, elem: $('#my-box')});
    box.opacity = 0.5;     // sets $(elem).css('opacity', 0.5)
    box.bg_color = 'red';  // sets $(elem).css('background-color', 'red')

Context element defaults to ``inst.elem``. Override with ``{ctx: otherElem}``.
Target name defaults to the property name. Override with
``{tgt: 'css-property-name'}``.


Attribute Property
~~~~~~~~~~~~~~~~~~

Syncs a property value to an HTML attribute:

.. code-block:: js

    import {Events} from 'events';
    import {AttrProperty} from 'properties';

    class Link extends Events {
        constructor(elem) {
            super();
            this.elem = elem;
            new AttrProperty(this, 'href', {val: '#'});
            new AttrProperty(this, 'aria_label', {tgt: 'aria-label'});
        }
    }

    let link = new Link($('<a>'));
    link.href = '/items/42';       // calls elem.attr('href', '/items/42')
    link.aria_label = 'View item'; // calls elem.attr('aria-label', 'View item')


Text Property
~~~~~~~~~~~~~

Syncs a property value to the text content of a DOM element:

.. code-block:: js

    import {Events} from 'events';
    import {TextProperty} from 'properties';

    class Label extends Events {
        constructor(elem) {
            super();
            this.elem = elem;
            new TextProperty(this, 'text', {val: 'Hello'});
        }
    }

    let label = new Label($('<span>'));
    label.text = 'World';  // calls elem.text('World')


Data Property
~~~~~~~~~~~~~

Syncs the property value to a plain data object. Useful for serialization:

.. code-block:: js

    import {Events} from 'events';
    import {DataProperty} from 'properties';

    class Node extends Events {
        constructor(data) {
            super();
            this.data = data;
            new DataProperty(this, 'x', {val: data.x});
            new DataProperty(this, 'y', {val: data.y});
        }
    }

    let node = new Node({x: 10, y: 20});
    node.x = 50;
    console.log(node.data.x);  // 50 — automatically synced

``DataProperty`` defaults to ``inst.data`` as its context. Ensure
``this.data`` exists before creating ``DataProperty`` instances.


Input Property
~~~~~~~~~~~~~~

Two-way binding with an ``<input>`` element. Listens for ``change`` events on
the input and updates the property. On set, updates the input's value:

.. code-block:: js

    import {Events} from 'events';
    import {InputProperty} from 'properties';

    class NameField extends Events {
        constructor(inputElem) {
            super();
            new InputProperty(this, 'name', {
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
    // User types 'Bob' and leaves the field → on_name('Bob') is called

With extraction/validation:

.. code-block:: js

    new InputProperty(this, 'age', {
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

``InputProperty`` listens for ``change`` events, not ``input`` events. The
handler fires when the user leaves the field or presses Enter, not on every
keystroke.


SVG Property
~~~~~~~~~~~~

Syncs a property value to an SVG attribute using ``setAttributeNS``:

.. code-block:: js

    import {Events} from 'events';
    import {SVGProperty} from 'properties';

    class Circle extends Events {
        constructor(svgElem) {
            super();
            this.elem = svgElem;
            new SVGProperty(this, 'cx', {val: 50});
            new SVGProperty(this, 'cy', {val: 50});
            new SVGProperty(this, 'r', {val: 25});
        }
    }

    let circle = new Circle(svgCircleElem);
    circle.r = 40;  // calls setAttributeNS(null, 'r', 40)


Button Property
~~~~~~~~~~~~~~~

Binds to a ``<button>`` element with click, mousedown, and mouseup events:

.. code-block:: js

    import {Events} from 'events';
    import {ButtonProperty} from 'properties';

    class Toolbar extends Events {
        constructor(btnElem) {
            super();
            new ButtonProperty(this, 'save', {
                ctx: btnElem,
                val: 'Save'
            });
        }

        on_save_click() {
            console.log('Save clicked');
        }
    }

Setting the value updates the button text: ``toolbar.save = 'Saving...'``.

Button event handler names follow the pattern ``on_{name}_click``,
``on_{name}_down``, ``on_{name}_up``.


Cascading Updates
~~~~~~~~~~~~~~~~~

Properties can trigger updates on other properties or child widgets:

.. code-block:: js

    class ResizableBox extends Events {
        constructor(data, label_elem) {
            super();
            this.data = data;
            this.label_elem = label_elem;
            this.min_width = 80;
            new DataProperty(this, 'w', {val: data.w});
        }

        on_w(val) {
            val = val < this.min_width ? this.min_width : val;
            this.label_elem.css('width', val + 'px');
        }
    }


BoundProperty Options
~~~~~~~~~~~~~~~~~~~~~

All bound properties (subclasses of ``BoundProperty``) accept these options:

+-----------+----------------+------------------------------------------------+
| Option    | Default        | Description                                    |
+===========+================+================================================+
| ``ctx``   | ``inst[ctxa]`` | Context element to bind to                     |
+-----------+----------------+------------------------------------------------+
| ``ctxa``  | ``'elem'``     | Attribute name on instance to get context from |
+-----------+----------------+------------------------------------------------+
| ``tgt``   | ``name``       | Target attribute/property name                 |
+-----------+----------------+------------------------------------------------+
| ``val``   | ``undefined``  | Initial value                                  |
+-----------+----------------+------------------------------------------------+

.. code-block:: js

    // Bind 'bg_color' property to CSS 'background-color' on a specific element
    new CSSProperty(this, 'bg_color', {
        ctx: this.header_elem,       // bind to specific element, not this.elem
        tgt: 'background-color',     // CSS property name differs from JS name
        val: '#f0f0f0'               // initial value
    });


Pitfalls
~~~~~~~~

- **The ``on_name`` handler is called via ``trigger()``.** The instance must
  extend ``Events`` for auto-handlers to work. Without it, the property
  still works as a getter/setter but doesn't fire events.

- **Properties only trigger on actual value changes.** Setting the same value
  twice does not re-trigger the handler.

- **BoundProperty context is lazily resolved.** If ``ctx`` is not passed in
  opts, it reads ``inst[ctxa]`` (default: ``inst.elem``). If ``inst.elem``
  doesn't exist yet at property creation time, the context is resolved on
  first access.

- **Property names become getter/setter pairs** via ``Object.defineProperty``.
  They cannot be deleted or redefined. Don't create two properties with the
  same name on the same instance.


API
---

.. js:autoclass:: Property
    :members:
        get,
        set,
        trigger

.. js:autoclass:: BoundProperty
    :members: name, val, ctx, tgt

.. js:autoclass:: CSSProperty

.. js:autoclass:: AttrProperty

.. js:autoclass:: TextProperty

.. js:autoclass:: DataProperty

.. js:autoclass:: InputProperty

.. js:autoclass:: ButtonProperty

.. js:autoclass:: SVGProperty
