Form
====

Overview
--------

The form module provides abstractions for interactive forms with input
fields, select elements, checkboxes, and field-level visibility and error
handling.


Naming Convention
~~~~~~~~~~~~~~~~~

Form elements are found by ID following this pattern:

- Form: ``#form-{name}``
- Input: ``#input-{form.name}-{field.name}``
- Field: ``#field-{form.name}-{field.name}``

.. code-block:: html

    <div id="form-user">
        <div id="field-user-email" class="form-group">
            <label>Email</label>
            <input id="input-user-email" type="email">
        </div>
        <div id="field-user-role" class="form-group">
            <label>Role</label>
            <select id="input-user-role">
                <option value="admin">Admin</option>
                <option value="user">User</option>
            </select>
        </div>
    </div>


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

    class UserForm extends Form {
        constructor(opts) {
            super(opts);
            this.email = new FormField({
                form: this,
                name: 'email',
                input: FormInput
            });
            this.role = new FormField({
                form: this,
                name: 'role',
                input: FormSelect
            });
        }
    }

    // Initialize from DOM context (e.g. in an ajax.register callback)
    Form.initialize($('#content'), UserForm, 'user');

    // Later, look up the form instance
    let form = Form.instance('user');
    form.email.input.value = 'user@example.com';


Checkbox Fields
~~~~~~~~~~~~~~~

.. code-block:: js

    import {Form, FormField, FormCheckbox} from 'form';

    class SettingsForm extends Form {
        constructor(opts) {
            super(opts);
            this.notifications = new FormField({
                form: this,
                name: 'notifications',
                input: FormCheckbox
            });
        }
    }

    let form = Form.instance('settings');
    form.notifications.input.checked = true;
    let isChecked = form.notifications.input.checked;


Remote Select
~~~~~~~~~~~~~

``FormRemoteSelect`` fetches options from a JSON endpoint. The server must
return a JSON array of ``[value, label]`` pairs:

.. code-block:: js

    import {Form, FormField, FormRemoteSelect} from 'form';

    class ProjectForm extends Form {
        constructor(opts) {
            super(opts);
            this.category = new FormField({
                form: this,
                name: 'category',
                input: new FormRemoteSelect({
                    form: this,
                    name: 'category',
                    vocab: '/api/categories.json'
                })
            });
        }

        load_categories(filter) {
            // Fetches JSON from /api/categories.json?q=filter
            this.category.input.fetch({q: filter});
        }
    }


Programmatic Options
~~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    let form = Form.instance('project');
    // Set options (array of [value, label] pairs)
    form.category.input.options = [
        ['opt1', 'Option 1'],
        ['opt2', 'Option 2']
    ];

    // Clear all options
    form.category.input.clear();

    // Read current value
    let selected = form.category.input.value;


Field Visibility and Error State
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: js

    let form = Form.instance('user');

    // Hide/show a field
    form.email.visible = false;
    form.email.visible = true;

    // Bulk visibility
    form.set_field_visibility([form.email, form.role], false);

    // Error state
    form.email.has_error = true;   // adds 'has-error' class
    form.email.has_error = false;  // removes it

    // Reset field (clear value, remove error, remove help text)
    form.email.reset();
    form.email.reset('default@example.com');  // reset with default value


Change Events
~~~~~~~~~~~~~

``FormSelect`` and ``FormCheckbox`` use the ``changeListener`` mixin, which
triggers ``on_change`` when the user interacts with the element:

.. code-block:: js

    class FilterForm extends Form {
        constructor(opts) {
            super(opts);
            this.status = new FormField({
                form: this,
                name: 'status',
                input: FormSelect
            });
            this.status.input.on('on_change', function(inst, evt) {
                console.log('Status changed to:', inst.value);
            });
        }
    }


Ajax Form Submission
~~~~~~~~~~~~~~~~~~~~

Forms marked with ``class="ajax"`` or ``ajax:form="true"`` are submitted via a
hidden iframe. The server response calls ``ts.ajax.form()`` to update the DOM:

.. code-block:: html

    <form id="form-user" class="ajax"
          action="/users/save" method="POST">
        <div id="field-user-name">
            <input id="input-user-name" name="name">
        </div>
        <button type="submit">Save</button>
    </form>

See :doc:`Ajax <ajax>` for details on server-side response format.


Complete Example
~~~~~~~~~~~~~~~~

.. code-block:: html

    <div id="form-task">
        <div id="field-task-title" class="form-group">
            <label>Title</label>
            <input id="input-task-title" type="text">
        </div>
        <div id="field-task-priority" class="form-group">
            <label>Priority</label>
            <select id="input-task-priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
        </div>
        <div id="field-task-done" class="form-group">
            <input id="input-task-done" type="checkbox">
            <label>Done</label>
        </div>
    </div>

.. code-block:: js

    import ts from 'treibstoff';

    class TaskForm extends ts.Form {
        constructor(opts) {
            super(opts);
            this.title = new ts.FormField({
                form: this, name: 'title', input: ts.FormInput
            });
            this.priority = new ts.FormField({
                form: this, name: 'priority', input: ts.FormSelect
            });
            this.done = new ts.FormField({
                form: this, name: 'done', input: ts.FormCheckbox
            });

            this.priority.input.on('on_change', this.on_priority_change.bind(this));
        }

        on_priority_change(inst, evt) {
            if (inst.value === 'high') {
                this.title.elem.addClass('text-danger');
            } else {
                this.title.elem.removeClass('text-danger');
            }
        }

        validate() {
            let valid = true;
            if (!this.title.input.value.trim()) {
                this.title.has_error = true;
                valid = false;
            }
            return valid;
        }
    }

    $(function() {
        ts.ajax.register(function(context) {
            ts.Form.initialize(context, TaskForm, 'task');
        }, true);
    });


Pitfalls
~~~~~~~~

- **Element IDs must follow the naming convention** (``#form-{name}``,
  ``#input-{form}-{field}``, ``#field-{form}-{field}``). If elements aren't
  found, pass them explicitly via ``opts.elem``.

- **``FormField`` wraps both the field container and the input.** Access the
  input via ``field.input``. The field itself provides visibility and error
  state.

- **``FormField`` accepts an input class or instance.** Pass ``FormInput``
  (class) and it creates the instance. Pass ``new FormRemoteSelect(...)``
  (instance) for pre-configured inputs.

- **``FormRemoteSelect.fetch()`` is async.** The select options are populated
  when the HTTP request completes.

- **``Form.initialize()`` silently returns** if the form element is not found
  in the given context. This is by design — forms may not be present on
  every page.


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
