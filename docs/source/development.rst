Development
===========

Treibstoff contains a set of shell scripts to ease setup of development
environment, running tests, building docs and do deployment.

All scripts must be executed from the repository root.

Install development environment:

.. code-block:: sh

    make install

Cleanup development environment:

.. code-block:: sh

    make clean

Run tests:

.. code-block:: sh

    make wtr

To view coverage report, open in browser::

    coverage/lcov-report/index.html

Create Javascript bundles:

.. code-block:: sh

    make rollup

Automatically build JS bundles while development:

.. code-block:: sh

    ./scripts/watch.sh

Create NPM package:

.. code-block:: sh

    ./scripts/pack.sh

Create Python package:

.. code-block:: sh

    ./scripts/wheel.sh

Build documentation:

.. code-block:: sh

    make docs


Writing Tests
-------------

Treibstoff uses `QUnit <https://qunitjs.com/>`_ as its test framework, run via
`Web Test Runner <https://modern-web.dev/docs/test-runner/overview/>`_
(``make wtr``). Tests are in the ``tests/`` directory.


Test File Structure
~~~~~~~~~~~~~~~~~~~

Each test file imports from the corresponding source module and uses
``QUnit.module`` / ``QUnit.test``:

.. code-block:: js

    // tests/test_mymodule.js
    import {MyClass, myFunction} from '../src/mymodule.js';

    QUnit.module('treibstoff.mymodule', hooks => {

        QUnit.test('Test MyClass constructor', assert => {
            let instance = new MyClass();
            assert.ok(instance, 'Instance created');
            assert.strictEqual(instance.value, 0, 'Default value is 0');
        });
    });


DOM Fixtures
~~~~~~~~~~~~

Create DOM elements inline for testing:

.. code-block:: js

    import $ from 'jquery';

    QUnit.test('Test widget with DOM element', assert => {
        let elem = $('<div class="test-widget"><span>Hello</span></div>');
        $('body').append(elem);

        // ... test with elem ...

        elem.remove();  // cleanup
    });


Testing Events
~~~~~~~~~~~~~~

.. code-block:: js

    import {Events} from '../src/events.js';

    QUnit.test('Test event subscription and trigger', assert => {
        let ob = new Events();
        let result = null;

        ob.on('my_event', function(inst, data) {
            result = data;
        });

        ob.trigger('my_event', 'hello');
        assert.strictEqual(result, 'hello', 'Subscriber received data');
    });


Testing Properties
~~~~~~~~~~~~~~~~~~

.. code-block:: js

    import {Property} from '../src/properties.js';
    import {Events} from '../src/events.js';

    QUnit.test('Test Property triggers on_name', assert => {
        let ob = new Events();
        let triggered_val = null;

        ob.on_count = function(val) {
            triggered_val = val;
        };

        new Property(ob, 'count', 0);
        assert.strictEqual(triggered_val, 0, 'Initial value triggers handler');

        ob.count = 5;
        assert.strictEqual(triggered_val, 5, 'Set triggers handler');

        ob.count = 5;
        assert.strictEqual(triggered_val, 5, 'Same value does not re-trigger');
    });


Mocking WebSocket
~~~~~~~~~~~~~~~~~

Mock WebSocket by passing a factory to the ``Websocket`` constructor's second
argument:

.. code-block:: js

    import {Websocket} from '../src/websocket.js';

    class MockWebSocket {
        constructor(url) {
            this.url = url;
            this.readyState = 1;  // OPEN
            this.sent = [];
        }
        send(data) { this.sent.push(data); }
        close() { this.readyState = 3; }
    }

    QUnit.test('Test Websocket send_json', assert => {
        let ws = new Websocket('/ws/test', MockWebSocket);
        ws.open();

        ws.send_json({type: 'ping'});
        assert.strictEqual(
            ws.sock.sent[0],
            '{"type":"ping"}',
            'JSON stringified and sent'
        );
    });


Async Tests
~~~~~~~~~~~

.. code-block:: js

    QUnit.test('Test async operation', assert => {
        let done = assert.async();

        let ws = new Websocket('/ws/test', MockWebSocket);
        ws.on('on_open', function() {
            assert.ok(true, 'Open event fired');
            done();
        });

        ws.open();
        ws.sock.onopen();
    });


Assertion Methods
~~~~~~~~~~~~~~~~~

+------------------------------------+-----------------------------+
| Method                             | Purpose                     |
+====================================+=============================+
| ``assert.ok(value, msg)``          | Value is truthy             |
+------------------------------------+-----------------------------+
| ``assert.notOk(value, msg)``       | Value is falsy              |
+------------------------------------+-----------------------------+
| ``assert.strictEqual(a, b, msg)``  | ``===`` comparison          |
+------------------------------------+-----------------------------+
| ``assert.deepEqual(a, b, msg)``    | Deep equality               |
+------------------------------------+-----------------------------+
| ``assert.throws(fn, msg)``         | Function throws             |
+------------------------------------+-----------------------------+
| ``assert.async()``                 | Returns ``done`` callback   |
+------------------------------------+-----------------------------+


Test Organization
~~~~~~~~~~~~~~~~~

- One test file per source module: ``test_events.js`` tests ``src/events.js``
- Group related tests with ``QUnit.module('treibstoff.modulename')``
- Descriptive test names: ``'Test ClassName.methodName with edge case'``
- Clean up DOM elements after each test
- Restore any mocks/stubs to originals


Test Pitfalls
~~~~~~~~~~~~~

- **Always clean up DOM elements** added during tests. Leftover elements
  can affect subsequent tests.

- **``assert.async()`` must be called before any async operations.** The
  returned ``done`` function must be called exactly once.

- **The Ajax singleton (``ajax``) persists between tests.** Binder callbacks
  registered in one test will fire in subsequent tests.

- **jQuery events on ``$(document)`` persist.** Unbind them in test cleanup
  to avoid interference.

- **``compile_template`` returns jQuery-wrapped elements.**
  ``compile_svg`` returns raw SVG DOM elements.
