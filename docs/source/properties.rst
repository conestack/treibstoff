Properties
==========

Overview
--------

Properties can be used for some aspects of two-way-binding, like setting
values of HTML inputs and setting attributes or styles to DOM elements, or
bind them to data objects. They also integrate into the event dispatching
mechanism by triggering events on the widget classes if property value changes,
of course only if used on ``Events`` deriving objects.

.. code-block:: js

    import {Events} from 'events'
    import {Property} from 'properties'

    /**
     * Object defining a {Property} where we can listen on changes.
     */
    class MyObject extends Events {

        constructor() {
            // Create property named 'some_prop'.
            new Property(this, 'some_prop');
        }

        /**
         * Default event handler if 'prop' gets changed on an
         * instance of ``MyObject``
         *
         * @param {Object} val - Value the property was set to.
         */
        on_some_prop(val) {
        }
    }

    // Create instance
    let ob = new MyObject();

    // When setting the value of 'some_prop', 'on_some_prop'
    // default handler gets called
    ob.some_prop = 'New Value';