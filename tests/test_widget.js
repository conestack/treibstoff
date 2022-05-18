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

        let opts = {
            parent: 'parent'
        };
        let w = new TestWidget(opts);
        // Parent set and default subscriber called
        assert.strictEqual(w.parent, 'parent');

        w.parent = 'other';
        // Parent changed
        assert.strictEqual(w.parent, 'other');

        class Root extends TestWidget {
            constructor(opts) {
                super(opts);
                this.name = 'root';
            }
        }
        class W1 extends TestWidget {
            constructor(opts) {
                super(opts);
                this.name = 'w1';
            }
        }
        class W2 extends TestWidget {
            constructor(opts) {
                super(opts);
                this.name = 'w2';
            }
        }

        opts = {
            parent: null
        }

        let root = new Root(opts);

        opts = {
            parent: root
        }
        let w1 = new W1(opts);

        opts = {
            parent: w1
        }
        let w2 = new W2(opts);

        // Root has no parent
        assert.strictEqual(root.parent, null);
        // Widget 1 has root as parent
        assert.deepEqual(w1.parent, root);
        //Widget 2 has widget 1 as parent
        assert.deepEqual(w2.parent, w1);

        // Acquire on widget with no parent returns null
        assert.strictEqual(root.acquire(TestWidget), null);
        // Acquire does not consider self
        assert.strictEqual(w2.acquire(W2), null);
        // Acquire w1
        assert.deepEqual(w2.acquire(W1), w1);
        // Acquire root works
        assert.deepEqual(w2.acquire(Root), root);
        // Acquire w1 from base class works
        assert.deepEqual(w2.acquire(TestWidget), w1);
    });

    QUnit.test('Test HTMLWidget', assert => {
        let parent = {};
        let elem = $('<div style="position: absolute;" />');
        $('body').append(elem);
        let opts = {
            parent: parent,
            elem: elem
        }
        let w = new HTMLWidget(opts);
        w.x = 1;
        w.y = 2;
        w.width = 3;
        w.height = 4;
        // Offset matches
        assert.deepEqual(w.offset, {"left": 1, "top": 2});

        // X Position Set
        assert.strictEqual(w.elem.css('left'), '1px');
        // Y Position Set
        assert.strictEqual(w.elem.css('top'), '2px');
        // Width Set
        assert.strictEqual(w.elem.css('width'), '3px');
        // Height Set
        assert.strictEqual(w.elem.css('height'), '4px');
        elem.remove();
    });

    QUnit.test('Test SVGContext', assert => {
        let parent = {
            elem: $(`<div />`)
        };
        let opts = {
            parent: parent,
            name: 'ctx_name',
            elem: $(`<div />`)
        }
        let ctx = new SVGContext(opts);
        // SVG Namespace set
        assert.strictEqual(ctx.svg_ns, svg_ns);
        // Parent set
        assert.deepEqual(ctx.parent, parent);
        // Context elem is SVG
        assert.strictEqual(ctx.elem.tagName, 'svg');
        // Context elem class matches
        assert.strictEqual(ctx.elem.getAttribute('class'), 'ctx_name');
        let elem = ctx.svg_elem('g', {
            id: 'daphne'
        }, ctx.elem);
        // Create SVG elem from SVGContext
        assert.strictEqual($(elem).attr('id'), 'daphne');
        ctx.svg_attrs(elem, {id: 'joseph'});
        // Set SVG attrs from SVGContext
        assert.strictEqual($(elem).attr('id'), 'joseph');
        ctx.reset_state();
    });
});
