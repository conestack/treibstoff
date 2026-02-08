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

    import {show_info, show_warning, show_error} from 'overlay';

    show_info('Operation completed successfully.');
    show_warning('This action cannot be undone.');
    show_error('An error occurred.');

Dialogs
~~~~~~~

Display a confirmation dialog:

.. code-block:: js

    import {show_dialog} from 'overlay';

    show_dialog({
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this item?',
        on_confirm: function(inst) {
            console.log('Confirmed');
        }
    });

Custom Overlays
~~~~~~~~~~~~~~~

Create custom overlays with full control:

.. code-block:: js

    import {Overlay} from 'overlay';

    let ol = new Overlay({
        uid: 'my-overlay',
        title: 'Custom Overlay',
        content: '<p>Custom content</p>',
        css: 'modal-lg',
        on_open: function(inst) {
            console.log('Opened');
        },
        on_close: function(inst) {
            console.log('Closed');
        }
    });
    ol.open();

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
