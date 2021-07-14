import $ from 'jquery';
import {Motion} from './motion.js';
import {
    CSSProperty,
    Property
} from './properties.js';
import {
    create_svg_elem,
    set_svg_attrs,
    svg_ns
} from './utils.js';

export class Widget extends Motion {

    constructor(parent) {
        super();
        new Property(this, 'parent');
        this.parent = parent ? parent : null;
    }

    acquire(cls) {
        let parent = this.parent;
        while(parent) {
            if (!parent || parent instanceof cls) {
                break;
            }
            parent = parent.parent;
        }
        return parent;
    }
}

export class HTMLWidget extends Widget {

    constructor(parent, elem) {
        super(parent);
        this.elem = elem;
        new CSSProperty(this, 'x', {tgt: 'left'});
        new CSSProperty(this, 'y', {tgt: 'top'});
        new CSSProperty(this, 'width');
        new CSSProperty(this, 'height');
    }

    get offset() {
        return $(this.elem).offset();
    }
}

export class SVGContext extends HTMLWidget {

    constructor(parent, name) {
        let container = parent.elem.get(0),
            elem = create_svg_elem('svg', {'class': name}, container);
        super(parent, elem);
        this.svg_ns = svg_ns;
        this.xyz = {
            x: 0,
            y: 0,
            z: 1
        };
    }

    svg_attrs(el, opts) {
        set_svg_attrs(el, opts);
    }

    svg_elem(name, opts, container) {
        return create_svg_elem(name, opts, container);
    }
}
