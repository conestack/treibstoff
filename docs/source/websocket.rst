Websocket
=========

Overview
--------

``Websocket`` is a wrapper around the native ``WebSocket`` API that integrates
with the treibstoff event system. It provides automatic protocol detection
(``ws://`` vs ``wss://``), heartbeat frame filtering, and event-based
message handling.


Basic Connection
~~~~~~~~~~~~~~~~

.. code-block:: js

    import {Websocket} from 'websocket';

    let ws = new Websocket('/ws/notifications');

    ws.on('on_open', function(inst) {
        console.log('Connected');
    });

    ws.on('on_message', function(inst, data) {
        // data is already parsed from JSON
        console.log('Received:', data);
    });

    ws.on('on_close', function(inst, evt) {
        console.log('Disconnected, code:', evt.code);
    });

    ws.on('on_error', function(inst) {
        console.log('WebSocket error');
    });

    ws.open();


Sending Messages
~~~~~~~~~~~~~~~~

.. code-block:: js

    // Send raw string
    ws.send('ping');

    // Send JSON data (automatically stringified)
    ws.send_json({
        type: 'subscribe',
        channel: 'updates'
    });


Subclass for Custom Protocol
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    import {Websocket} from 'websocket';
    import {ajax} from 'ssr/ajax';
    import {show_info, show_warning} from 'overlay';

    class NotificationSocket extends Websocket {
        constructor() {
            super('/ws/notifications');
        }

        on_open() {
            console.log('Notification socket connected');
            this.send_json({type: 'auth', token: getAuthToken()});
        }

        on_message(data) {
            switch (data.type) {
                case 'notification':
                    show_info(data.message);
                    break;
                case 'update':
                    ajax.trigger({
                        name: 'datachanged',
                        selector: data.selector,
                        target: data.target
                    });
                    break;
            }
        }

        on_close(evt) {
            if (evt.code !== 1000) {
                // Abnormal close — reconnect after delay
                setTimeout(() => this.open(), 5000);
            }
        }

        on_error() {
            show_warning('Connection lost. Retrying...');
        }
    }

    let socket = new NotificationSocket();
    socket.open();


Heartbeat Filtering
~~~~~~~~~~~~~~~~~~~

The default ``on_raw_message`` handler automatically filters heartbeat frames.
Messages with a ``HEARTBEAT`` property are ignored and not forwarded to
``on_message``.

**Server sends:** ``{"HEARTBEAT": 1}``
**Result:** Silently dropped, ``on_message`` not triggered.

To handle heartbeats or change this behavior, override ``on_raw_message``:

.. code-block:: js

    class CustomSocket extends Websocket {
        on_raw_message(evt) {
            let data = JSON.parse(evt.data);
            if (data.HEARTBEAT !== undefined) {
                this.send_json({HEARTBEAT_ACK: 1});
                return;
            }
            this.trigger('on_message', data);
        }
    }


Connection State
~~~~~~~~~~~~~~~~

The connection state is available via ``ws.state``, which returns the
native ``WebSocket.readyState`` value:

- ``WS_STATE_CONNECTING`` (0)
- ``WS_STATE_OPEN`` (1)
- ``WS_STATE_CLOSING`` (2)
- ``WS_STATE_CLOSED`` (3)

.. code-block:: js

    if (ws.state === WS_STATE_OPEN) {
        ws.send_json({type: 'request', id: 42});
    }

    // Close cleanly
    ws.close();  // sets sock to null

    // Reopen (closes existing connection first)
    ws.open();


URI Construction
~~~~~~~~~~~~~~~~

The WebSocket URI is automatically constructed from the current page location:

.. code-block:: js

    let ws = new Websocket('/ws/updates');

    // On http://example.com → ws://example.com/ws/updates
    // On https://example.com → wss://example.com/ws/updates


Events
~~~~~~

+-------------------+------------------------+---------------------+
| Event             | When                   | Arguments           |
+===================+========================+=====================+
| ``on_open``       | Connection opened      | —                   |
+-------------------+------------------------+---------------------+
| ``on_close``      | Connection closed      | ``CloseEvent``      |
+-------------------+------------------------+---------------------+
| ``on_error``      | Error occurred         | —                   |
+-------------------+------------------------+---------------------+
| ``on_message``    | JSON message received  | Parsed data object  |
+-------------------+------------------------+---------------------+
| ``on_raw_message``| Raw message received   | ``MessageEvent``    |
+-------------------+------------------------+---------------------+


Pitfalls
~~~~~~~~

- **``on_raw_message`` parses JSON automatically.** If the server sends
  non-JSON data, override ``on_raw_message`` to handle it.

- **``open()`` closes any existing connection first.** Calling ``open()``
  twice doesn't create two connections.

- **``close()`` sets ``this.sock = null``.** After closing, ``state`` will
  throw because ``this.sock`` is null. Check ``sock !== null`` before reading
  ``state``.

- **``send()`` and ``send_json()`` don't check connection state.** They throw
  if the socket is not open. Check ``ws.state === WS_STATE_OPEN`` first.

- **Default handlers (``on_open``, ``on_close``, etc.) are empty no-ops** in
  the base class. Override them in subclasses or subscribe via
  ``ws.on('on_open', fn)``.

- **TLS detection** is based on ``window.location.protocol``. Use ``wss://``
  in production (HTTPS) and ``ws://`` in development (HTTP).


API
---

.. js:autoclass:: Websocket
    :members:
        open,
        close,
        send,
        send_json,
        on_open,
        on_close,
        on_error,
        on_message
