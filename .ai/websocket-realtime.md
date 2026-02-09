# WebSocket Real-Time Communication

This guide explains how to use treibstoff's `Websocket` class for real-time
server communication.

## Context

Treibstoff provides a `Websocket` wrapper around the browser's native WebSocket
API with event-based message handling, automatic JSON parsing, heartbeat
filtering, and TLS-aware URI construction.

## Key API

| Class/Constant | Purpose |
|----------------|---------|
| `ts.Websocket` | WebSocket connection wrapper |
| `ts.WS_STATE_CONNECTING` | State: connecting (0) |
| `ts.WS_STATE_OPEN` | State: open (1) |
| `ts.WS_STATE_CLOSING` | State: closing (2) |
| `ts.WS_STATE_CLOSED` | State: closed (3) |

## Events

| Event | When | Arguments |
|-------|------|-----------|
| `on_open` | Connection opened | — |
| `on_close` | Connection closed | `CloseEvent` |
| `on_error` | Error occurred | — |
| `on_message` | JSON message received | Parsed data object |
| `on_raw_message` | Raw message received | `MessageEvent` |

## Pattern 1: Basic Connection

```javascript
import ts from 'treibstoff';

let ws = new ts.Websocket('/ws/notifications');

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
```

## Pattern 2: Send Messages

```javascript
// Send raw string
ws.send('ping');

// Send JSON data (automatically stringified)
ws.send_json({
    type: 'subscribe',
    channel: 'updates'
});
```

## Pattern 3: Subclass for Custom Protocol

```javascript
class NotificationSocket extends ts.Websocket {
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
                ts.show_info(data.message);
                break;
            case 'update':
                ts.ajax.trigger({
                    name: 'datachanged',
                    selector: data.selector,
                    target: data.target
                });
                break;
        }
    }

    on_close(evt) {
        console.log('Disconnected:', evt.code, evt.reason);
        if (evt.code !== 1000) {
            // Abnormal close — reconnect after delay
            ts.clock.schedule_timeout(() => this.open(), 5000);
        }
    }

    on_error() {
        ts.show_warning('Connection lost. Retrying...');
    }
}

let socket = new NotificationSocket();
socket.open();
```

## Pattern 4: Heartbeat

The default `on_raw_message` handler automatically filters heartbeat frames.
Messages with a `HEARTBEAT` property are ignored and not forwarded to
`on_message`.

**Server sends:** `{"HEARTBEAT": 1}`
**Result:** Silently dropped, `on_message` not triggered.

To handle heartbeats or change this behavior, override `on_raw_message`:

```javascript
class CustomSocket extends ts.Websocket {
    on_raw_message(evt) {
        let data = JSON.parse(evt.data);
        if (data.HEARTBEAT !== undefined) {
            // Custom heartbeat handling
            this.send_json({HEARTBEAT_ACK: 1});
            return;
        }
        this.trigger('on_message', data);
    }
}
```

## Pattern 5: Connection State

```javascript
let ws = new ts.Websocket('/ws/data');
ws.open();

// Check state
if (ws.state === ts.WS_STATE_OPEN) {
    ws.send_json({type: 'request', id: 42});
}

// Close cleanly
ws.close();  // sets sock to null, prevents further send

// Reopen (closes existing connection first)
ws.open();  // if already open, closes and reconnects
```

## Pattern 6: URI Construction

The WebSocket URI is automatically constructed from the current page location:

```javascript
let ws = new ts.Websocket('/ws/updates');

// On http://example.com → ws://example.com/ws/updates
// On https://example.com → wss://example.com/ws/updates
console.log(ws.uri);
```

## Complete Example: Live Dashboard

```javascript
import ts from 'treibstoff';

class LiveDashboard extends ts.Events {
    constructor(container) {
        super();
        this.container = container;
        this.ws = new ts.Websocket('/ws/dashboard');
        this.ws.on('on_open', this._on_connected.bind(this));
        this.ws.on('on_message', this._on_data.bind(this));
        this.ws.on('on_close', this._on_disconnected.bind(this));
    }

    connect() {
        this.ws.open();
    }

    disconnect() {
        this.ws.close();
    }

    subscribe(channel) {
        this.ws.send_json({action: 'subscribe', channel: channel});
    }

    _on_connected(inst) {
        this.subscribe('metrics');
        this.subscribe('alerts');
        this.trigger('on_connected');
    }

    _on_data(inst, data) {
        if (data.channel === 'metrics') {
            this._update_metrics(data.payload);
        } else if (data.channel === 'alerts') {
            ts.show_warning(data.payload.message);
        }
    }

    _on_disconnected(inst, evt) {
        this.trigger('on_disconnected');
        // Auto-reconnect after 3 seconds
        ts.clock.schedule_timeout(() => {
            this.connect();
        }, 3000);
    }

    _update_metrics(metrics) {
        // Update dashboard display
        for (let key in metrics) {
            $(`#metric-${key}`, this.container).text(metrics[key]);
        }
    }
}

let dashboard = new LiveDashboard($('#dashboard'));
dashboard.connect();
```

## Pitfalls

1. **`on_raw_message` parses JSON automatically.** If the server sends
   non-JSON data, override `on_raw_message` to handle it.

2. **`open()` closes any existing connection first.** Calling `open()` twice
   doesn't create two connections.

3. **`close()` sets `this.sock = null`.** After closing, `state` will throw
   because `this.sock` is null. Check `sock !== null` before reading `state`.

4. **`send()` and `send_json()` don't check connection state.** They throw
   if the socket is not open. Check `ws.state === ts.WS_STATE_OPEN` first.

5. **Default handlers (`on_open`, `on_close`, etc.) are empty no-ops** in the
   base class. Override them in subclasses or subscribe via `ws.on('on_open', fn)`.

6. **TLS detection** is based on `window.location.protocol`. Use `wss://` in
   production (HTTPS) and `ws://` in development (HTTP).
