Request
=======

Overview
--------

The request module provides HTTP request handling with automatic spinner
integration, JSON response parsing, and redirect detection.


Basic GET Request
~~~~~~~~~~~~~~~~~

.. code-block:: js

    import {http_request} from 'request';

    http_request({
        url: '/api/items',
        type: 'json',
        success: function(data, status, request) {
            console.log('Items:', data);
        }
    });

**Defaults:**

- ``type``: ``'html'``
- ``method``: ``'GET'``
- ``cache``: ``false``
- Spinner is shown during request
- On error: ``show_error()`` with status code


POST Request
~~~~~~~~~~~~

.. code-block:: js

    http_request({
        url: '/api/items/42',
        method: 'POST',
        type: 'json',
        params: {
            title: 'Updated Title',
            status: 'active'
        },
        success: function(data, status, request) {
            console.log('Updated:', data);
        }
    });


URL with Query Parameters
~~~~~~~~~~~~~~~~~~~~~~~~~

Query parameters in the URL are automatically parsed and merged with
``params``. If the same key exists in both, ``params`` takes precedence:

.. code-block:: js

    http_request({
        url: '/api/items?page=1&size=10',
        type: 'json',
        params: {
            size: 25    // overrides size=10 from URL
        },
        success: function(data) {
            // request sent to /api/items with params: {page: '1', size: 25}
        }
    });


Custom Error Handling
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    http_request({
        url: '/api/items/42',
        type: 'json',
        success: function(data) {
            console.log('OK:', data);
        },
        error: function(request, status, error) {
            if (status === 404) {
                console.log('Item not found');
            } else {
                show_error(`Request failed: ${status} ${error}`);
            }
        }
    });

**Default error behavior:**

- HTTP 403 → Redirect to ``/login``
- Other errors → ``show_error()`` with status and message
- Request abort (status 0) → Silently ignored


Without Spinner
~~~~~~~~~~~~~~~

.. code-block:: js

    http_request({
        url: '/api/heartbeat',
        type: 'json',
        spinner: null,   // disable spinner
        success: function(data) {
            // background request without UI feedback
        }
    });


Custom 403 Redirect
~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    http_request({
        url: '/api/admin/settings',
        type: 'json',
        default_403: '/unauthorized',  // custom redirect path
        success: function(data) {
            console.log('Settings:', data);
        }
    });


Using HTTPRequest Directly
~~~~~~~~~~~~~~~~~~~~~~~~~~

For multiple requests sharing the same configuration:

.. code-block:: js

    import {HTTPRequest} from 'request';
    import {spinner} from 'spinner';

    let request = new HTTPRequest({
        spinner: spinner,
        default_403: '/login'
    });

    request.execute({
        url: '/api/items',
        type: 'json',
        success: function(data) {
            console.log(data);
        }
    });


Spinner Management
~~~~~~~~~~~~~~~~~~

The spinner tracks a display count — multiple concurrent requests are handled
properly:

.. code-block:: js

    import {spinner} from 'spinner';

    spinner.show();   // count: 1 → spinner appears
    spinner.show();   // count: 2 → still showing
    spinner.hide();   // count: 1 → still showing
    spinner.hide();   // count: 0 → spinner disappears

    // Force hide (resets count)
    spinner.hide(true);  // count: 0, spinner removed immediately


Pitfalls
~~~~~~~~

- **Query parameters in the URL are parsed automatically.** Don't manually
  parse them — pass the full URL with query string and use ``params`` for
  additional/overriding parameters.

- **The spinner is shown/hidden automatically** for every request. If you
  don't want it, pass ``spinner: null``.

- **Error handler receives ``(request, status, error)``** where ``status``
  is the numeric HTTP status code.

- **Requests with status 0 (aborted) are silently ignored** — the error
  callback is not called and the spinner is force-hidden.

- **``http_request`` creates a new ``HTTPRequest`` instance per call.** For
  shared configuration, instantiate ``HTTPRequest`` directly.

- **Caching is disabled by default** (``cache: false``). Set ``cache: true``
  for cacheable GET requests.


API
---

.. js:autoclass:: HTTPRequest
    :members:
        execute,
        redirect,
        show_spinner,
        hide_spinner

|

.. js:autofunction:: http_request
