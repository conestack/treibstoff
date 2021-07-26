Ajax
====

Overview
--------

Treibstoff provides an Ajax mechanism to integrate server side rendering into
a SPA Application driven by XML-Attributes on the HTML markup. These attributes
are defined in its own XML namespace.

Therefor a set of Ajax operations is provided. The actual server side rendering
is done by a resource named ``ajaxaction``, which gets called with information
provided via the Ajax related DOM attributes.


Define Namespace
~~~~~~~~~~~~~~~~

To keep your HTML valid when using the XML namespace extension define this
namespace on the HTML document:

.. code-block:: html

    <html xmlns="http://www.w3.org/1999/xhtml"
          xmlns:ajax="http://namespaces.conestack.org/ajax">
    </html>


Bind Operations
~~~~~~~~~~~~~~~

Ajax operations are bound to DOM elements by adding ``ajax:bind`` attribute
containing a space separated list of event names to bind. These can be
DOM events or any kind of custom event:

.. code-block:: html

    <a ajax:bind="click">
      Click me!
    </a>

All following Ajax related DOM attributes have no effect (except ``ajax:form``,
see Forms), without getting bound to one or more events.


Define a Target
~~~~~~~~~~~~~~~

The ``ajax:target`` attribute contains the base URL on which the server side
``ajaxaction`` is called, and may include query parameters which get passed to
the server:

.. code-block:: html

    <a ajax:bind="click"
       ajax:target="https://tld.com/resource?param=value">
      Click me!
    </a>

When performing Ajax actions, this target results in URL
``https://tld.com/resource/ajacaction?param=value``. The user needs to make
sure to provide the appropriate server endpoint, e.g. via URL dispatching or
traversal.


Trigger Events
~~~~~~~~~~~~~~

When adding ``ajax:event`` attribute, an event gets triggered to all elements
defined by selector including the defined target.

.. code-block:: html

    <a ajax:bind="click"
       ajax:event="some_event:.listen_to_some_event"
       ajax:target="http://tld.com/resource?param=value">
      Click me!
    </a>

This causes ``some_event`` being triggered on all DOM elements with
``listen_to_some_event`` CSS class set when the link gets clicked. The target
gets written on the event at attribute ``ajaxtarget`` before it is triggered.

This feature is useful when defining actions which can be triggered from several
places in the application.


Browser History
---------------

Set path directly, triggers event on history state change:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:path="/some/path"
       ajax:path-event="contextxhanged:#layout">
      fubar
    </a>

Take path from target, performs action on history state change:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:path="target"
       ajax:path-action="layout:#layout:replace">
      fubar
    </a>

Take path from href attribute, trigger overlay:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:path="href"
       ajax:path-overlay="acionname:#custom-overlay:.custom_overlay_content">
      fubar
    </a>


Perform Actions
---------------

An action performs a JSON request to the server and modifies the DOM tree as
defined.

Treibstoff expects a resource (i.e a zope/pyramid view or some script) named
``ajaxaction`` on server. Resource is called on target url with target query
parameters. The following additional arguments are passed:

**ajax.action**
    Name of the action.

**ajax.selector**
    Given selector must be added to response. Can be ``NONE``, which means
    that no markup is manipulated after action (useful i.e. in combination with
    continuation operations).

**ajax.mode**
    The DOM manipulation mode. Either ``inner`` or ``replace`` or ``NONE``
    (see above).

**ajax.overlay-uid**
    This parameter gets additionally set if performing an overlay operation.

The resource is responsible to return the requested resource as a JSON
response in the format as follows:

.. code-block:: js

    {
        mode: 'inner',             // the passed mode
        selector: '#someid',       // the passed selector
        payload: '<div>...</div>', // markup rendered by the action
        continuation: [{}],        // continuation operations
    }


Continuation Operations
~~~~~~~~~~~~~~~~~~~~~~~

The ``continuation`` value defines an array of tasks which should
be performed after an Ajax action returns. Available continuation
operations are described below.

**actions**:

.. code-block:: js

    {
        'type': 'action',
        'target': 'http://example.com',
        'name': 'actionname',
        'mode': 'inner',
        'selector': '.foo'
    }

**events**:

.. code-block:: js

    {
        'type': 'event',
        'target': 'http://example.com',
        'name': 'eventname',
        'selector': '.foo',
        'data': {}
    }

**path**:

.. code-block:: js

    {
        'type': 'path',
        'path': '/some/path',
        'target': 'http://example.com/some/path',
        'action': 'actionname:.selector:replace',
        'event': 'contextchanged:#layout',
        'overlay': 'acionname:#custom-overlay:.custom_overlay_content',
        'overlay_css': 'some-css-class'
    }

**overlay**:

.. code-block:: js

    {
        'type': 'overlay',
        'action': 'actionname',
        'css': 'some-css-class',
        'target': 'http://example.com',
        'close': false,
        'uid': '1234'
    }

Setting close to ``true`` closes overlay with ``uid``. The UID gets passed as
``ajax.overlay-uid`` request parameter.

**messages**:

.. code-block:: js

    {
        'type': 'message',
        'payload': 'Text or <strong>Markup</strong>',
        'flavor': 'error',
        'selector': null,
    }

