import $ from 'jquery';
import {Events} from './events.js';
import {ClickListener} from './listener.js';
import {Motion} from './motion.js';
import {
    CSSProperty,
    Property
} from './properties.js';
import {
    create_svg_elem,
    set_svg_attrs,
    set_visible,
    svg_ns
} from './utils.js';

export class Widget extends Motion {

    /**
     * Create Widget instance.
     *
     * The widget class provides a way to build relations for entities.
     * Widgets can have other widgets as children.
     *
     * @param {Object} opts - Widget options.
     * @param {Object} opts.parent - Parent object
     */
    constructor(opts) {
        super();
        this.children = [];
        new Property(this, 'parent');
        this.parent = opts.parent || null;
    }

    /**
     * Add another widget as a child. The child widget will have this widget as
     * parent.
     *
     * @param {Object} widget - The widget which to add as child.
     */
    add_widget(widget){
        widget.parent = this;
        this.children.push(widget)
    }

    /**
     * Remove a child widget. That widget will have its parent set to null.
     *
     * @param {Object} widget - The widget which to remove as child.
     */
    remove_widget(widget){
        widget.parent = null;
        this.children.splice(
            this.children.indexOf(widget), 1
        )
    }

    /**
     * Get the first object by class going up in the hierarchy.
     *
     * @param {Class} cls - Object class to search for.
     * @returns object if found, else null
     */
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

    /**
     * Create HTMLWidget instance.
     *
     * The HTMLWidget class wraps a DOM element.
     *
     * It comes with a few predefined properties to allow for
     * easy access of base values of the wrapped DOM element.
     *
     * @param {Object} opts - HTMLWidget options.
     * @param {Object} opts.parent - Parent object
     * @param {$} opts.elem - jQuery wrapped DOM element.
     */
    constructor(opts) {
        super(opts);
        this.elem = opts.elem;
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

    /**
     * Create SVGContext instance.
     *
     * The SVGContext class wraps an svg element and provides functions to
     * create and modify attributes and sub-elements.
     *
     * @param {Object} opts - SVGContext options.
     * @param {Object} opts.parent - Parent object
     * @param {String} opts.name - Name of the svg element
     */
    constructor(opts) {
        let container = opts.parent.elem.get(0);
        opts.elem = create_svg_elem('svg', {'class': opts.name}, container);
        super(opts);
        this.svg_ns = svg_ns;
        this.xyz = {
            x: 0,
            y: 0,
            z: 1
        };
    }

    /**
     * Set the attributes of an SVG element.
     *
     * @param {$} el
     * @param {Object} opts
     */
    svg_attrs(el, opts) {
        set_svg_attrs(el, opts);
    }

    /**
     * Create a new SVG element.
     *
     * @param {String} name
     * @param {Object} opts
     * @param {$} container
     * @returns SVG element
     */
    svg_elem(name, opts, container) {
        return create_svg_elem(name, opts, container);
    }
}

/**
 * Class providing visibility for related element.
 */
export class Visibility extends Events {

    /**
     * Create Visibility instance.
     *
     * @param {Object} opts - Visibility options.
     * @param {$} opts.elem - jQuery wrapped DOM element.
     */
    constructor(opts) {
        if (!opts.elem) {
            throw 'No element given';
        }
        super();
        this.elem = opts.elem;
    }

    /**
     * Flag whether related element is visible.
     *
     * Triggers ``on_visible`` event if value gets changed.
     *
     * @type {boolean}
     */
    get visible() {
        return !this.elem.hasClass('hidden');
    }

    set visible(value) {
        let trigger = value !== !this.elem.hasClass('hidden');
        set_visible(this.elem, value);
        if (trigger) {
            this.trigger('on_visible', value);
        }
    }

    /**
     * Flag whether related element is hidden.
     *
     * No dedicated event gets triggered if value changes, bind to
     * ``on_visible`` to react on changes.
     *
     * @type {boolean}
     */
    get hidden() {
        return !this.visible;
    }

    set hidden(value) {
        this.visible = !value;
    }
}

/**
 * Class providing collapsing of related element.
 */
export class Collapsible {

    /**
     * Create Collapsible instance.
     *
     * @param {Object} opts - Collapsible options.
     * @param {$} opts.elem - jQuery wrapped DOM element.
     */
    constructor(opts) {
        if (!opts.elem) {
            throw `No element given`;
        }
        this.elem = opts.elem;
    }

    /**
     * Flag whether related element is collapsed.
     *
     * @type {boolean}
     */
    get collapsed() {
        return !this.elem.hasClass('in');
    }

    set collapsed(value) {
        if (value) {
            this.elem.collapse('hide');
        } else {
            this.elem.collapse('show');
        }
    }
}

/**
 * Button widget.
 *
 * @extends ClickListener
 */
export class Button extends ClickListener {

    /**
     * Create button instance.
     *
     * @param {Object} opts - Button options.
     * @param {$} opts.elem - jQuery wrapped button element.
     */
    constructor(opts) {
        super(opts);
        this.unselected_class = 'btn-default';
        this.selected_class = 'btn-success';
    }

    /**
     * Flag whether button is selected.
     *
     * @type {boolean}
     */
    get selected() {
        return this.elem.hasClass(this.selected_class);
    }

    set selected(value) {
        if (value) {
            this.elem
                .removeClass(this.unselected_class)
                .addClass(this.selected_class);
        } else {
            this.elem
                .removeClass(this.selected_class)
                .addClass(this.unselected_class);
        }
    }
}
