Listener
========

Overview
--------

The listener module provides a factory for creating event listener classes
that bind DOM events to the treibstoff event system.

As a base class:

.. code-block:: js

    import {create_listener} from 'listener';

    let ClickListener = create_listener('click');

    class MyButton extends ClickListener {
        on_click(evt) {
            console.log('Button clicked');
        }
    }

    let btn = new MyButton({elem: $('<button />')});

As a mixin:

.. code-block:: js

    import {clickListener} from 'listener';
    import {Events} from 'events';

    class MyWidget extends clickListener(Events) {
        constructor(opts) {
            super();
            this.elem = opts.elem;
        }

        on_click(evt) {
            console.log('Widget clicked');
        }
    }

The listener can be destroyed to unbind the DOM event:

.. code-block:: js

    let listener = new MyButton({elem: $('<button />')});
    listener.destroy();  // unbinds the click handler

Built-in listener classes: ``ClickListener`` (click events) and
``ChangeListener`` (change events for inputs/selects).

API
---

.. js:autofunction:: create_listener
