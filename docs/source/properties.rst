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

Property Types
~~~~~~~~~~~~~~

+-------------------+-------------------------------------------+
| Type              | Binds to                                  |
+===================+===========================================+
| ``Property``      | Plain value with change events            |
+-------------------+-------------------------------------------+
| ``BoundProperty`` | Base for context-bound properties          |
+-------------------+-------------------------------------------+
| ``CSSProperty``   | CSS style on context element              |
+-------------------+-------------------------------------------+
| ``AttrProperty``  | HTML attribute on context element          |
+-------------------+-------------------------------------------+
| ``TextProperty``  | Text content of context element            |
+-------------------+-------------------------------------------+
| ``DataProperty``  | Key on a plain data object                 |
+-------------------+-------------------------------------------+
| ``InputProperty`` | ``<input>`` element value with validation  |
+-------------------+-------------------------------------------+
| ``ButtonProperty``| ``<button>`` element with click events     |
+-------------------+-------------------------------------------+
| ``SVGProperty``   | SVG element attribute                      |
+-------------------+-------------------------------------------+

Handler Convention
~~~~~~~~~~~~~~~~~~

When a property named ``foo`` changes, treibstoff calls:

1. ``instance.on_foo(val)`` — the default handler (if defined)
2. All subscribers bound via ``instance.on('on_foo', handler)``

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
