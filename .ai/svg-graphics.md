# SVG Graphics

This guide explains how to work with SVG using treibstoff's SVGContext, SVG
utilities, and the property binding system.

## Context

Treibstoff provides `SVGContext` as a widget that wraps an `<svg>` element and
offers helper methods for creating and modifying SVG sub-elements. Combined with
`SVGProperty`, `Motion`, and the widget hierarchy, it enables building interactive
SVG-based applications (diagrams, editors, visualizations).

## Key API

| Class/Function | Purpose |
|----------------|---------|
| `ts.SVGContext` | Widget wrapping an `<svg>` element |
| `ts.SVGProperty` | Property that syncs to an SVG attribute |
| `ts.create_svg_elem(name, opts, container)` | Create an SVG element |
| `ts.set_svg_attrs(el, opts)` | Set attributes on an SVG element |
| `ts.parse_svg(tmpl, container)` | Parse SVG template string |
| `ts.compile_svg(inst, tmpl, container)` | Compile SVG template with t-elem |
| `ts.load_svg(url, callback)` | Load external SVG file |
| `ts.svg_ns` | SVG namespace URI |

## Pattern 1: Creating an SVG Context

`SVGContext` needs a parent widget with a jQuery-wrapped `elem`:

```javascript
import ts from 'treibstoff';

class Application extends ts.HTMLWidget {
    constructor() {
        super({parent: null, elem: $('#app-container')});
        this.canvas = new Canvas({parent: this});
    }
}

class Canvas extends ts.SVGContext {
    constructor(opts) {
        // SVGContext creates an <svg> element inside parent.elem
        super({parent: opts.parent, name: 'canvas'});
        // this.elem is now the <svg class="canvas"> element
        // this.svg_ns is the SVG namespace

        // Create child SVG elements
        this.layer = this.svg_elem('g', {class: 'layer'}, this.elem);
    }
}

let app = new Application();
// Result: <div id="app-container"><svg class="canvas"><g class="layer"/></svg></div>
```

## Pattern 2: Creating SVG Elements

```javascript
// Via SVGContext instance
let rect = this.ctx.svg_elem('rect', {
    x: 10, y: 20, width: 100, height: 50,
    fill: '#4a90d9', rx: 4
}, parentGroup);

let circle = this.ctx.svg_elem('circle', {
    cx: 50, cy: 50, r: 25, fill: 'red'
}, parentGroup);

let path = this.ctx.svg_elem('path', {
    d: 'M 10 10 L 90 90', stroke: '#333', fill: 'none'
}, parentGroup);

let text = this.ctx.svg_elem('text', {
    x: 10, y: 30, 'font-size': '14px'
}, parentGroup);
text.textContent = 'Hello SVG';

// Via standalone function (no SVGContext needed)
let el = ts.create_svg_elem('rect', {width: 50, height: 50});
container.appendChild(el);
```

## Pattern 3: Modifying SVG Attributes

```javascript
// Via SVGContext instance
this.ctx.svg_attrs(rect, {
    fill: '#f00',
    transform: 'translate(10 20)',
    opacity: 0.8
});

// Via standalone function
ts.set_svg_attrs(rect, {
    width: 200,
    height: 100
});
```

**Width/height validation:** `set_svg_attrs` validates that `width` and `height`
are non-negative numbers. Invalid values are logged as errors and skipped.

## Pattern 4: SVG Properties (Reactive Binding)

```javascript
class Circle extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);

        this.elem = this.ctx.svg_elem('circle', {}, this.ctx.elem);

        // SVGProperty syncs to SVG attributes automatically
        new ts.SVGProperty(this, 'cx', {ctx: this.elem, val: opts.cx || 50});
        new ts.SVGProperty(this, 'cy', {ctx: this.elem, val: opts.cy || 50});
        new ts.SVGProperty(this, 'r', {ctx: this.elem, val: opts.r || 25});
    }

    on_r(val) {
        // Called when radius changes
        console.log('Radius:', val);
    }
}

let circle = new Circle({parent: canvas, cx: 100, cy: 100, r: 30});
circle.r = 50;  // SVG attribute updates automatically, on_r fires
```

## Pattern 5: SVG Template Compilation

```javascript
class Icon extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);

        // compile_svg processes t-elem attributes on SVG elements
        ts.compile_svg(this, `
            <g t-elem="group">
                <rect t-elem="background" width="24" height="24" fill="none"/>
                <path t-elem="icon_path" d="M4 4 L20 20" stroke="#333"/>
            </g>
        `, this.ctx.elem);

        // After compile_svg:
        // this.group → <g> element
        // this.background → <rect> element
        // this.icon_path → <path> element
    }
}
```

## Pattern 6: Two-Layer Pattern (Visible + Hit Area)

For thin elements (lines, paths) that need a wider click target:

