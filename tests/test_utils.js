import $ from 'jquery';
import {
    create_cookie,
    create_svg_elem,
    deprecate,
    get_elem,
    json_merge,
    load_svg,
    object_by_path,
    parse_path,
    parse_query,
    parse_svg,
    parse_url,
    query_elem,
    read_cookie,
    set_default,
    set_svg_attrs,
    svg_ns,
    uuid4,
} from '../src/utils.js';

QUnit.module('treibstoff.utils', (_hooks) => {
    QUnit.test('Test deprecate', (assert) => {
        const log_origin = console.log;
        console.log = (msg) => {
            assert.step(msg);
        };
        deprecate('deprecated_func', 'new_func', '1.0');
        console.log = log_origin;
        const expected =
            'DEPRECATED: deprecated_func is deprecated and will ' +
            'be removed as of 1.0. Use new_func instead.';
        assert.verifySteps([expected]);
    });

    QUnit.test('Test object_by_path', (assert) => {
        window.namespace = {
            some_object: 'Some object',
        };
        assert.strictEqual(object_by_path(''), null);
        assert.deepEqual(object_by_path('namespace'), window.namespace);
        assert.deepEqual(object_by_path('namespace.some_object'), window.namespace.some_object);
        assert.throws(() => object_by_path('inexistent'), 'Object by path not exists: inexistent');
    });

    QUnit.test('Test uuid4', (assert) => {
        const uuid = uuid4();
        assert.strictEqual(uuid.length, 36, 'UUID length is 36');
        assert.strictEqual(typeof uuid.length, 'number', 'typeof uuid4() is number');
    });

    QUnit.test('Test set_default', (assert) => {
        const ob = { foo: 'foo' };
        assert.deepEqual(set_default(ob, 'foo', 'bar'), 'foo');
        assert.deepEqual(set_default(ob, 'bar', 'bar'), 'bar');
    });

    QUnit.test('Test parse_url', (assert) => {
        assert.deepEqual(parse_url('https://tld.com/'), 'https://tld.com');
        assert.deepEqual(parse_url('https://tld.com?foo=bar'), 'https://tld.com');

        assert.deepEqual(parse_url('https://tld.com/sub/'), 'https://tld.com/sub');
        assert.deepEqual(parse_url('https://tld.com/sub?foo=bar'), 'https://tld.com/sub');
    });

    QUnit.test('Test parse_query', (assert) => {
        assert.deepEqual(parse_query('https://tld.com/'), {});
        assert.deepEqual(parse_query('https://tld.com/', true), '');
        assert.deepEqual(parse_query('https://tld.com?foo=bar'), { foo: 'bar' });
        assert.deepEqual(parse_query('https://tld.com?foo=bar', true), '?foo=bar');
    });

    QUnit.test('Test parse_path', (assert) => {
        assert.deepEqual(parse_path('https://tld.com'), '');
        assert.deepEqual(parse_path('https://tld.com/'), '');

        assert.deepEqual(parse_path('https://tld.com/sub'), '/sub');
        assert.deepEqual(parse_path('https://tld.com/sub/'), '/sub');

        assert.deepEqual(parse_path('https://tld.com/?foo=bar', true), '?foo=bar');
        assert.deepEqual(parse_path('https://tld.com?foo=bar', true), '?foo=bar');

        assert.deepEqual(parse_path('https://tld.com/sub/?foo=bar', true), '/sub?foo=bar');
        assert.deepEqual(parse_path('https://tld.com/sub?foo=bar', true), '/sub?foo=bar');
    });

    QUnit.test('Test create_cookie', (assert) => {
        create_cookie('test', 'test', null);
        assert.deepEqual(document.cookie, 'test=test');
        create_cookie('test', '', -1);
    });

    QUnit.test('Test read_cookie', (assert) => {
        assert.strictEqual(read_cookie('test'), null);
        // biome-ignore lint/suspicious/noDocumentCookie: test setup
        document.cookie = 'test=test';
        assert.strictEqual(read_cookie('test'), 'test');
        create_cookie('test', '', -1);
    });

    QUnit.test('Test svg_ns', (assert) => {
        assert.strictEqual(svg_ns, 'http://www.w3.org/2000/svg', 'SVG namepsace');
    });

    QUnit.test('Test set_svg_attrs', (assert) => {
        const elem = document.createElementNS(svg_ns, 'g');
        set_svg_attrs(elem, {
            id: 'joseph',
        });
        assert.strictEqual($(elem).attr('id'), 'joseph', 'Set SVG attribute');
    });

    QUnit.test('Test create_svg_elem', (assert) => {
        const container = document.createElementNS(svg_ns, 'g');
        const elem = create_svg_elem(
            'g',
            {
                id: 'daphne',
            },
            container,
        );
        assert.strictEqual($(elem).attr('id'), 'daphne', 'Create SVG elem');
    });

    QUnit.test('Test parse_svg', (assert) => {
        const container = create_svg_elem('svg', {});
        const elems = parse_svg(
            `
          <rect x="0" y="0" width="10" height="10" />
          <rect x="10" y="0" width="10" height="10" />
        `,
            container,
        );

        assert.strictEqual(elems.length, 2, 'parsed elements returned as array');
        assert.strictEqual(container.childNodes.length, 2, 'elements added to container');
        assert.deepEqual(
            container.childNodes[0],
            elems[0],
            'instance in container is instance in returned elements',
        );
        assert.strictEqual(elems[1].tagName, 'rect', 'correct element created');
        assert.strictEqual(elems[1].getAttribute('x'), '10', 'correct attribute set');
    });

    QUnit.test('Test json_merge', (assert) => {
        let result = json_merge({ a: 1, b: 2 }, { b: 3, c: 4 });
        assert.deepEqual(result, { a: 1, b: 3, c: 4 });

        result = json_merge({}, { x: 'y' });
        assert.deepEqual(result, { x: 'y' });

        result = json_merge({ x: 'y' }, {});
        assert.deepEqual(result, { x: 'y' });
    });

    QUnit.test('Test query_elem not unique', (assert) => {
        const container = $('<div><span></span><span></span></div>');
        $('body').append(container);

        assert.throws(() => {
            query_elem('span', container, true);
        });

        // With unique=false, returns all elements
        const elems = query_elem('span', container, false);
        assert.strictEqual(elems.length, 2);

        // Returns null when not found
        const result = query_elem('.nonexistent', container);
        assert.strictEqual(result, null);

        container.remove();
    });

    QUnit.test('Test get_elem throws when not found', (assert) => {
        const container = $('<div></div>');
        assert.throws(() => {
            get_elem('.nonexistent', container);
        });
    });

    QUnit.test('Test read_cookie with leading spaces', (assert) => {
        // Set two cookies so the second one has a leading space when
        // document.cookie returns "cookie1=val1; spaced=value"
        // biome-ignore lint/suspicious/noDocumentCookie: test setup
        document.cookie = 'rcfirst=val1';
        // biome-ignore lint/suspicious/noDocumentCookie: test setup
        document.cookie = 'rcsecond=val2';
        // The browser returns "rcfirst=val1; rcsecond=val2" — the second
        // entry has a leading space that read_cookie must strip
        const result = read_cookie('rcsecond');
        assert.strictEqual(result, 'val2');
        // Clean up
        create_cookie('rcfirst', '', -1);
        create_cookie('rcsecond', '', -1);
    });

    QUnit.test('Test set_svg_attrs with width and height', (assert) => {
        const elem = document.createElementNS(svg_ns, 'rect');

        // Valid width and height
        set_svg_attrs(elem, { width: 100, height: 50 });
        assert.strictEqual(elem.getAttribute('width'), '100');
        assert.strictEqual(elem.getAttribute('height'), '50');

        // Zero is valid
        set_svg_attrs(elem, { width: 0, height: 0 });
        assert.strictEqual(elem.getAttribute('width'), '0');
        assert.strictEqual(elem.getAttribute('height'), '0');

        // Negative width/height triggers error, does not set attribute
        const error_origin = console.error;
        let error_args;
        console.error = (...args) => {
            error_args = args;
        };

        set_svg_attrs(elem, { width: -5 });
        assert.ok(error_args, 'console.error was called for negative width');
        assert.ok(error_args[0].indexOf('width') > -1);

        error_args = null;
        set_svg_attrs(elem, { height: -10 });
        assert.ok(error_args, 'console.error was called for negative height');
        assert.ok(error_args[0].indexOf('height') > -1);

        // NaN triggers error
        error_args = null;
        set_svg_attrs(elem, { width: 'invalid' });
        assert.ok(error_args, 'console.error was called for NaN width');

        console.error = error_origin;
    });

    QUnit.test('Test load_svg', (assert) => {
        const get_origin = $.get;
        let get_url, get_type;

        // Mock $.get
        $.get = (url, callback, type) => {
            get_url = url;
            get_type = type;
            // Simulate XML response with SVG
            const parser = new DOMParser();
            const doc = parser.parseFromString(
                '<root><svg xmlns="http://www.w3.org/2000/svg" xmlns:a="x">' +
                    '<rect width="10" height="10"/>' +
                    '</svg></root>',
                'text/xml',
            );
            callback(doc);
        };

        let result_svg;
        load_svg('/test.svg', (svg) => {
            result_svg = svg;
        });

        assert.strictEqual(get_url, '/test.svg');
        assert.strictEqual(get_type, 'xml');
        assert.ok(result_svg, 'callback received SVG element');
        assert.strictEqual(result_svg.length, 1, 'SVG element found');

        $.get = get_origin;
    });
});
