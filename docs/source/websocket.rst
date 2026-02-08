Websocket
=========

Overview
--------

``Websocket`` is a wrapper around the native ``WebSocket`` API that integrates
with the treibstoff event system. It provides automatic protocol detection
(``ws://`` vs ``wss://``), heartbeat frame filtering, and event-based
message handling.

.. code-block:: js

    import {Websocket} from 'websocket';

    class AppSocket extends Websocket {

        on_open() {
            console.log('Connected');
        }

        on_message(data) {
            console.log('Received:', data);
        }

        on_close(evt) {
            console.log('Disconnected');
        }

        on_error() {
            console.log('Error');
        }
    }

    let ws = new AppSocket('/ws/updates');
    ws.open();

    // Send JSON data
    ws.send_json({action: 'subscribe', channel: 'updates'});

    // Listen for events externally
    ws.on('on_message', function(inst, data) {
        console.log('External handler:', data);
    });

Heartbeat frames (messages containing a ``HEARTBEAT`` key) are automatically
filtered and do not trigger the ``on_message`` event.

Connection State
~~~~~~~~~~~~~~~~

The connection state is available via ``ws.state``, which returns the
native ``WebSocket.readyState`` value:

- ``Websocket.CONNECTING`` (0)
- ``Websocket.OPEN`` (1)
- ``Websocket.CLOSING`` (2)
- ``Websocket.CLOSED`` (3)

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
