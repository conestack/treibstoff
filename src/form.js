import $ from 'jquery';
import { Events } from './events.js';
import { changeListener } from './listener.js';
import { http_request } from './request.js';
import { get_elem, query_elem } from './utils.js';
import { Visibility } from './widget.js';

/**
 * Lookup form related element.
 *
 * @param {Object} opts - options.
 * @param {Form} opts.form - Form instance the element belongs to.
 * @param {string} opts.name - Name.
 * @param {$} opts.elem - jQuery wrapped element. If omitted, search for DOM
 * element by `${prefix}-${form.name}-${name}` selector.
 * @param {string} prefix - Selector prefix.
 */
export function lookup_form_elem(opts, prefix) {
    if (opts.elem) {
        return opts.elem;
    }
    const form = opts.form,
        name = opts.name,
        elem = get_elem(`${prefix}-${form.name}-${name}`, form.elem, true);
    return elem;
}

/**
 * Form input object.
 */
export class FormInput extends Events {
    /**
     * Create form input instance.
     *
     * @param {Object} opts - FormInput options.
     * @param {Form} opts.form - Form instance this input belongs to.
     * @param {string} opts.name - Input name.
     * @param {$} opts.elem - jQuery wrapped input element. If omitted, search
     * for DOM element by `#input-${form.name}-${name}` selector.
     */
    constructor(opts) {
        super();
        this.form = opts.form;
        this.name = opts.name;
        this.elem = lookup_form_elem(opts, '#input');
    }

    /**
     * Value of input element.
     *
     * @type {string}
     */
    get value() {
        return this.elem.val();
    }

    set value(value) {
        this.elem.val(value);
    }

    /**
     * Flag whether input is disabled.
     *
     * @type {boolean}
     */
    get disabled() {
        return this.elem.prop('disabled');
    }

    set disabled(value) {
        this.elem.prop('disabled', value);
    }
}

/**
 * Form selection object.
 *
 * @extends FormInput
 * @mixes ClickListenerMixin
 */
export class FormSelect extends changeListener(FormInput) {
    /**
     * Create form select instance.
     *
     * @param {Object} opts - FormSelect options.
     * @param {Form} opts.form - Form instance this selection belongs to.
     * @param {string} opts.name - Selection name.
     * @param {$} opts.elem - jQuery wrapped selection element. If omitted,
     * search for DOM element by `#input-${form.name}-${name}` selector.
     */
    constructor(opts) {
        opts.elem = lookup_form_elem(opts, '#input');
        super(opts);
    }

    /**
     * Selection options.
     *
     * Since HTMLOptionsCollection cannot be instantiated directly, an
     * {Iterable} is expected when setting options. Single options either can
     * be Option instances or Arrays containing key and value.
     *
     * @type {HTMLOptionsCollection}
     */
    get options() {
        return this.elem.prop('options');
    }

    set options(value) {
        this.clear();
        const selection = this.elem[0];
        for (const option of value) {
            if (!(option instanceof Option)) {
                selection.add(new Option(option[1], option[0]));
            } else {
                selection.add(option);
            }
        }
    }

    /**
     * Clear selection options.
     */
    clear() {
        this.elem.empty();
    }
}

/**
 * Form selection which provides fetching options from server.
 *
 * @extends FormSelect
 */
export class FormRemoteSelect extends FormSelect {
    /**
     * Create form remote select instance.
     *
     * @param {Object} opts - FormRemoteSelect options.
     * @param {Form} opts.form - Form instance this selection belongs to.
     * @param {string} opts.name - Selection name.
     * @param {string} opts.vocab - JSON view for fetching options vocabulary.
     * @param {$} opts.elem - jQuery wrapped selection element. If omitted,
     * search for DOM element by `#input-${form.name}-${name}` selector.
     */
    constructor(opts) {
        super(opts);
        this.vocab = opts.vocab;
    }

