Parser
======

Overview
--------

The parser module provides a template system for declarative DOM and SVG
element creation. It walks a DOM tree and processes special ``t-*`` attributes
to bind elements and properties to a widget instance.


Template Attributes
~~~~~~~~~~~~~~~~~~~

+-------------------+-------------------------------------------+---------------------------------------+
| Attribute         | Applies To                                | Purpose                               |
+===================+===========================================+=======================================+
| ``t-elem``        | Any element                               | Assign element to ``widget[name]``    |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-prop``        | ``<input>``, ``<select>``, ``<button>``   | Create a bound property               |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-val``         | With ``t-prop``                           | Initial property value                |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-type``        | With ``t-prop`` on ``<input>``            | Value extractor type (``"number"``)   |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-extract``     | With ``t-prop`` on ``<input>``            | Custom extractor method name          |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-state-evt``   | With ``t-prop`` on ``<input>``            | Custom state event name               |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-options``     | ``<select>``                              | JSON array of ``[value, label]``      |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-bind-click``  | ``<button>``                              | Widget method to call on click        |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-bind-down``   | ``<button>``                              | Widget method to call on mousedown    |
+-------------------+-------------------------------------------+---------------------------------------+
| ``t-bind-up``     | ``<button>``                              | Widget method to call on mouseup      |
+-------------------+-------------------------------------------+---------------------------------------+


Element References
~~~~~~~~~~~~~~~~~~

``t-elem`` assigns elements to widget properties:

.. code-block:: js

    import {Events} from 'events';
    import {compile_template} from 'parser';

    class Panel extends Events {
        constructor(container) {
            super();
            compile_template(this, `
                <div class="panel" t-elem="panel">
                    <div class="header" t-elem="header">
                        <h3 t-elem="title">Title</h3>
                    </div>
                    <div class="body" t-elem="body"></div>
                </div>
            `, container);

            // After compilation:
            // this.panel  → jQuery wrapped <div class="panel">
            // this.header → jQuery wrapped <div class="header">
            // this.title  → jQuery wrapped <h3>
            // this.body   → jQuery wrapped <div class="body">
        }
    }


Input Property Binding
~~~~~~~~~~~~~~~~~~~~~~

``t-prop`` on input elements creates an ``InputProperty`` with two-way binding:

.. code-block:: js

    class SettingsWidget extends Events {
        constructor(container) {
            super();
            compile_template(this, `
                <div class="settings">
                    <label>Name</label>
                    <input t-elem="name_input" t-prop="name" t-val="Default">

                    <label>Count</label>
                    <input t-elem="count_input" t-prop="count"
                           t-type="number" t-val="10">
                </div>
            `, container);

            // this.name → InputProperty bound to the input
            // this.count → InputProperty with number extraction
        }

        on_name(val) {
            console.log('Name changed to:', val);
        }

        on_count(val) {
            console.log('Count changed to:', val);  // val is a number
        }
    }


Custom Value Extraction
~~~~~~~~~~~~~~~~~~~~~~~

``t-extract`` references a method name on the widget for custom validation:

.. code-block:: js

    class RangeWidget extends Events {
        constructor(container) {
            super();
            compile_template(this, `
                <div>
                    <input t-prop="percentage"
                           t-extract="extract_percentage" t-val="50">
                </div>
            `, container);
        }

        extract_percentage(val) {
            let num = parseFloat(val);
            if (isNaN(num)) throw 'Must be a number';
            if (num < 0 || num > 100) throw 'Must be between 0 and 100';
            return num;
        }

        on_percentage(val) {
            console.log('Percentage:', val);
        }
    }

When extraction fails, the ``InputProperty``'s ``error`` flag is set to
``true`` and ``msg`` contains the error message.


Select with Options
~~~~~~~~~~~~~~~~~~~

``t-options`` populates a ``<select>`` element from a JSON array of
``[value, label]`` pairs:

.. code-block:: js

    class FilterWidget extends Events {
        constructor(container) {
            super();
            compile_template(this, `
                <div>
                    <select t-elem="status_select" t-prop="status" t-val="active"
                            t-options='[["all","All"],["active","Active"],["archived","Archived"]]'>
                    </select>
                </div>
            `, container);
        }

        on_status(val) {
            console.log('Filter changed to:', val);
        }
    }