Either ``flavor`` or ``selector`` must be given. Flavor could be one of
'message', 'info', 'warning' or 'error'. Selector indicates to hook
returned payload at a custom location in DOM tree instead of displaying an
overlay message. In this case, payload is set as contents of DOM element
returned by selector.

If both ``flavor`` and ``selector`` are set, ``selector`` is ignored.

**note** - Be aware that you can provoke infinite loops with continuation
actions and events, use this feature with care.


Direct Actions
~~~~~~~~~~~~~~

Bind an action which is triggered directly:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:action="renderfubar:.#fubar:replace"
       ajax:target="http://fubar.com/baz?a=a">
      fubar
    </a>

On click the DOM element with id ``fubar`` will be replaced by the results of
action ``renderfubar``. Request context and parameters are taken from
``ajax:target`` definition.


Actions by Event
~~~~~~~~~~~~~~~~

Bind an action as event listener. See section 'Trigger events'.
A triggered event indicates change of context on target with parameters.

.. code-block:: html

    <div id="content"
         class="contextsensitiv"
         ajax:bind="contextchanged"
         ajax:action="rendercontent:#content:inner">
    </div>

**note** - If binding actions as event listeners, there's no need to define a target
since it is passed along with the event.


Multiple Operations
-------------------

Bind multiple operations on the same DOM element:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:event="contextchanged:.contextsensitiv"
       ajax:action="rendersomething:.#something:replace"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:path="/some/path">
      foo
    </a>

In this example, click event ``contextchanged`` gets triggered, action
``rendersomething`` is performed and URL path ``/some/path`` gets set.


Confirming Operations
---------------------

Treibstoff can display a confirmation dialog before performing ajax operations:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:event="contextchanged:.contextsensitiv"
       ajax:action="rendersomething:.#something:replace"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:confirm="Do you really want to do this?">
      fubar
    </a>

If ``ajax:confirm`` is set, a modal dialog gets displayed before dispatching
operations.


Overlays
--------

Ajax actions can be rendered to and overlay directly by using ``ajax:overlay``:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:overlay="acionname">
      fubar
    </a>

This causes treibstoff to perform action ``acionname`` on context defined in
``ajax:target`` and renders the result to an overlay element.

Overlays can be closed by setting special value ``CLOSE`` at
``ajax:overlay``, colon seperated followed by the overlay UID (which gets
passed as ``ajax.overlay-uid`` request parameter):

.. code-block:: html

    <a href="#"
       ajax:bind="click"
       ajax:overlay="CLOSE:12345">
      foo
    </a>


Forms
-----

Forms must have ``ajax:form`` attribute or CSS class ``ajax``
set in order to be handled:

.. code-block:: html

    <form ajax:form="True"
          id="my_ajax_form"
          method="post"
          action="http://example.com/myformaction"
          enctype="multipart/form-data">
    </form>

Ajax form processing is done using a hidden iframe where the form gets
triggered to. The server side must return a response in the following format:

.. code-block:: html

    <div id="ajaxform">

        <!-- this is the rendering payload -->
        <form ajax:form="True"
              id="my_ajax_form"
              method="post"
              action="http://example.com/myformaction"
              enctype="multipart/form-data">
        </form>

    </div>

    <script language="javascript" type="text/javascript">

        // get response result container
        var container = document.getElementById('ajaxform');

        // extract DOM element to fiddle from result container
        var child = container.firstChild;
        while(child != null && child.nodeType == 3) {
            child = child.nextSibling;
        }

        // call ``ts.ajax.form`` on parent frame (remember, we're in
        // iframe here). ``form`` expects the result DOM element,
        // the ``selector``, the DOM manipulation ``mode``, ``continuation``
        // operations and a flag wgether an error occured while form processing
        // (error not means a form validation error).
        parent.ts.ajax.form({
            payload: child,
            selector: '#my_ajax_form',
            mode: 'replace',
            next: {},
            error: false
        });

    </script>

If ``div`` with id ``ajaxform`` contains markup, it gets rendered to
``selector`` (#my_ajax_form) with ``mode`` (replace). This makes it possible
to re-render forms on validation error or display a success page or similar.
Optional continuation operations can be given.

Treibstoff not ships a server side implementation, it's up to the user
providing one.


API
---

Spinner Animation
~~~~~~~~~~~~~~~~~

.. js:autoclass:: AjaxSpinner
    :members: show, hide


XMLHttpRequest
~~~~~~~~~~~~~~

.. js:autoclass:: AjaxRequest
    :members: execute


Ajax Operations
~~~~~~~~~~~~~~~

.. js:autoclass:: AjaxOperation
    :members: constructor, execute, handle


Ajax Utilities
~~~~~~~~~~~~~~

.. js:autoclass:: AjaxUtil
    :members: parse_target, parse_definition, event_target


Ajax Singleton
~~~~~~~~~~~~~~

.. js:autoclass:: Ajax
    :members: register, request, action, trigger, path, overlay, bind, parseurl, parsequery, parsepath, parsetarget, message, info, warning, error, dialog
