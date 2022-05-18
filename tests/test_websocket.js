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
