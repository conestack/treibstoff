import $ from 'jquery';
import {changeListener} from './listener.js';
import {
    get_elem,
    query_elem
} from './utils.js';
import {Visibility} from './widget.js';

/**
 * Form input object.
 */
export class FormInput {

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
        this.form = opts.form,
        this.name = opts.name;
        this.elem = opts.elem || get_elem(
            `#input-${this.form.name}-${this.name}`, this.form.elem, true
        );
    }

    /**
     * Input value.
     *
     * @returns {string} Value of input element.
     */
    get value() {
        return this.elem.val();
    }

    /**
     * Set input value.
     *
     * @param {string} value - Value of input element.
     */
    set value(value) {
        this.elem.val(value);
    }

    /**
     * Input disabled.
     *
     * @returns {boolean} Flag whether input is disabled.
     */
    get disabled() {
        return this.elem.prop('disabled');
    }

    /**
     * Set input disabled.
     *
     * @param {boolean} value - Flag whether input is disabled.
     */
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
     * Selection options.
     *
     * @returns {HTMLOptionsCollection} Selection options.
     */
    get options() {
        return this.elem.prop('options');
    }

    /**
     * Set selection options.
     *
     * @param {Iterable} value - Iterable containing new options. An option
     * either can be Option instances or an Array containing key and value.
     */
    set options(value) {
        this.clear();
        let selection = this.elem[0];
        for (let option of value) {
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
        bdajax.request({
            type: 'json',
            url: this.vocab,
            params: params,
            success: function(data, status, request) {
                this.options = data;
            }.bind(this)
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
     * Checkbox checked.
     *
     * @returns {boolean} Flag whether checkbox is checked.
     */
    get checked() {
        return this.elem.is(':checked');
    }

    /**
     * Set checkbox checked.
     *
     * @param {boolean} value - Flag whether checkbox is checked.
     */
    set checked(value) {
        return this.elem.prop('checked', value);
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
        let form = opts.form,
            name = opts.name,
            input = opts.input;
        opts.elem = opts.elem || get_elem(
            `#field-${form.name}-${name}`, form.elem, true
        );
        super(opts);
        this.form = form;
        this.name = name;
        if (input && !(input instanceof FormInput)) {
            input = new input({
                form: form,
                name: name
            });
        }
        this.input = input;
    }

    /**
     * Flag indicating field has an error.
     *
     * @returns {boolean} `true` if field has an error.
     */
    get has_error() {
        return this.elem.hasClass('has-error');
    }

    /**
     * Set field error.
     *
     * @param {boolean} value - `true` if field has an error.
     */
    set has_error(value) {
        let elem = this.elem;
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
    reset(value='') {
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
        let elem = query_elem(`#form-${name}`, context, true);
        if (!elem) {
            return;
        }
        let form = new factory({
            name: name,
            elem: elem
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
        for (let field of fields) {
            field.visible = visible;
        }
    }
}
