Overlay
=======

Overview
--------

The overlay module provides Bootstrap-style modal dialogs with support for
stacking, event callbacks, and confirmation dialogs.


Messages
~~~~~~~~

Display messages in overlays with different flavors:

.. code-block:: js

    import {show_info, show_warning, show_error, show_message} from 'overlay';

    show_info('Operation completed successfully.');
    show_warning('This action cannot be undone.');
    show_error('An error occurred.');

    // Custom message with title and flavor
    show_message({
        title: 'Import Results',
        message: '<p>42 records imported.</p><p>3 skipped.</p>',
        flavor: 'info',
        css: 'modal-lg'    // optional Bootstrap size class
    });

Flavors: ``'info'``, ``'warning'``, ``'error'`` — applied as CSS class on the
modal.


Dialogs
~~~~~~~

Display a confirmation dialog with OK and Cancel buttons:

.. code-block:: js

    import {show_dialog} from 'overlay';

    show_dialog({
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this item?',
        on_confirm: function(inst) {
            console.log('Confirmed');
            delete_item(42);
        }
    });

OK triggers ``on_confirm`` and closes. Cancel just closes.


Custom Overlays
~~~~~~~~~~~~~~~

Create custom overlays with full control:

.. code-block:: js

    import {Overlay} from 'overlay';

    let ol = new Overlay({
        uid: 'my-overlay',           // optional, auto-generated if omitted
        title: 'Custom Overlay',
        content: '<p>Custom content</p>',
        flavor: 'info',
        css: 'modal-lg',
        container: $('#overlay-container'),  // defaults to $('body')
        on_open: function(inst) {
            console.log('Opened');
        },
        on_close: function(inst) {
            console.log('Closed');
        }
    });
    ol.open();

After ``open()``, the overlay properties are available:

- ``ol.wrapper`` — outermost wrapper element
- ``ol.backdrop`` — backdrop element
- ``ol.elem`` — modal element
- ``ol.body`` — modal body (for content updates)
- ``ol.footer`` — modal footer (for buttons)


Programmatic Content Update
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    let overlay = new Overlay({title: 'Loading...'});
    overlay.open();

    // Update body content
    overlay.body.html('<p>New content loaded</p>');

    // Add footer buttons via compile_template
    compile_template(overlay, `
        <button class="btn btn-primary"
                t-prop="save_btn" t-bind-click="on_save">Save</button>
    `, overlay.footer);

    overlay.on_save = function() {
        console.log('Save clicked');
        overlay.close();
    };


Stacked Overlays
~~~~~~~~~~~~~~~~

Overlays automatically stack with increasing z-index:

.. code-block:: js

    let first = new Overlay({title: 'First'});
    first.open();

    let second = new Overlay({title: 'Second'});
    second.open();
    // second appears above first (z-index is higher)

    second.close();
    // first is still visible
    first.close();


Ajax Overlays
~~~~~~~~~~~~~

Load content from the server into an overlay:

.. code-block:: js

    import ts from 'treibstoff';

    let overlay = ts.ajax.overlay({
        action: 'editform',
        target: 'http://example.com/items/42/edit',
        title: 'Edit Item',
        css: 'overlay-form',
        on_close: function(inst) {
            // Refresh the item list after edit
            ts.ajax.trigger({
                name: 'contextchanged',
                selector: '#item-list',
                target: '/items'
            });
        }
    });

Close by UID:

.. code-block:: js

    ts.ajax.overlay({close: true, uid: overlay.uid});


Lookup Open Overlay
~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    import {get_overlay} from 'overlay';

    let overlay = get_overlay('my-overlay');
    if (overlay) {
        overlay.body.html('<p>Updated content</p>');
    }

``get_overlay()`` returns ``null`` if the element doesn't exist or has no
overlay data.


Pitfalls
~~~~~~~~

- **Overlays use ``compile_template`` internally.** The overlay's ``wrapper``,
  ``backdrop``, ``elem``, ``body``, ``footer`` are all available as properties
  after construction.

- **``close()`` calls ``ajax_destroy`` on the wrapper** before removing it from
  the DOM. This properly cleans up any Ajax-bound widgets inside the overlay.

- **``show_message/info/warning/error`` auto-focus** the first button on open.

- **The ``body`` class ``modal-open``** is added when an overlay opens and
  removed when the last visible overlay closes. This prevents body scrolling.

- **Dialog's OK button handler** fires ``on_confirm`` after closing. Subscribe
  to ``on_confirm`` via the constructor options.

- **Overlay UIDs** can be specified or auto-generated. When using Ajax overlays,
  the UID is sent as ``ajax.overlay-uid`` parameter to the server.


API
---

.. js:autoclass:: Overlay
    :members:
        compile,
        open,
        close

.. js:autoclass:: Message

.. js:autoclass:: Dialog

|

.. js:autofunction:: get_overlay

|

.. js:autofunction:: show_message

|

.. js:autofunction:: show_info

|

.. js:autofunction:: show_warning

|

.. js:autofunction:: show_error

|

.. js:autofunction:: show_dialog
