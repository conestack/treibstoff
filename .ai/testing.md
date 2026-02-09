# Writing Tests for Treibstoff

This guide explains how to write QUnit tests for treibstoff code.

## Context

Treibstoff uses [QUnit](https://qunitjs.com/) as its test framework, run via
[Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) (`make wtr`).
Tests are in the `tests/` directory. Coverage reports are generated at
`coverage/lcov-report/`.

## Run Command

```bash
make wtr                    # Run all tests with coverage
```

## Test File Structure

Each test file imports from the corresponding source module and uses
`QUnit.module` / `QUnit.test`:

```javascript
// tests/test_mymodule.js
import {MyClass, myFunction} from '../src/mymodule.js';

QUnit.module('treibstoff.mymodule', hooks => {

    QUnit.test('Test MyClass constructor', assert => {
        let instance = new MyClass();
        assert.ok(instance, 'Instance created');
        assert.strictEqual(instance.value, 0, 'Default value is 0');
    });

    QUnit.test('Test myFunction', assert => {
        let result = myFunction('input');
        assert.strictEqual(result, 'expected', 'Returns expected value');
    });
});
```

## Key Patterns

### Pattern 1: DOM Fixtures

Create DOM elements inline for testing:

```javascript
import $ from 'jquery';

QUnit.test('Test widget with DOM element', assert => {
    let elem = $('<div class="test-widget"><span>Hello</span></div>');
    $('body').append(elem);

    // ... test with elem ...

    elem.remove();  // cleanup
});
```

### Pattern 2: Testing Events

```javascript
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
```

### Pattern 3: Testing Properties

```javascript
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
```

### Pattern 4: Testing Widgets

```javascript
import $ from 'jquery';
import {Widget} from '../src/widget.js';

QUnit.test('Test Widget hierarchy', assert => {
    let parent = new Widget({parent: null});
    let child = new Widget({parent: parent});

    assert.strictEqual(child.parent, parent, 'Child has parent');

    parent.add_widget(child);
    assert.ok(parent.children.includes(child), 'Parent contains child');

    parent.remove_widget(child);
    assert.strictEqual(child.parent, null, 'Child parent set to null');
    assert.notOk(parent.children.includes(child), 'Child removed from parent');
});
```

### Pattern 5: Testing Motion

```javascript
import $ from 'jquery';
import {Motion} from '../src/motion.js';

QUnit.test('Test Motion lifecycle', assert => {
    let elem = $('<div>');
    $('body').append(elem);

    let motion = new Motion();
    let events = [];

    motion.on('down', () => events.push('down'));
    motion.on('move', () => events.push('move'));
    motion.on('up', () => events.push('up'));

    motion.set_scope(elem, elem);

    elem.trigger($.Event('mousedown', {pageX: 10, pageY: 10}));
    assert.deepEqual(events, ['down'], 'down triggered');

    elem.trigger($.Event('mousemove', {pageX: 20, pageY: 20}));
    assert.deepEqual(events, ['down', 'move'], 'move triggered');

    $(document).trigger($.Event('mouseup', {pageX: 20, pageY: 20}));
    assert.deepEqual(events, ['down', 'move', 'up'], 'up triggered');

    elem.remove();
});
```

### Pattern 6: Mocking XMLHttpRequest

```javascript
QUnit.test('Test load_svg', assert => {
    let done = assert.async();

    // Save original
    let orig_get = $.get;

    // Mock $.get
    $.get = function(url, callback, type) {
        let xml = new DOMParser().parseFromString(
            '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
            'text/xml'
        );
        callback(xml);
    };

    load_svg('/test.svg', function(svg) {
        assert.ok(svg.length, 'SVG element returned');
        $.get = orig_get;  // restore
        done();
    });
});
```

### Pattern 7: Mocking WebSocket

```javascript
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
```

### Pattern 8: Testing Ajax Operations

```javascript
import $ from 'jquery';
import {ajax} from '../src/ssr/ajax.js';

QUnit.test('Test ajax.register and bind', assert => {
    let called = false;
    let context_received = null;

    ajax.register(function(context) {
        called = true;
        context_received = context;
    }, false);  // false = don't execute immediately

    let elem = $('<div>');
    ajax.bind(elem);

    assert.ok(called, 'Binder callback was called');
    assert.ok(context_received, 'Context was passed to binder');
});
```

### Pattern 9: Testing with compile_template

```javascript
import $ from 'jquery';
import {Events} from '../src/events.js';
import {compile_template} from '../src/parser.js';

QUnit.test('Test compile_template with t-elem', assert => {
    let widget = new Events();
    let container = $('<div>');

    compile_template(widget, `
        <div t-elem="wrapper">
            <span t-elem="label">Hello</span>
        </div>
    `, container);

    assert.ok(widget.wrapper, 'wrapper element assigned');
    assert.ok(widget.label, 'label element assigned');
    assert.strictEqual(widget.label.text(), 'Hello', 'label has correct text');
});
```

### Pattern 10: Async Tests

```javascript
QUnit.test('Test async operation', assert => {
    let done = assert.async();

    // Setup
    let ws = new Websocket('/ws/test', MockWebSocket);
    ws.on('on_open', function() {
        assert.ok(true, 'Open event fired');
        done();
    });

    ws.open();
    // Simulate server open
    ws.sock.onopen();
});
```

## Assertion Methods

| Method | Purpose |
|--------|---------|
| `assert.ok(value, msg)` | Value is truthy |
| `assert.notOk(value, msg)` | Value is falsy |
| `assert.strictEqual(actual, expected, msg)` | `===` comparison |
| `assert.deepEqual(actual, expected, msg)` | Deep equality |
| `assert.throws(fn, msg)` | Function throws |
| `assert.async()` | Returns `done` callback for async tests |

## Test Organization

- One test file per source module: `test_events.js` → `src/events.js`
- Group related tests with `QUnit.module('treibstoff.modulename')`
- Descriptive test names: `'Test ClassName.methodName with edge case'`
- Clean up DOM elements after each test
- Restore any mocks/stubs to originals

## Complete Example

```javascript
import $ from 'jquery';
import {Overlay, show_dialog, get_overlay} from '../src/overlay.js';

QUnit.module('treibstoff.overlay', hooks => {

    QUnit.test('Test Overlay constructor', assert => {
        let ol = new Overlay({title: 'Test'});
        assert.ok(ol.uid, 'UID generated');
        assert.strictEqual(ol.title, 'Test', 'Title set');
        assert.strictEqual(ol.is_open, false, 'Initially closed');
    });

    QUnit.test('Test Overlay open and close', assert => {
        let opened = false, closed = false;
        let ol = new Overlay({
            title: 'Test',
            on_open: () => opened = true,
            on_close: () => closed = true
        });

        ol.open();
        assert.ok(ol.is_open, 'Overlay is open');
        assert.ok(opened, 'on_open callback fired');

        ol.close();
        assert.notOk(ol.is_open, 'Overlay is closed');
        assert.ok(closed, 'on_close callback fired');
    });

    QUnit.test('Test get_overlay returns null for missing', assert => {
        let result = get_overlay('nonexistent');
        assert.strictEqual(result, null, 'Returns null for missing overlay');
    });
});
```

## Pitfalls

1. **Always clean up DOM elements** added during tests. Leftover elements
   can affect subsequent tests.

2. **Mock WebSocket by passing a factory** to the `Websocket` constructor's
   second argument, not by overriding `window.WebSocket`.

3. **`assert.async()` must be called before any async operations.** The
   returned `done` function must be called exactly once.

4. **The Ajax singleton (`ajax`) persists between tests.** Binder callbacks
   registered in one test will fire in subsequent tests. Consider this when
   testing Ajax registration.

5. **jQuery events on `$(document)` persist.** Unbind them in test cleanup
   to avoid interference.

6. **`compile_template` returns jQuery-wrapped elements.** `compile_svg`
   returns raw SVG DOM elements.
