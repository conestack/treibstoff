import $ from 'jquery';
import {
    FormCheckbox,
    FormField,
    FormInput,
    FormRemoteSelect,
    FormSelect,
    lookup_form_elem
} from '../src/form.js';

QUnit.module('treibstoff.form', hooks => {
    let container;
    let ajax_orgin = $.ajax;

    hooks.beforeEach(assert => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.afterEach(() => {
        container.remove();
        // Reset $.ajax patch if any
        $.ajax = ajax_orgin;
    });

    QUnit.test('Test lookup_form_elem', assert => {
        let elem = $('<input type="text" />');
        assert.ok(lookup_form_elem({elem: elem}) === elem);

        container.append('<input id="input-formname-fieldname" type="text" />');
        elem = lookup_form_elem({
            form: {name: 'formname'},
            name: 'fieldname'
        }, '#input');
        assert.deepEqual(elem.attr('id'), 'input-formname-fieldname');

        try {
            lookup_form_elem({
                form: {name: 'formname'},
                name: 'inexisting'
            }, '#input');
        } catch (error) {
            assert.step(error);
        }
        assert.verifySteps([
            'Element by selector #input-formname-inexisting not found.'
        ]);
    });

    QUnit.test('Test FormInput', assert => {
        container.append('<input id="input-formname-fieldname" type="text" />');
        let input = new FormInput({
            form: {name: 'formname'},
            name: 'fieldname'
        });
        assert.deepEqual(input.form, {name: 'formname'});
        assert.deepEqual(input.name, 'fieldname');

        assert.deepEqual(input.value, '');
        input.value = 'value';
        assert.deepEqual(input.value, 'value');
        input.value = '';
        assert.deepEqual(input.value, '');

        assert.false(input.disabled);
        input.disabled = true;
        assert.ok(input.disabled);
        input.disabled = false;
        assert.false(input.disabled);

        let elem = $('<input type="text" value="value" disabled="disabled"/>');
        input = new FormInput({elem: elem});
        assert.ok(input.elem === elem);
        assert.ok(input.form === undefined);
        assert.ok(input.name === undefined);

        assert.deepEqual(input.value, 'value');
        input.value = '';
        assert.deepEqual(input.value, '');

        assert.ok(input.disabled);
        input.disabled = false;
        assert.false(input.disabled);
    });

    QUnit.test('Test FormSelect', assert => {
        let elem = $(`
            <select>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
            </select>
        `);
        let selection = new FormSelect({elem: elem});
        let options = [];
        for (let opt of selection.options) {
            options.push([opt.value, opt.text]);
        }
        assert.deepEqual(options, [['1', 'Option 1'], ['2', 'Option 2']]);

        selection.options = [['3', 'Option 3'], ['4', 'Option 4']];
        options = [];
        for (let opt of selection.options) {
            options.push([opt.value, opt.text]);
        }
        assert.deepEqual(options, [['3', 'Option 3'], ['4', 'Option 4']]);

        selection.options = [
            new Option('Option 1', '1'),
            new Option('Option 2', '2')
        ];
        options = [];
        for (let opt of selection.options) {
            options.push([opt.value, opt.text]);
        }
        assert.deepEqual(options, [['1', 'Option 1'], ['2', 'Option 2']]);

        assert.deepEqual(selection.value, '1');
        selection.options[1].selected = true;
        assert.deepEqual(selection.value, '2');

        selection.on('on_change', function(evt) {
            assert.step(this.value);
        }.bind(selection));
        selection.elem.trigger('change');
        assert.verifySteps(['2']);

        container.append(`
            <select id="input-formname-fieldname">
                <option value="a" selected="selected">A</option>
            </select>
        `);
        selection = new FormSelect({
            form: {name: 'formname'},
            name: 'fieldname'
        });
        assert.deepEqual(selection.elem.attr('id'), 'input-formname-fieldname');
        assert.deepEqual(selection.form, {name: 'formname'});
        assert.deepEqual(selection.name, 'fieldname');

        selection.on('on_change', function(evt) {
            assert.step(this.value);
        }.bind(selection));
        selection.elem.trigger('change');
        assert.verifySteps(['a']);

        selection.clear();
        assert.deepEqual(selection.options.length, 0);
    });

    QUnit.test('Test FormRemoteSelect', assert => {
        $.ajax = function(opts) {
            assert.step(JSON.stringify(opts));
            opts.success([['1', 'Option 1'], ['2', 'Option 2']], '200', {});
        }
        let elem = $('<select />');
        let selection = new FormRemoteSelect({
            elem: elem,
            vocab: 'json_vocab'
        });
        selection.fetch({param: 'value'});
        let options = [];
        for (let opt of selection.options) {
            options.push([opt.value, opt.text]);
        }
        assert.deepEqual(options, [['1', 'Option 1'], ['2', 'Option 2']]);
        assert.verifySteps([
            '{' +
                '"url":"json_vocab",' +
                '"dataType":"json",' +
                '"data":{"param":"value"},' +
                '"method":"GET",' +
                '"cache":false' +
            '}'
        ]);
    });

    QUnit.test('Test FormCheckbox', assert => {
        let elem = $('<input type="checkbox" checked="checked" />');
        let cb = new FormCheckbox({elem: elem});
        assert.ok(cb.checked);
        assert.ok(cb.elem.is(':checked'));

        cb.checked = false;
        assert.false(cb.checked);
        assert.false(cb.elem.is(':checked'));

        cb.on('on_change', function(evt) {
            assert.step(this.checked ? 'checked' : 'unchecked');
        }.bind(cb));
        cb.elem.trigger('change');
        assert.verifySteps(['unchecked']);

        container.append(`
            <input type="checkbox" id="input-formname-fieldname" />
        `);
        cb = new FormCheckbox({
            form: {name: 'formname'},
            name: 'fieldname'
        });
        assert.deepEqual(cb.elem.attr('id'), 'input-formname-fieldname');
        assert.deepEqual(cb.form, {name: 'formname'});
        assert.deepEqual(cb.name, 'fieldname');

        assert.false(cb.checked);
        assert.false(cb.elem.is(':checked'));

        cb.checked = true;
        assert.ok(cb.checked);
        assert.ok(cb.elem.is(':checked'));

        cb.on('on_change', function(evt) {
            assert.step(this.checked ? 'checked' : 'unchecked');
        }.bind(cb));
        cb.elem.trigger('change');
        assert.verifySteps(['checked']);
    });

    QUnit.test('Test FormField', assert => {
        let elem = $(`
            <div id="field-formname-fieldname">
              <input id="input-formname-fieldname" type="text" />
            </div>
        `);
        container.append(elem);

        let field = new FormField({
            elem: elem,
            form: {
                elem: container,
                name: 'formname'
            },
            name: 'fieldname',
            input: FormInput
        });
        assert.ok(field.elem === elem);

        assert.deepEqual(field.form.name, 'formname');
        assert.ok(field.form.elem === container);

        assert.deepEqual(field.name, 'fieldname');
        assert.ok(field.input instanceof FormInput);
        assert.deepEqual(
            field.input.elem.attr('id'),
            'input-formname-fieldname'
        );

        assert.false(field.has_error);
        field.has_error = true;
        assert.deepEqual(field.elem.attr('class'), 'has-error');
        field.has_error = false;
        assert.deepEqual(field.elem.attr('class'), '');

        field.input.value = 'value'
        assert.deepEqual(field.input.elem.val(), 'value');
        assert.deepEqual(field.input.value, 'value');

        field.has_error = true;
        field.reset('new value');
        assert.deepEqual(field.input.elem.val(), 'new value');
        assert.deepEqual(field.input.value, 'new value');
        assert.false(field.has_error);

        let field_elem = $(`
            <div class="has-error" id="field-formname-fieldname">
              <input id="input-formname-fieldname" type="text" value="value" />
              <span class="help-block">Error Message</span>
            </div>
        `);
        let input_elem = $('input', field_elem);
        field = new FormField({
            elem: field_elem,
            input: new FormInput({elem: input_elem})
        });
        assert.ok(field.elem === field_elem);

        assert.ok(field.input.elem === input_elem);
        assert.deepEqual(field.input.value, 'value');

        assert.ok(field.has_error);
        assert.deepEqual($('.help-block', field_elem).length, 1);

        field.reset('new value');
        assert.false(field.has_error);
        assert.deepEqual(field.input.value, 'new value');
        assert.deepEqual($('.help-block', field_elem).length, 0);
    });
});
