Parser
======

Overview
--------

The parser module provides a template system for declarative DOM and SVG
element creation. It walks a DOM tree and processes special ``t-*`` attributes
to bind elements and properties to a widget instance.

Template Attributes
~~~~~~~~~~~~~~~~~~~

- ``t-elem="name"`` — Assign the element to ``widget[name]``
- ``t-prop="name"`` — Create a bound property on the widget
- ``t-val="value"`` — Set the initial property value
- ``t-type="number"`` — Use a built-in value extractor
- ``t-extract="method"`` — Use a custom extractor method on the widget
- ``t-state-evt="event"`` — Custom event name for input state changes
- ``t-options='[["k","v"]]'`` — JSON array of ``[value, label]`` for selects
- ``t-bind-click="method"`` — Bind button click to a widget method
- ``t-bind-down="method"`` — Bind button mousedown to a widget method
- ``t-bind-up="method"`` — Bind button mouseup to a widget method

Usage
~~~~~

.. code-block:: js

    import {Events} from 'events';
    import {compile_template} from 'parser';

    class MyWidget extends Events {

        constructor() {
            super();
            compile_template(this, `
              <div t-elem="elem">
                <input type="text" t-prop="name" t-elem="name_input"
                       t-val="default" />
                <button t-prop="save_btn" t-val="Save"
                        t-bind-click="on_save">Save</button>
              </div>
            `);
        }

        on_save() {
            console.log('Save clicked, name is:', this.name);
        }
    }

For SVG templates, use ``compile_svg``:

.. code-block:: js

    import {compile_svg} from 'parser';
    import {create_svg_elem} from 'utils';

    let container = create_svg_elem('svg', {});
    let widget = {};
    compile_svg(widget, `
      <g t-elem="group">
        <rect t-elem="rect" width="100" height="50" />
      </g>
    `, container);

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