```javascript
class Edge extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);

        let d = `M ${opts.x1} ${opts.y1} L ${opts.x2} ${opts.y2}`;

        // Visible line (thin)
        this.visible = this.ctx.svg_elem('path', {
            d: d, stroke: '#333', 'stroke-width': 2, fill: 'none'
        }, opts.container);

        // Invisible hit area (wide, for easier clicking)
        this.hitarea = this.ctx.svg_elem('path', {
            d: d, stroke: 'rgba(0,0,0,0)', 'stroke-width': 12, fill: 'none'
        }, opts.container);

        // Bind click to the hit area
        this.set_scope(this.hitarea, null);
    }

    update(x1, y1, x2, y2) {
        let d = `M ${x1} ${y1} L ${x2} ${y2}`;
        this.ctx.svg_attrs(this.visible, {d: d});
        this.ctx.svg_attrs(this.hitarea, {d: d});
    }
}
```

## Pattern 7: Loading External SVG

```javascript
ts.load_svg('/assets/icons.svg', function(svg) {
    // svg is a jQuery-wrapped <svg> element
    $('#icon-container').append(svg);
});
```

## Pattern 8: Parsing SVG from String

```javascript
// Parse SVG markup into elements
let elements = ts.parse_svg(`
    <rect width="50" height="50" fill="blue"/>
    <circle cx="25" cy="25" r="10" fill="white"/>
`, containerElement);

// elements is an array of SVG DOM elements
```

## Pattern 9: Pan/Zoom with SVGContext

```javascript
class ZoomableCanvas extends ts.SVGContext {
    constructor(opts) {
        super({parent: opts.parent, name: 'zoomable'});
        // xyz holds pan (x, y) and zoom (z)
        // Already initialized: this.xyz = {x: 0, y: 0, z: 1}

        this.content = this.svg_elem('g', {}, this.elem);
    }

    pan(dx, dy) {
        this.xyz.x += dx;
        this.xyz.y += dy;
        this._apply_transform();
    }

    zoom(factor, cx, cy) {
        let old_z = this.xyz.z;
        this.xyz.z *= factor;
        // Adjust pan to zoom toward cursor position
        this.xyz.x = cx - (cx - this.xyz.x) * (this.xyz.z / old_z);
        this.xyz.y = cy - (cy - this.xyz.y) * (this.xyz.z / old_z);
        this._apply_transform();
    }

    _apply_transform() {
        this.svg_attrs(this.content, {
            transform: `translate(${this.xyz.x} ${this.xyz.y}) scale(${this.xyz.z})`
        });
    }
}
```

## Complete Example: Interactive Diagram Node

```javascript
import ts from 'treibstoff';

class DiagramNode extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        this.ctx = this.acquire(ts.SVGContext);
        this.data = opts.data;

        new ts.DataProperty(this, 'x', {val: opts.data.x});
        new ts.DataProperty(this, 'y', {val: opts.data.y});
        new ts.DataProperty(this, 'label', {val: opts.data.label});
        new ts.Property(this, 'selected', false);

        this.compile();
        this.bind();
    }

    compile() {
        this.elem = this.ctx.svg_elem('g', {
            transform: `translate(${this.x} ${this.y})`
        }, this.ctx.elem);

        this.bg = this.ctx.svg_elem('rect', {
            width: 120, height: 40, rx: 4, fill: '#e8e8e8'
        }, this.elem);

        this.text = this.ctx.svg_elem('text', {
            x: 60, y: 25, 'text-anchor': 'middle', 'font-size': '13px'
        }, this.elem);
        this.text.textContent = this.label;
    }

    bind() {
        this.set_scope(this.elem, this.ctx.elem);
    }

    down(evt) {
        this._start = {x: evt.pageX, y: evt.pageY};
        this._pos = {x: this.x, y: this.y};
    }

    move(evt) {
        this.x = this._pos.x + (evt.pageX - this._start.x);
        this.y = this._pos.y + (evt.pageY - this._start.y);
    }

    on_x() { this._update_transform(); }
    on_y() { this._update_transform(); }

    on_selected(val) {
        this.ctx.svg_attrs(this.bg, {
            fill: val ? '#cce5ff' : '#e8e8e8',
            stroke: val ? '#007bff' : 'none'
        });
    }

    on_label(val) {
        this.text.textContent = val;
    }

    _update_transform() {
        this.ctx.svg_attrs(this.elem, {
            transform: `translate(${this.x} ${this.y})`
        });
    }
}
```

## Pitfalls

1. **SVGContext creates its own `<svg>` element.** Don't create one manually.
   The parent widget must have a jQuery-wrapped `elem` property.

2. **SVG elements use `setAttributeNS`**, not jQuery's `.attr()`. Always use
   `svg_attrs()` or `set_svg_attrs()` to modify SVG attributes.

3. **Width/height must be non-negative.** `set_svg_attrs` validates these and
   logs an error if invalid.

4. **`svg_elem()` returns a raw DOM element**, not a jQuery-wrapped one.
   Use it directly with `svg_attrs()` or standard DOM methods.

5. **`acquire(ts.SVGContext)`** finds the nearest SVGContext ancestor in the
   widget hierarchy. Fails (returns null) if no SVGContext is above.

6. **`ts.svg_ns`** is `'http://www.w3.org/2000/svg'`. Elements must be created
   with `createElementNS(svg_ns, tag)` — which `create_svg_elem` handles.
