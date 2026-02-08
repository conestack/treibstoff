Form
====

Overview
--------

The form module provides abstractions for interactive forms with input
fields, select elements, checkboxes, and field-level visibility and error
handling.

Workflow
~~~~~~~~

1. Add form markup with ``id="form-{name}"`` and matching field/input IDs
2. Call ``Form.initialize(context, FormSubclass, name)`` to create an instance
3. Compose fields with ``FormField`` and input types (``FormInput``,
   ``FormSelect``, ``FormCheckbox``)
4. Use ``field.has_error`` and ``field.reset()`` for validation feedback
5. Use ``form.set_field_visibility(fields, visible)`` for conditional fields

.. code-block:: js

    import {
        Form,
        FormField,
        FormInput,
        FormSelect
    } from 'form';

    class MyForm extends Form {
        // Custom form logic
    }

    // After DOM is ready
    Form.initialize($('body'), MyForm, 'myform');
    let form = Form.instance('myform');

    let name_field = new FormField({
        form: form,
        name: 'name',
        input: FormInput
    });

    // Validation
    if (!name_field.input.value) {
        name_field.has_error = true;
    }

    // Reset
    name_field.reset('default value');

Remote Select
~~~~~~~~~~~~~

``FormRemoteSelect`` fetches options from a JSON endpoint:

.. code-block:: js

    import {FormRemoteSelect} from 'form';

    let select = new FormRemoteSelect({
        elem: $('select#my-select'),
        vocab: '/api/options'
    });
    select.fetch({category: 'active'});

API
---

.. js:autofunction:: lookup_form_elem

|

.. js:autoclass:: FormInput
    :members: value, disabled

.. js:autoclass:: FormSelect
    :members: options, clear

.. js:autoclass:: FormRemoteSelect
    :members: fetch

.. js:autoclass:: FormCheckbox
    :members: checked

.. js:autoclass:: FormField
    :members: has_error, reset

.. js:autoclass:: Form
    :members: initialize, instance, set_field_visibility
