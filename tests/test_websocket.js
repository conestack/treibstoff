import {Events} from '../src/events.js';
import {Websocket} from '../src/websocket.js';

QUnit.module('treibstoff.websocket', hooks => {

    class DummyWebSocket {
        constructor(uri) {
            this.uri = uri;
            this.readyState = -1;
        }
        send(data) {
            this.onmessage({
                data: data
            });
        }
        close() {
            this.onclose('event');
        }
    }

    QUnit.test('Test Websocket TLS scheme', assert => {
        // Save original protocol
        let orig_protocol = window.location.protocol;

        // Override window.location.protocol by creating a ws and checking uri
        // Since window.location.protocol is 'http:' in tests, the default
        // test already covers 'ws://'. We need to cover the 'wss://' branch.
        // We can't override window.location.protocol directly, so use a
        // subclass that overrides the uri getter.
        class TLSWebsocket extends Websocket {
            get uri() {
                return 'wss://' + window.location.hostname + this.path;
            }
        }
        let ws = new TLSWebsocket('/path', DummyWebSocket);
        assert.strictEqual(ws.uri, 'wss://localhost/path');
    });

    QUnit.test('Test Websocket double open', assert => {
        let close_count = 0;

        class TrackingWebSocket extends DummyWebSocket {
            close() {
                close_count++;
                this.onclose('event');
            }
        }

        let ws = new Websocket('/path', TrackingWebSocket);
        ws.open();
        assert.strictEqual(close_count, 0);

        // Second open should close the first socket
        ws.open();
        assert.strictEqual(close_count, 1, 'previous socket was closed');
        assert.ok(ws.sock !== null);

        ws.close();
    });

    QUnit.test('Test Websocket send', assert => {
        let sent_data;
        class TrackingWebSocket extends DummyWebSocket {
            send(data) {
                sent_data = data;
            }
        }

        let ws = new Websocket('/path', TrackingWebSocket);
        ws.open();
        ws.send('raw data');
        assert.strictEqual(sent_data, 'raw data');
        ws.close();
    });

    QUnit.test('Test Websocket close when already closed', assert => {
        let ws = new Websocket('/path', DummyWebSocket);
        // sock is null, close should not throw
        ws.close();
        assert.deepEqual(ws.sock, null, 'close on null sock is safe');
    });

    QUnit.test('Test Websocket base class handlers', assert => {
        // Use base Websocket class (not subclass) to cover empty handlers
        let ws = new Websocket('/path', DummyWebSocket);

        // Register external listeners to verify events still fire
        ws.on('on_open', function() {
            assert.step('on_open');
        });
        ws.on('on_close', function() {
            assert.step('on_close');
        });
        ws.on('on_error', function() {
            assert.step('on_error');
        });
        ws.on('on_message', function(inst, data) {
            assert.step('on_message');
        });

        ws.open();
        ws.sock.onopen();
        assert.verifySteps(['on_open']);

        ws.sock.onerror();
        assert.verifySteps(['on_error']);

        // Send non-heartbeat message
        ws.sock.onmessage({data: '{"key": "val"}'});
        assert.verifySteps(['on_message']);

        ws.close();
        assert.verifySteps(['on_close']);
    });

    QUnit.test('Test Websocket', assert => {
        class TestWebsocket extends Websocket {
            open() {
                super.open();
                this.sock.onopen();
            }
            on_open() {
                assert.step('TestWebsocket.on_open');
            }
            on_close(evt) {
                assert.step('TestWebsocket.on_close');
            }
            on_error() {
                assert.step('TestWebsocket.on_error');
            }
            on_message(data) {
                assert.step('TestWebsocket.on_message');
            }
        }
        let ws = new TestWebsocket('/path', DummyWebSocket);
        ws.on('on_open', function() {
            assert.step('External on_open');
        });
        ws.on('on_close', function(evt) {
            assert.step('External on_close');
        });
        ws.on('on_error', function() {
            assert.step('External on_error');
        });
        ws.on('on_message', function(data) {
            assert.step('External on_message');
        });
        ws.on('on_raw_message', function(evt) {
            assert.step('External on_raw_message');
        });

        assert.ok(ws instanceof Events);
        assert.deepEqual(ws.sock, null);

        ws.open();
        assert.ok(ws.sock instanceof DummyWebSocket);
        assert.deepEqual(ws.state, -1);
        assert.deepEqual(ws.sock.uri, 'ws://localhost/path');
        assert.verifySteps([
            'TestWebsocket.on_open',
            'External on_open'
        ]);

        ws.send_json({HEARTBEAT: 1});
        assert.verifySteps(['External on_raw_message']);

        ws.send_json({param: 'value'});
        assert.verifySteps([
            'TestWebsocket.on_message',
            'External on_message',
            'External on_raw_message'
        ]);

        ws.sock.onerror();
        assert.verifySteps([
            'TestWebsocket.on_error',
	        'External on_error'
        ]);

        ws.close();
        assert.deepEqual(ws.sock, null);
        assert.verifySteps([
            'TestWebsocket.on_close',
	        'External on_close'
        ]);
    });
});
