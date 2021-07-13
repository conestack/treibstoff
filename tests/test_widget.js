import {
    HTMLWidget,
    SVGContext,
    Widget
} from '../src/widget.js';
import {svg_ns} from '../src/utils.js';


QUnit.module('treibstoff.widget', hooks => {

    QUnit.test('Test Widget', assert => {
        let res;
        class TestWidget extends Widget {
            on_parent(val) {
                res = val;
            }
        }

        let w = new TestWidget('parent');
        assert.strictEqual(w.parent, 'parent', 'Parent set and default subscriber called');

        w.parent = 'other';
        assert.strictEqual(w.parent, 'other', 'Parent changed');

        class Root extends TestWidget {
            constructor(parent) {
                super(parent);
                this.name = 'root';
            }
        }
        class W1 extends TestWidget {
            constructor(parent) {
                super(parent);
                this.name = 'w1';
            }
        }
        class W2 extends TestWidget {
            constructor(parent) {
                super(parent);
                this.name = 'w2';
            }
        }

        let root = new Root(),
            w1 = new W1(root),
            w2 = new W2(w1);

        assert.strictEqual(root.parent, null, 'Root has no parent');
        assert.deepEqual(w1.parent, root, 'Widget 1 has root as parent');
        assert.deepEqual(w2.parent, w1, 'Widget 2 has widget 1 as parent');

        assert.strictEqual(
            root.acquire(TestWidget),
            null,
            'Acquire on widget with no parent returns null'
        );
        assert.strictEqual(w2.acquire(W2), null, 'Acquire does not consider self');
        assert.deepEqual(w2.acquire(W1), w1, 'Acquire w1 works');
        assert.deepEqual(w2.acquire(Root), root, 'Acquire root works');
        assert.deepEqual(w2.acquire(TestWidget), w1, 'Acquire w1 from base class works');
    });

    QUnit.test('Test HTMLWidget', assert => {
        let parent = {};
        let elem = $('<div style="position: absolute;" />');
        $('body').append(elem);
        let w = new HTMLWidget(parent, elem);
        w.x = 1;
        w.y = 2;
        w.width = 3;
        w.height = 4;
        assert.deepEqual(w.offset, {
            "left": 1,
            "top": 2
        }, 'Offset matches');
        assert.strictEqual(w.elem.css('left'), '1px', 'X position set');
        assert.strictEqual(w.elem.css('top'), '2px', 'Y position set');
        assert.strictEqual(w.elem.css('width'), '3px', 'Width set');
        assert.strictEqual(w.elem.css('height'), '4px', 'Height set');
        elem.remove();
    });

    QUnit.test('Test SVGContext', assert => {
        let parent = {
            elem: $(`<div />`)
        };
        let ctx = new SVGContext(parent, 'ctx_name');
        assert.strictEqual(ctx.svg_ns, svg_ns, 'SVG Namespace set');
        assert.deepEqual(ctx.parent, parent, 'Parent set');
        assert.strictEqual(ctx.elem.tagName, 'svg', 'Context elem is SVG');
        assert.strictEqual(
            ctx.elem.getAttribute('class'),
            'ctx_name',
            'Context elem class matches'
        );
        let elem = ctx.svg_elem('g', {
            id: 'daphne'
        }, ctx.elem);
        assert.strictEqual($(elem).attr('id'), 'daphne', 'Create SVG elem from SVGContext');
        ctx.svg_attrs(elem, {id: 'joseph'});
        assert.strictEqual($(elem).attr('id'), 'joseph', 'Set SVG attrs from SVGContext');
        ctx.reset_state();
    });
});
