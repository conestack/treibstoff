Welcome to treibstoff's documentation!
======================================

Treibstoff aims to provide a small set of useful javascript tools for writing
browser based applications (or parts of it).

Common SPA frameworks tend to hijack the entire DOM, and then provide all the
fancy templating, two-way-binding, componentization, routing and so on via it's
own API. While they normally provide hooks for "releasing" parts of the DOM
to inject 3rd party Javascript, they all assume themself as base for the entire
application, or at least recommend you to do so. Actually, from a design point
of view a good thing, but it's also cumbersome when trying to integrate into or
migrate from some (legacy) Web Application without ending up in an immediate
and entire rewrite when using such frameworks.

Also, apart from human resources and/or budget available, there may be reasons
to (partly) stick to old fashioned server side rendered web development.
The major one might be to provide parts of the information or functionality
on Javascript disabled browsers. But there are others, like implementing
a (data) security model might be easier when sticking to server side rendering.

Treibstoff tries to address this by making no assumptions about who is
responsible for, or how the DOM gets rendered and which other Javascript
libraries are used.


Overview
--------

Treibstoff provides basic event, widget and property handling, inspired by the
``kivy`` framework. It also provides very simple template parsers for
generating DOM from template strings and hooking up elements of interest to
objects. There exist parsers for HTML and SVG.


Event handling
~~~~~~~~~~~~~~

Treibstoff contains an event dispatcher to inherit from. It supports subscribing
and unsubscribing handlers to (named) events and implementing default handlers
for events on the class directly.

.. code-block:: js

    import {Events} from 'events'

    /**
      * Custom event dispatcher.
      */
    class MyDispatcher extends Events {

        /**
         * Default event handler if 'on_my_event' gets triggered on an
         * instance of ``MyDispatcher``
         *
         * @param {Object} options - Options passed to ``tigger``.
         */
        on_my_event(options) {
        }
    }

    /**
     * External subscriber function.
     *
     * @param {Events} inst - ``Events`` instance the ``trigger``
     * function was called on.
     * @param {Object} options - Options passed to ``tigger``.
     */
    let my_subscriber(inst, options) {
    }

    // Create dispatcher
    let dsp = new MyDispatcher();

    // Bind external subscriber function
    dsp.on('on_my_event', my_subscriber);

    // Trigger event
    dsp.trigger('on_my_event', {foo: 'bar'});

    // Unbind external subscriber function.
    dsp.off('on_my_event', my_subscriber);


Properties
~~~~~~~~~~

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


Widgets
~~~~~~~

Widgets represent some part of the UI. They are normally related to DOM
manipulation and/or user interaction. Each widget is an event dispatcher and
knows about it's parent widget.


.. toctree::
   :maxdepth: 2
   :caption: Contents:

   Utils <utils>
   Ajax <ajax>


Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
