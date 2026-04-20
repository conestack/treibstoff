# Building Forms

This guide explains how to build forms with treibstoff's form system, including
validation, remote data fetching, and Ajax submission.

## Context

Treibstoff provides a form abstraction layer on top of DOM form elements. The
`Form` class manages form-level operations, while `FormInput`, `FormField`,
`FormSelect`, `FormCheckbox`, and `FormRemoteSelect` wrap individual elements
with reactive getters/setters and event handling.

## Key API

| Class/Function | Purpose |
|----------------|---------|
| `ts.Form` | Form container — initialize, lookup, field visibility |
| `ts.FormInput` | Input wrapper — value, disabled state |
| `ts.FormField` | Field wrapper — visibility, error state, reset |
| `ts.FormCheckbox` | Checkbox wrapper — checked state |
| `ts.FormSelect` | Select wrapper — options, clear |
| `ts.FormRemoteSelect` | Select with server-side option fetching |
| `ts.lookup_form_elem` | Find form element by naming convention |

## Naming Convention

Form elements are found by ID following this pattern:

- Form: `#form-{name}`
- Input: `#input-{form.name}-{field.name}`
- Field: `#field-{form.name}-{field.name}`

```html
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
```

## Pattern 1: Basic Form with Fields

```javascript
import ts from 'treibstoff';

class UserForm extends ts.Form {
    constructor(opts) {
        super(opts);
        this.email = new ts.FormField({
            form: this,
            name: 'email',
            input: ts.FormInput
        });
        this.role = new ts.FormField({
            form: this,
            name: 'role',
            input: ts.FormSelect
        });
    }
}

// Initialize from DOM context (e.g. in an ajax.register callback)
ts.Form.initialize($('#content'), UserForm, 'user');

// Later, look up the form instance
let form = ts.Form.instance('user');
form.email.input.value = 'user@example.com';
```

## Pattern 2: Checkbox Fields

```html
<div id="form-settings">
    <div id="field-settings-notifications">
        <input id="input-settings-notifications" type="checkbox">
        <label>Enable notifications</label>
    </div>
</div>
```

```javascript
class SettingsForm extends ts.Form {
    constructor(opts) {
        super(opts);
        this.notifications = new ts.FormField({
            form: this,
            name: 'notifications',
            input: ts.FormCheckbox
        });
    }
}

// Read/set checkbox state
let form = ts.Form.instance('settings');
form.notifications.input.checked = true;
let isChecked = form.notifications.input.checked;
```

## Pattern 3: Remote Select (Server-Fetched Options)

```javascript
class ProjectForm extends ts.Form {
    constructor(opts) {
        super(opts);
        this.category = new ts.FormField({
            form: this,
            name: 'category',
            input: new ts.FormRemoteSelect({
                form: this,
                name: 'category',
                vocab: '/api/categories.json'
            })
        });
    }

    load_categories(filter) {
        // Fetches JSON from /api/categories.json?q=filter
        // Server must return array of [value, label] pairs
        this.category.input.fetch({q: filter});
    }
}
```

The server must return a JSON array of `[value, label]` pairs:
```json
[["cat1", "Category 1"], ["cat2", "Category 2"]]
```

## Pattern 4: Select with Programmatic Options

```javascript
let form = ts.Form.instance('project');
// Set options (array of [value, label] pairs or Option objects)
form.category.input.options = [
    ['opt1', 'Option 1'],
    ['opt2', 'Option 2']
];

// Clear all options
form.category.input.clear();

// Read current value
let selected = form.category.input.value;
```

## Pattern 5: Field Visibility and Error State

```javascript
let form = ts.Form.instance('user');

// Hide a field
form.email.visible = false;
form.email.hidden = true;  // equivalent

// Show a field
form.email.visible = true;

// Bulk visibility
form.set_field_visibility([form.email, form.role], false);

// Error state
form.email.has_error = true;   // adds 'has-error' class
form.email.has_error = false;  // removes it

// Reset field (clear value, remove error, remove help text)
form.email.reset();
form.email.reset('default@example.com');  // reset with default value
```

## Pattern 6: Change Events

`FormSelect` and `FormCheckbox` use the `changeListener` mixin, which triggers
`on_change` when the user interacts with the element.

```javascript
class FilterForm extends ts.Form {
    constructor(opts) {
        super(opts);
        this.status = new ts.FormField({
            form: this,
            name: 'status',
            input: ts.FormSelect
        });
        // Listen for selection changes
        this.status.input.on('on_change', function(inst, evt) {
            console.log('Status changed to:', inst.value);
        });
    }
}
```

## Pattern 7: Template-Based Form Inputs

For forms built with `compile_template`, use `t-prop` attributes to create
`InputProperty` bindings:

```javascript
class InlineForm extends ts.Widget {
    constructor(opts) {
        super({parent: opts.parent});
        ts.compile_template(this, `
            <div class="inline-form">
                <input t-elem="name_input" t-prop="name" t-val="Default">
                <input t-elem="count_input" t-prop="count"
                       t-type="number" t-val="0">
            </div>
        `, opts.container);
        // this.name is now an InputProperty
        // this.count is an InputProperty with number extraction
    }

    on_name(val) {
        console.log('Name changed to:', val);
    }

    on_count(val) {
        console.log('Count changed to:', val);  // val is a number
    }
}
```

## Pattern 8: Ajax Form Submission

Forms marked with `class="ajax"` or `ajax:form="true"` are submitted via a
hidden iframe. The server response calls `ts.ajax.form()` to update the DOM.

```html
<form id="form-user" class="ajax"
      action="/users/save" method="POST">
    <div id="field-user-name">
        <input id="input-user-name" name="name">
    </div>
    <button type="submit">Save</button>
</form>
```

The server-side handler processes the form and returns an HTML page in the
iframe that calls:

```html
<script>
    parent.ts.ajax.form({
        payload: '...new form HTML...',
        selector: '#form-user',
        mode: 'replace',
        next: [
            {type: 'message', payload: 'Saved!', flavor: 'info'}
        ],
        error: false
    });
</script>
```

## Complete Example

```html
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
```

```javascript
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

    reset_all() {
        this.title.reset();
        this.priority.input.value = 'medium';
        this.done.input.checked = false;
    }
}

$(function() {
    ts.ajax.register(function(context) {
        ts.Form.initialize(context, TaskForm, 'task');
    }, true);
});
```

## Pitfalls

1. **Element IDs must follow the naming convention** (`#form-{name}`,
   `#input-{form}-{field}`, `#field-{form}-{field}`). If elements aren't found,
   pass them explicitly via `opts.elem`.

2. **`FormField` wraps both the field container and the input.** Access the
   input via `field.input`. The field itself provides visibility and error state.

3. **`FormField` accepts an input class or instance.** Pass `ts.FormInput` (class)
   and it creates the instance. Pass `new ts.FormRemoteSelect(...)` (instance)
   for pre-configured inputs.

4. **`FormRemoteSelect.fetch()` is async.** The select options are populated
   when the HTTP request completes.

5. **`Form.initialize()` silently returns if the form element is not found**
   in the given context. This is by design — forms may not be present on
   every page.
