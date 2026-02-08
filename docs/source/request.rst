Request
=======

Overview
--------

The request module provides HTTP request handling with automatic spinner
integration, JSON response parsing, and redirect detection.

.. code-block:: js

    import {http_request} from 'request';

    http_request({
        url: '/api/data',
        type: 'json',
        params: {page: 1},
        success: function(data, status, request) {
            console.log('Received:', data);
        },
        error: function(request, status, error) {
            console.error('Request failed:', error);
        }
    });

The loading spinner is shown automatically during requests and hidden
when they complete.

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