    /**
     * Fetch vocab from server.
     *
     * @param {Object} params - Request query parameters.
     */
    fetch(params) {
        http_request({
            type: 'json',
            url: this.vocab,
            params: params,
            success: function (data, _status, _request) {
                this.options = data;
            }.bind(this),
        });
    }
}

/**
 * Form checkbox object.
 *
 * @extends FormInput
 * @mixes ClickListenerMixin
 */
export class FormCheckbox extends changeListener(FormInput) {
    /**
     * Create form checkbox instance.
     *
     * @param {Object} opts - FormCheckbox options.
     * @param {Form} opts.form - Form instance this checkbox belongs to.
     * @param {string} opts.name - Checkbox name.
     * @param {$} opts.elem - jQuery wrapped checkbox element. If omitted,
     * search for DOM element by `#input-${form.name}-${name}` selector.
     */
    constructor(opts) {
        opts.elem = lookup_form_elem(opts, '#input');
        super(opts);
    }

    /**
     * Flag whether checkbox is checked.
     *
     * @type {boolean}
     */
    get checked() {
        return this.elem.is(':checked');
    }

    set checked(value) {
        this.elem.prop('checked', value);
    }
}

/**
 * Form field object.
 *
 * @extends Visibility
 */
export class FormField extends Visibility {
    /**
     * Create form field instance.
     *
     * @param {Object} opts - FormRemoteSelect options.
     * @param {Form} opts.form - Form instance this field belongs to.
     * @param {string} opts.name - Field name.
     * @param {FormInput} opts.input - Input this field belongs to. Can be
     * a class or instance of type FormInput. If a class is given, an instance
     * of it gets created which gets passed form and name as arguments.
     * @param {$} opts.elem - jQuery wrapped field element. If omitted,
     * search for DOM element by `#field-${form.name}-${name}` selector.
     */
    constructor(opts) {
        opts.elem = lookup_form_elem(opts, '#field');
        super(opts);
        this.form = opts.form;
        this.name = opts.name;
        let input = opts.input;
        if (input && !(input instanceof FormInput)) {
            input = new input({
                form: this.form,
                name: this.name,
            });
        }
        this.input = input;
    }

    /**
     * Flag indicating field has an error.
     *
     * @type {boolean}
     */
    get has_error() {
        return this.elem.hasClass('has-error');
    }

    set has_error(value) {
        const elem = this.elem;
        if (value) {
            elem.addClass('has-error');
        } else {
            elem.removeClass('has-error');
        }
    }

    /**
     * Reset field.
     *
     * Sets value of related input field, reset error state and remove error
     * text.
     *
     * @param {string} value - New value. Optional and defaults to ''.
     */
    reset(value = '') {
        this.input.value = value;
        this.has_error = false;
        $('.help-block', this.elem).remove();
    }
}

/**
 * Form object.
 */
export class Form {
    /**
     * Initialize form instances found in context.
     *
     * @param {$} context - jQuery wrapped DOM element.
     * @param {Form} factory - Form deriving class.
     * @param {string} name - Form name.
     */
    static initialize(context, factory, name) {
        const elem = query_elem(`#form-${name}`, context, true);
        if (!elem) {
            return;
        }
        const form = new factory({
            name: name,
            elem: elem,
        });
        elem.data(name, form);
    }

    /**
     * Lookup form instance by name.
     *
     * @param {string} name - Form name.
     * @returns {Form} Form instance.
     */
    static instance(name) {
        return $(`#form-${name}`).data(name);
    }

    /**
     * Create form instance.
     *
     * @param {Object} opts - Form options.
     * @param {string} opts.name - Form name.
     * @param {$} opts.elem - jQuery wrapped form element.
     */
    constructor(opts) {
        this.name = opts.name;
        this.elem = opts.elem;
    }

    /**
     * Set visibility for an iterable of fields.
     *
     * @param {Iterable} fields - Iterable containing FormField instances.
     * @param {boolean} visible - Flag whether fields are visible or not.
     */
    set_field_visibility(fields, visible) {
        for (const field of fields) {
            field.visible = visible;
        }
    }
}
