import $ from 'jquery';
import Events from '../src/events.js';
import * from '../src/properties.js';

QUnit.module('treibstoff.properties', hooks => {

    QUnit.test('Test Property', assert => {
        let res;
        class TestPropertyCls extends Events {
            constructor() {
                super();
                new Property(this, 'foo', 1);
            }
            on_foo(val) {
                res = val;
            }
        }
        inst = new TestPropertyCls();
        assert.strictEqual(res, 1, 'Property default event handler called');

        let subscriber = function(inst, val) {
            res = val;
        };
        inst.on('foo', subscriber);
        inst.foo = 2;
        assert.strictEqual(res, 2, 'Property bound event handler called');
    });

    QUnit.test('Test BoundProperty', assert => {
        let ob = new Object();
        let prop = new BoundProperty(ob, 'foo');
        assert.strictEqual(
            prop._ctxa,
            'elem',
            'Property default context attribute name is elem'
        );
        assert.strictEqual(
            prop._ctx,
            undefined,
            'Property internal context undefined if context attribute not found'
        );

        ob.elem = 'default_ctx';
        assert.deepEqual(prop.ctx, ob.elem, 'Property context computed');
        assert.deepEqual(prop._ctx, ob.elem, 'Property internal context set');

        assert.strictEqual(prop.tgt, 'foo', 'Property target is name');
        assert.strictEqual(prop._tgt, 'foo', 'Property internal target is name');

        prop = new BoundProperty(ob, 'bar', {
            ctx: 'custom_ctx',
            tgt: 'custom_tgt'
        });
        assert.strictEqual(prop.ctx, 'custom_ctx', 'Custom context set');
        assert.strictEqual(prop._ctx, 'custom_ctx', 'Custom internal context set');
        assert.strictEqual(prop.tgt, 'custom_tgt', 'Custom target set');
        assert.strictEqual(prop._tgt, 'custom_tgt', 'Custom internal target set');

        ob.data = 'default_ctx';
        prop = new BoundProperty(ob, 'baz', {
            ctxa: 'data'
        });
        assert.strictEqual(prop._ctxa, 'data', 'Custom default context attribute name set');
        assert.strictEqual(prop.ctx, 'default_ctx', 'Custom default context set');
    });

    QUnit.test('Test DataProperty', assert => {
        let ob = {
            data: {}
        };

        new DataProperty(ob, 'foo');
        ob.foo = 1;
        assert.strictEqual(ob.data.foo, 1, 'Property set on data');

        new DataProperty(ob, 'bar', {tgt: 'baz'});
        ob.bar = 2;
        assert.strictEqual(
            ob.data.baz,
            2,
            'Property set on data at custom attribute'
        );
        assert.strictEqual(
            ob.data.bar,
            undefined,
            'Property name is undefined on data due to custom target'
        );

        ob.other = {};
        new DataProperty(ob, 'fizz', {ctx: ob.other});
        ob.fizz = 3;
        assert.strictEqual(ob.other.fizz, 3, 'Property set on custom context');

        new DataProperty(ob, 'bazz', {ctx: ob.other, tgt: 'other'});
        ob.bazz = 4;
        assert.strictEqual(
            ob.other.other,
            4,
            'Property set on custom context at custom attribute'
        );
        assert.strictEqual(
            ob.other.bazz,
            undefined,
            'Property name is undefined on custom context due to custom target'
        );
    });

    QUnit.test('Test AttrProperty', assert => {
        let ob = {
            elem: $('<span />')
        };

        new AttrProperty(ob, 'title');
        assert.strictEqual(ob.elem.attr('title'), undefined, 'Element attribute not set');

        ob.title = 'Title';
        assert.strictEqual(ob.elem.attr('title'), 'Title', 'Element attribute set');
    });

    QUnit.test('Test TextProperty', assert => {
        let ob = {
            elem: $('<span />')
        };

        new TextProperty(ob, 'text');
        assert.strictEqual(ob.elem.text(), '', 'Element text not set yet');

        ob.text = 'Text';
        assert.strictEqual(ob.elem.text(), 'Text', 'Element text set');
    });

    QUnit.test('Test CSSProperty', assert => {
        let ob = {
            elem: $('<span />')
        };

        new CSSProperty(ob, 'width');
        assert.strictEqual(ob.elem.css('width'), '0px', 'Element CSS attribute default');

        ob.width = 100;
        assert.strictEqual(ob.elem.css('width'), '100px', 'Element CSS attribute set');
    });

    QUnit.test('Test InputProperty', assert => {
        let ob = {
            elem: $('<input type="text" />')
        };
        new InputProperty(ob, 'value');

        assert.strictEqual(ob.elem.val(), '', 'Input element empty value');
        ob.value = 'Value';
        assert.strictEqual(ob.elem.val(), 'Value', 'Input element value set');

        ob.elem.val('val');
        ob.elem.trigger('change');
        assert.strictEqual(ob.value, 'val', 'Property value changed by event');

        class TestInputPropertyCls extends Events {
            constructor() {
                super();
                this.elem = $('<input type="text" />');
                new InputProperty(this, 'value', {extract: this.extract});
            }
            extract(val) {
                if (isNaN(val)) {
                    throw 'Input is not a number';
                }
                return Number(val);
            }
            on_prop_state(prop) {
                this.prop = prop;
            }
        }

        ob = new TestInputPropertyCls();
        ob.elem.val('NAN');
        ob.elem.trigger('change');
        assert.strictEqual(ob.prop.name, 'value', 'Instance on_prop_state called.');
        assert.strictEqual(ob.prop.error, true, 'Value set by event. Error flag set.');
        assert.strictEqual(ob.prop.msg, 'Input is not a number', 'Error message set.');
        assert.strictEqual(ob.value, null, 'Property value unchanged');

        ob.elem.val('1');
        ob.elem.trigger('change');
        assert.strictEqual(ob.prop.error, false, 'Value set by event. Error flag not set.');
        assert.strictEqual(ob.prop.msg, '', 'Error message not set.');
        assert.strictEqual(ob.value, 1, 'Property value extracted as number');

        ob.value = 'NAN';
        assert.strictEqual(ob.prop.error, true, 'Value set directly. Error flag set.');
        assert.strictEqual(ob.prop.msg, 'Input is not a number', 'Error message set.');
        assert.strictEqual(ob.value, 1, 'Property value unchanged.');

        ob.value = '2';
        assert.strictEqual(ob.prop.error, false, 'Value set directly. Error flag not set.');
        assert.strictEqual(ob.prop.msg, '', 'Error message not set.');
        assert.strictEqual(ob.value, 2, 'Property value extracted as number');
    });

    QUnit.test('Test ButtonProperty', assert => {
        let ob = new Events();
        ob.elem = $('<button></button>');
        ob.ok_val = null;
        ob.ok_down_called = false;
        ob.ok_up_called = false;

        ob.on_ok = function(val) {
            this.ok_val = val;
        }.bind(ob);

        ob.on_ok_down = function(prop) {
            this.ok_down_called = true;
        }.bind(ob);

        ob.on_ok_up = function(prop) {
            this.ok_up_called = true;
        }.bind(ob);

        new ButtonProperty(ob, 'ok', {val: 'OK'});

        assert.strictEqual(ob.elem.text(), 'OK', 'Button elem text set');
        assert.strictEqual(ob.ok, 'OK', 'Button text set');
        assert.strictEqual(ob.ok_val, 'OK', 'Property event triggered');
        assert.strictEqual(ob.ok_down_called, false, 'No down event called');
        assert.strictEqual(ob.ok_up_called, false, 'No up event called');

        ob.elem.trigger('mousedown');
        assert.strictEqual(ob.ok_down_called, true, 'Down event called');

        ob.elem.trigger('mouseup');
        assert.strictEqual(ob.ok_up_called, true, 'Up event called');
    });

    QUnit.test('Test SVGProperty', assert => {
        let ob = {
            elem: document.createElementNS(svg_ns, 'g')
        };
        new SVGProperty(ob, 'id');
        assert.strictEqual(
            $(ob.elem).attr('id'),
            undefined,
            'SVG element id attribute is undefined'
        );
        ob.id = 'id';
        assert.strictEqual(
            $(ob.elem).attr('id'),
            'id',
            'SVG element id attribute set'
        );
    });
});
