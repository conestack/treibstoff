import $ from 'jquery';
import {
    FormInput,
    lookup_form_elem
} from '../src/form.js';

QUnit.module('treibstoff.form', hooks => {
    let container;

    hooks.before(assert => {
        container = $('<div></div>');
        $('body').append(container);
    });

    hooks.after(() => {
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
});
