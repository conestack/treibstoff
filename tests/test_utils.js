import $ from 'jquery';
import {
    create_cookie,
    create_svg_elem,
    deprecate,
    json_merge,
    object_by_path,
    parse_path,
    parse_query,
    parse_svg,
    parse_url,
    read_cookie,
    set_default,
    set_svg_attrs,
    svg_ns,
    uuid4
} from '../src/utils.js';

QUnit.module('treibstoff.utils', hooks => {

    QUnit.test('Test deprecate', assert => {
        let log_origin = console.log;
        console.log = function(msg) {
            assert.step(msg);
        }
        deprecate('deprecated_func', 'new_func', '1.0');
        console.log = log_origin;
        let expected = 'DEPRECATED: deprecated_func is deprecated and will ' +
                       'be removed as of 1.0. Use new_func instead.';
        assert.verifySteps([expected]);
    });

    QUnit.test('Test object_by_path', assert => {
        window.namespace = {
            some_object: 'Some object'
        }
        assert.strictEqual(object_by_path(''), null);
        assert.deepEqual(object_by_path('namespace'), window.namespace);
        assert.deepEqual(
            object_by_path('namespace.some_object'),
            window.namespace.some_object
        );
        assert.throws(
            () => object_by_path('inexistent'),
            'Object by path not exists: inexistent'
        );
    });

    QUnit.test('Test uuid4', assert => {
        let uuid = uuid4();
        assert.strictEqual(uuid.length, 36, 'UUID length is 36');
        assert.strictEqual(typeof(uuid.length), 'number', 'typeof uuid4() is number');
    });

    QUnit.test('Test set_default', assert => {
        let ob = {foo: 'foo'};
        assert.deepEqual(set_default(ob, 'foo', 'bar'), 'foo');
        assert.deepEqual(set_default(ob, 'bar', 'bar'), 'bar');
    });

    QUnit.test('Test parse_url', assert => {
        assert.deepEqual(parse_url('https://tld.com/'), 'https://tld.com');
        assert.deepEqual(parse_url('https://tld.com?foo=bar'), 'https://tld.com');

        assert.deepEqual(parse_url('https://tld.com/sub/'), 'https://tld.com/sub');
        assert.deepEqual(parse_url('https://tld.com/sub?foo=bar'), 'https://tld.com/sub');
    });

    QUnit.test('Test parse_query', assert => {
        assert.deepEqual(parse_query('https://tld.com/'), {});
        assert.deepEqual(parse_query('https://tld.com/', true), '');
        assert.deepEqual(
            parse_query('https://tld.com?foo=bar'),
            {foo: 'bar'}
        );
        assert.deepEqual(
            parse_query('https://tld.com?foo=bar', true),
            '?foo=bar'
        );
    });

    QUnit.test('Test parse_path', assert => {
        assert.deepEqual(parse_path('https://tld.com'), '');
        assert.deepEqual(parse_path('https://tld.com/'), '');

        assert.deepEqual(parse_path('https://tld.com/sub'), '/sub');
        assert.deepEqual(parse_path('https://tld.com/sub/'), '/sub');

        assert.deepEqual(
            parse_path('https://tld.com/?foo=bar', true),
            '?foo=bar'
        );
        assert.deepEqual(
            parse_path('https://tld.com?foo=bar', true),
            '?foo=bar'
        );

        assert.deepEqual(
            parse_path('https://tld.com/sub/?foo=bar', true),
            '/sub?foo=bar'
        );
        assert.deepEqual(
            parse_path('https://tld.com/sub?foo=bar', true),
            '/sub?foo=bar'
        );
    });

    QUnit.test('Test create_cookie', assert => {
        create_cookie('test', 'test', null);
        assert.deepEqual(document.cookie, 'test=test');
        create_cookie('test', '', -1);
    });

    QUnit.test('Test read_cookie', assert => {
        assert.strictEqual(read_cookie('test'), null);
        document.cookie = 'test=test';
        assert.strictEqual(read_cookie('test'), 'test');
        create_cookie('test', '', -1);
    });


    QUnit.test('Test svg_ns', assert => {
        assert.strictEqual(svg_ns, 'http://www.w3.org/2000/svg', 'SVG namepsace');
    });

    QUnit.test('Test set_svg_attrs', assert => {
        let elem = document.createElementNS(svg_ns, 'g');
        set_svg_attrs(elem, {
            id: 'joseph'
        });
        assert.strictEqual($(elem).attr('id'), 'joseph', 'Set SVG attribute');
    });

    QUnit.test('Test create_svg_elem', assert => {
        let container = document.createElementNS(svg_ns, 'g');
        let elem = create_svg_elem('g', {
            id: 'daphne'
        }, container);
        assert.strictEqual($(elem).attr('id'), 'daphne', 'Create SVG elem');
    });

    QUnit.test('Test parse_svg', assert => {
        let container = create_svg_elem('svg', {});
        let elems = parse_svg(`
          <rect x="0" y="0" width="10" height="10" />
          <rect x="10" y="0" width="10" height="10" />
        `, container);

        assert.strictEqual(elems.length, 2, 'parsed elements returned as array');
        assert.strictEqual(container.childNodes.length, 2, 'elements added to container');
        assert.deepEqual(
            container.childNodes[0],
            elems[0],
            'instance in container is instance in returned elements'
        );
        assert.strictEqual(elems[1].tagName, 'rect', 'correct element created');
        assert.strictEqual(elems[1].getAttribute("x"), "10", 'correct attribute set');
    });
});