``t-options`` must be valid JSON. Use single quotes for the attribute and
double quotes inside the JSON.


Button Event Binding
~~~~~~~~~~~~~~~~~~~~

``t-bind-click``, ``t-bind-down``, ``t-bind-up`` bind button interactions to
widget methods:

.. code-block:: js

    class Toolbar extends Events {
        constructor(container) {
            super();
            compile_template(this, `
                <div class="toolbar">
                    <button t-prop="save_btn" t-val="Save"
                            t-bind-click="handle_save">
                    </button>
                    <button t-prop="cancel_btn" t-val="Cancel"
                            t-bind-click="handle_cancel">
                    </button>
                </div>
            `, container);
        }

        handle_save() {
            console.log('Save clicked');
        }

        handle_cancel() {
            console.log('Cancel clicked');
        }
    }

    let toolbar = new Toolbar($('#container'));
    toolbar.save_btn = 'Saving...';  // updates button text


SVG Templates
~~~~~~~~~~~~~

For SVG templates, use ``compile_svg``. Only ``t-elem`` is supported —
no ``t-prop``, ``t-val``, etc.:

.. code-block:: js

    import {compile_svg} from 'parser';

    class Icon extends Widget {
        constructor(opts) {
            super({parent: opts.parent});
            this.ctx = this.acquire(SVGContext);

            compile_svg(this, `
                <g t-elem="group">
                    <rect t-elem="bg" width="24" height="24" fill="none"/>
                    <path t-elem="icon" d="M4 4L20 20" stroke="currentColor"/>
                </g>
            `, this.ctx.elem);

            // this.group → raw SVG <g> element
            // this.bg → raw SVG <rect> element
            // this.icon → raw SVG <path> element
        }
    }

``compile_svg`` returns raw SVG DOM elements (not jQuery-wrapped).


Dynamic Values
~~~~~~~~~~~~~~

Template strings are standard JavaScript template literals — use ``${}`` for
dynamic values:

.. code-block:: js

    class UserCard extends Events {
        constructor(container, user) {
            super();
            compile_template(this, `
                <div class="card" t-elem="card">
                    <h4 t-elem="name_elem">${user.name}</h4>
                    <input t-prop="nickname" t-val="${user.nickname || ''}">
                </div>
            `, container);
        }
    }


Appending to Containers
~~~~~~~~~~~~~~~~~~~~~~~

The third argument to ``compile_template`` is optional. If provided, the
compiled element is appended to it:

.. code-block:: js

    // Append to existing container
    compile_template(this, '<div t-elem="item">...</div>', this.list);

    // Without container — compile only, append manually later
    let elem = compile_template(this, '<div t-elem="item">...</div>');
    this.list.prepend(elem);  // insert at beginning

``compile_template`` returns the jQuery-wrapped root element.


Pitfalls
~~~~~~~~

- **``t-prop`` without ``t-elem``** still works — the property is created but
  the element reference is not stored on the widget.

- **``t-type="number"``** uses ``extract_number`` which throws if the value is
  ``NaN``. The ``InputProperty`` catches the error and sets its ``error`` flag.

- **``compile_template`` wraps nodes with jQuery.** ``compile_svg`` does not —
  SVG elements are raw DOM nodes.

- **The parser walks depth-first.** Child elements are parsed before their
  parents. ``t-elem`` references on children are available by the time the
  parent is parsed.

- **``t-extract`` references a method name on the widget**, not a function.
  Ensure the method exists at template compilation time.

- **Button ``t-val``** sets the initial button text (via ``ButtonProperty``
  which calls ``ctx.text(val)``).


API
---

.. js:autoclass:: Parser
    :members:
        walk,
        parse,
        node_attrs

.. js:autoclass:: TemplateParser
    :members:
        wrap_node,
        handle_elem_attr

.. js:autoclass:: HTMLParser
    :members:
        handle_input,
        handle_select,
        handle_button

.. js:autoclass:: SVGParser

|

.. js:autofunction:: compile_template

|

.. js:autofunction:: compile_svg

|

.. js:autofunction:: extract_number
