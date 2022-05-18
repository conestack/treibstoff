import $ from 'jquery';
import {
    FormInput,
    FormSelect,
    lookup_form_elem
} from '../src/form.js';

QUnit.module('treibstoff.form', hooks => {
    let container;

    hooks.beforeEach(assert => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.afterEach(() => {
        container.remove();
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
});
