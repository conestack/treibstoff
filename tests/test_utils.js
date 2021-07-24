import {
    create_svg_elem,
    json_merge,
    parse_path,
    parse_query,
    parse_svg,
    parse_url,
    set_svg_attrs,
    svg_ns,
    uuid4
} from '../src/utils.js';

QUnit.module('treibstoff.utils', hooks => {

    QUnit.test('Test uuid4', assert => {
        let uuid = uuid4();
        assert.strictEqual(uuid.length, 36, 'UUID length is 36');
        assert.strictEqual(typeof(uuid.length), 'number', 'typeof uuid4() is number');
    });

    QUnit.test('Test parse_url', assert => {
        assert.deepEqual(parse_url('https://tld.com/'), 'https://tld.com');
        assert.deepEqual(parse_url('https://tld.com?foo=bar'), 'https://tld.com');
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
