Spinner
=======

Overview
--------

The loading spinner displays a Bootstrap spinner animation while operations
are in progress. It uses a reference counter so that multiple concurrent
operations can share the spinner without flickering.

.. code-block:: js

    import {spinner} from 'spinner';

    // Show the spinner (increments counter)
    spinner.show();

    // Hide the spinner (decrements counter, removes when 0)
    spinner.hide();

    // Force-close regardless of counter
    spinner.hide(true);

The spinner is provided as a singleton and is automatically managed by
``HTTPRequest`` during Ajax calls.

API
---

.. js:autoclass:: LoadingSpinner
    :members:
        show,
        hide
