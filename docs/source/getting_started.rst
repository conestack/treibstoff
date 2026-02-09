Getting Started
===============

Installation
------------

Via npm:

.. code-block:: bash

    npm install treibstoff

Via pip (for Pyramid/Cone integration):

.. code-block:: bash

    pip install treibstoff

Import
------

Import from the main bundle:

.. code-block:: js

    import * as ts from 'treibstoff';

    ts.ajax.register(function(context) {
        // bind custom JavaScript
    }, true);

Or import individual modules:

.. code-block:: js

    import {Events} from 'treibstoff/src/events.js';
    import {Widget} from 'treibstoff/src/widget.js';
    import {compile_template} from 'treibstoff/src/parser.js';

First Widget
------------

.. code-block:: js

    import {Events} from 'events';
    import {compile_template} from 'parser';

    class Counter extends Events {

        constructor(container) {
            super();
            compile_template(this, `
              <div t-elem="elem">
                <span t-elem="display">0</span>
                <button t-prop="inc_btn" t-val="+"
                        t-bind-click="increment">+</button>
              </div>
            `, container);
            this.count = 0;
        }

        increment() {
            this.count++;
            $(this.display).text(this.count);
        }
    }

    new Counter($('body'));

First SSR Template
------------------

On the server, render HTML with ``ajax:`` attributes:

.. code-block:: html

    <a href="/details"
       ajax:bind="click"
       ajax:action="details:#content:inner"
       ajax:path="href">
        Show Details
    </a>

When clicked, treibstoff will:

1. Push ``/details`` to browser history
2. Request ``/details/ajaxaction`` from the server
3. Replace the inner HTML of ``#content`` with the response

See the :doc:`Ajax <ajax>` documentation for the full attribute reference.
