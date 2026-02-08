import $ from 'jquery';
import {Events} from '../src/events.js';
import {
    compile_svg,
    compile_template,
    extract_number,
    HTMLParser,
    Parser,
    SVGParser,
    TemplateParser
} from '../src/parser.js';
import {
    create_svg_elem,
    parse_svg
} from '../src/utils.js';

QUnit.module('treibstoff.parser', hooks => {

    QUnit.test('Test Parser', assert => {
        class TestParser extends Parser {
            parse(node) {
                assert.step('parse()');
            }
        }

        let parser = new TestParser();
        let elem = $(`<div attr="val" ns:attr="nsval">`).get(0);

        parser.walk(elem);
        assert.verifySteps(['parse()']);

        let attrs = parser.node_attrs(elem);
        assert.strictEqual(attrs.attr, 'val');
        assert.strictEqual(attrs['ns:attr'], 'nsval');
    });

    QUnit.test('Test TemplateParser', assert => {
        let elem = $(`<div t-elem="elem">`);
        let ob = {};
        new TemplateParser(ob).walk(elem.get(0));
        assert.strictEqual(ob.elem.tagName, 'DIV', 'DOM element set on object');
    });

    QUnit.test('Test extract_number', assert => {
        assert.throws(
            function() {
                extract_number('a');
            },
            'Number extractor throws error if value not a number'
        );
        assert.strictEqual(
            extract_number('1'),
            Number(1),
            'Number extractor returns Number()'
        );
    });

    QUnit.test('Test HTMLParser', assert => {
        let elem = $(`<input type="text" t-prop="foo">`);
        let ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.strictEqual(ob.foo, null, 'Property foo set on object');

        ob.foo = '1';
        assert.strictEqual(elem.val(), '1', 'Property foo value set on element');
        assert.deepEqual(Object.keys(ob),['foo'], 'Only foo property set to object');

        elem = $(`<input type="text" t-prop="foo" t-elem="foo_elem">`);
        ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.deepEqual(
            Object.keys(ob),
            ['foo_elem', 'foo'],
            'Foo property and DOM element set to object'
        );

        ob.foo = '2';
        assert.strictEqual(ob.foo_elem.val(), '2', 'Value set on foo_elem');

        elem = $(`<input type="text" t-prop="foo" t-elem="foo_elem" t-val="3">`);
        ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.strictEqual(ob.foo, '3', 'Preset value set on foo');
        assert.strictEqual(ob.foo_elem.val(), '3', 'Preset value set on foo_elem');

        elem = $(`<input type="text" t-prop="foo" t-val="a" t-type="number">`);
        ob = {};
        assert.throws(
            function() {
                new HTMLParser(ob).walk(elem.get(0));
            },
            'Cannot extract initial value to given type'
        );

        elem = $(
            `<input type="text" t-prop="foo" t-elem="foo_elem"
                    t-val="4" t-type="number">`
        );
        ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.strictEqual(4, ob.foo, 'Initial value converted to number');

        ob.foo_elem.val('5');
        ob.foo_elem.trigger('change');
        assert.strictEqual(5, ob.foo, 'Changed value converted to number');

        ob.foo_elem.val('b');
        ob.foo_elem.trigger('change');
        assert.strictEqual(5, ob.foo, 'Error setting non numeric value');

        elem = $(
            `<input type="text" t-prop="foo" t-elem="foo_elem"
                    t-val="4" t-extract="foo_extract">`
        );
        ob = {
            foo_extract: function(val) {
                return `foo_${val}`;
            }
        };
        new HTMLParser(ob).walk(elem.get(0));
        ob.foo_elem.val('val');
        ob.foo_elem.trigger('change');
        assert.strictEqual('foo_val', ob.foo, 'Custom extractor used');

        elem = $(
            `<input type="text" t-prop="bar" t-elem="bar_elem"
                    t-val="5" t-type="number">`
        );
        ob = new Events();
        ob.on_prop_state = function(prop) {
            this.prop = prop;
        }.bind(ob);
        new HTMLParser(ob).walk(elem.get(0));

        ob.bar_elem.val('val');
        ob.bar_elem.trigger('change');
        assert.strictEqual(ob.prop.name, 'bar', 'Default state event triggered');
        assert.strictEqual(ob.prop.error, true, 'Set value by changed event, error');

        ob.bar_elem.val('5');
        ob.bar_elem.trigger('change');
        assert.strictEqual(ob.prop.error, false, 'Set value by changed event, no error');

        ob.bar = 'val';
        assert.strictEqual(ob.prop.error,true, 'Set value directly, error');

        ob.bar = '5';
        assert.strictEqual(ob.prop.error, false, 'Set value directly, no error');

        elem = $(
            `<input type="text" t-prop="baz" t-val="5"
                    t-type="number" t-state-evt="on_baz_state">`
        );
        ob = new Events();
        ob.on_baz_state = function(prop) {
            this.prop = prop;
        }.bind(ob);
        new HTMLParser(ob).walk(elem.get(0));

        ob.baz = '5';
        assert.strictEqual(ob.prop.name, 'baz', 'Custom state event triggered');

        let opts = [['0', 'Null'], ['1', 'One']];
        elem = $(`<select t-prop="selection" t-elem="selection_elem"
                          t-val="1" t-options='${JSON.stringify(opts)}'>`);
        ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.strictEqual(ob.selection_elem.get(0).options.length, 2, 'Select options set');
        assert.strictEqual(ob.selection_elem.val(), '1', 'Selected option matches');

        elem = $(`<button t-prop="button" t-val="OK" t-elem="button_elem">`);
        ob = new Events();
        ob.on_button_down_called = false;
        ob.on_button_down = function(prop) {
            this.on_button_down_called = true;
        }.bind(ob);
        new HTMLParser(ob).walk(elem.get(0));

        assert.strictEqual(ob.button_elem.text(), 'OK', 'Button element text set');
        assert.strictEqual(ob.button, 'OK', 'Button property value set');

        ob.button_elem.trigger('mousedown');
        assert.strictEqual(ob.on_button_down_called, true, 'Button event handler called');
    });

    QUnit.test('Test Parser base class parse stub', assert => {
        // Base Parser.parse() is a no-op — should not throw
        let parser = new Parser();
        let elem = $('<div></div>').get(0);
        parser.walk(elem);
        assert.ok(true, 'Base Parser.parse() does not throw');
    });

    QUnit.test('Test HTMLParser handle_input without t-prop', assert => {
        // Input without t-prop should be skipped (early return)
        let elem = $('<div><input type="text" /></div>');
        let ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.deepEqual(Object.keys(ob), [], 'No properties set for input without t-prop');
    });

    QUnit.test('Test HTMLParser handle_button without t-prop', assert => {
        // Button without t-prop should be skipped (early return)
        let elem = $('<div><button>Click</button></div>');
        let ob = {};
        new HTMLParser(ob).walk(elem.get(0));
        assert.deepEqual(Object.keys(ob), [], 'No properties set for button without t-prop');
    });

    QUnit.test('Test compile_svg', assert => {
        let container = create_svg_elem('svg', {});
        let ob = {};
        let elems = compile_svg(ob, `
          <g t-elem="group">
            <rect t-elem="rect" />
          </g>
        `, container);
        assert.strictEqual(ob.group.tagName, 'g', 'SVG group element set on object');
        assert.strictEqual(ob.rect.tagName, 'rect', 'SVG rect element set on object');
        assert.strictEqual(elems.length, 1, 'One top-level element returned');
    });

    QUnit.test('Test SVGParser', assert => {
        let container = create_svg_elem('svg', {});
        let elems = parse_svg(`
          <g t-elem="elem">
            <rect t-elem="rect_elem" />
          </g>
        `, container);
        let ob = {};
        new SVGParser(ob).walk(elems[0]);
        assert.strictEqual(ob.elem.tagName, 'g', 'SVG group element set on object');
        assert.strictEqual(ob.rect_elem.tagName, 'rect', 'SVG rect element set on object');
    });

});
