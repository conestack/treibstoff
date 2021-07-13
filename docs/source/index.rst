.. treibstoff documentation master file, created by
   sphinx-quickstart on Tue Jul 13 11:38:39 2021.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to treibstoff's documentation!
======================================

Treibstoff aims to provide a small set of useful javascript tools for writing
browser based applications (or parts of it).

Common SPA frameworks tend to hijack the entire DOM, and then provide all the
fancy templating, two-way-binding, componentization, routing and so on via it's
own API. While they normally provide hooks for "releasing" parts of the DOM
to inject 3rd party Javascript, they all assume themself as base for the entire
application, or at least recommend you to do so. Actually, from a design point
of view a good thing, it's also cumbersome when trying to integrate into or
migrate from some (legacy) Web Application without ending up in an immediate
and entire rewrite when using such frameworks.

Apart from human resources and/or budget available, there may be reasons
to (partly) stick to old fashioned server side rendered web development.
The major one might be to provide parts of the information or functionality
even if Javascript is disabled, but there are others, like implementing
a (data) security model might be easier when sticking to server side rendering.

Treibstoff provides event, widget and property handling basics, heavily
inspired by the ``kivy`` framework.

Widgets are organized as tree, and may relate to a DOM element or part of the
DOM. Each widget is in fact also an event dispatcher, thus motion events or
custom events are delegated directly to member functions of the widget class.

Widget properties can be used for some aspects of two-way-binding, like setting
values of HTML inputs or setting attributes or styles to DOM elements, and
also integrate into the event dispatching mechanism by triggering events on the
widget classes when values changes.

.. toctree::
   :maxdepth: 2
   :caption: Contents:


Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
