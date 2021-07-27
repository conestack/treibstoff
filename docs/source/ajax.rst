Ajax
====

Overview
--------

Treibstoff provides an Ajax mechanism to integrate Server-Side Rendering (SSR)
into Single-Page Applications (SPA), driven by XML-Attributes on the HTML
markup.

Therefor a set of Ajax operations is provided. The actual Server-Side Rendering
is done by an endpoint named ``ajaxaction``, which gets called with information
provided via the Ajax related DOM attributes.


XML Namespace
~~~~~~~~~~~~~

Ajax related attributes are defined in its own XML namespace.

Define this namespace on the HTML document:

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

The ``ajax:target`` attribute contains the ``Server Target`` on which the
``ajaxaction`` is called, and consists of the base URL and may include query
parameters which get passed to the server:

.. code-block:: html

    <a ajax:bind="click"
       ajax:target="https://tld.com/resource?param=value">
      Click me!
    </a>

The target in this example results in in URL
``https://tld.com/resource/ajacaction?param=value``. The user needs to make
sure to provide the appropriate endpoint on the server, e.g. via URL dispatching
or traversal.


Perform Actions
~~~~~~~~~~~~~~~

The actual Server-Side Rendering is triggered by defining the ``ajax:action``
attribute. It contains a colon seperated triple with the action ``name``, a
``selector`` which identifies the DOM element to modify with the response and
a DOM modification ``mode``:

.. code-block:: html

    <a ajax:bind="click"
       ajax:action="rendersomething:.#element-id:replace"
       ajax:target="http://tld.com?param=value">
      Click me!
    </a>

Now, when the link gets clicked, the DOM element with id ``#element-id`` is
replaced by the results of action ``rendersomething``. The server target is
taken from ``ajax:target`` attribute.


Trigger Events
~~~~~~~~~~~~~~

When adding ``ajax:event`` attribute, an event gets triggered to all elements
defined by selector. The event instance provides the defined target.

.. code-block:: html

    <a ajax:bind="click"
       ajax:event="update_something:.something-tp-update"
       ajax:target="http://tld.com/resource?param=value">
      Click me!
    </a>

This causes ``update_something`` event being triggered on all DOM elements with
``something-to-update`` CSS class set when the link gets clicked. The target
gets written on the event at property ``ajaxtarget``.

This feature is useful when providing actions which can be triggered from several
places in the application. The event receiving DOM element contains the action
definition:

.. code-block:: html

    <div id="#something"
         class="something-to-update"
         ajax:bind="update_something"
         ajax:action="rendersomething:#something:replace">
    </div>

If binding actions which get triggered by Ajax event operations, there's no
need to define the target as it gets passed along with the event.


Overlays Actions
~~~~~~~~~~~~~~~~

The overlay operation is a special kind of action operation, which renders
the result of the action into an overlay. This is achieved by defining
``ajax:overlay`` attribute on the DOM element.:

.. code-block:: html

    <a ajax:bind="click"
       ajax:target="http://tld.com/some/path?param=value"
       ajax:overlay="rendersomething">
      Click me!
    </a>

Other than ``ajax:action``, the value of ``ajax:overlay`` contains only the
action ``name``, since ``selector`` and ``mode`` are implicit due to the use
of the ``Overlay`` widget.

Overlays can be closed by setting special value ``CLOSE`` to ``ajax:overlay``,
colon seperated followed by the overlay UID, which gets passed as
``ajax.overlay-uid`` request parameter to the server:

.. code-block:: html

    <a ajax:bind="click"
       ajax:overlay="CLOSE:12345">
      Click me!
    </a>


Confirming Operations
~~~~~~~~~~~~~~~~~~~~~

By defining ``ajax:confirm`` attribute on the DOM element, a confirmation
dialog gets displayed with the value of this attribute as dialog text, and
executes the operation only if th user confirms it:

.. code-block:: html

    <a ajax:action="rendersomething:.#something:replace"
       ajax:target="http://tld.com/some/path?param=value"
       ajax:confirm="Do you really want to do this?">
      Click me!
    </a>


Browser History
~~~~~~~~~~~~~~~

To provide a sane browser history, ``ajax:path`` and related attribute are
provided. The path operation causes Ajax operation definitions to be written
to the browser's session history stack. The path operation listens to the
window's popstate event and executes the Ajax operations contained in state if
any.

Treibstoff not provides a client side SPA routing mechanism. If the URL under
path is supposed to display the same contents as the outcome of the Ajax
operations when entered directly in the URL bar, the server side is responsible
to render it accordingly.

It is totally sane to use the history stack in your own Jacascript as long as
the pushed state objects not contains a property named ``_t_ajax``, which is
used to detect Ajax operations on popstate. Also make sure to unbind only
custom popstate handles from window on cleanup to avoid breaking Ajax history
handling.

How the path is extracted from ``ajax:path`` follow these rules:

* When value is set to ``target``, path gets extracted from ``ajax:target``
  attribute including request parameters. This is the most common use.

* When value is set to ``href`` and DOM element is a link, path gets taken
  from there.

* When setting it to a dedicated path, e.g. ``/some/path``, it is used as
  defined. This is in particular useful if the operation target contains
  request parameters but the path should not.

The following example add an Ajax action operation to the browser histroy stack:

.. code-block:: html

    <a ajax:bind="click"
       ajax:target="https://tld.com/some/path?param=value"
       ajax:path="target"
       ajax:path-action="rendersomething:#something:replace">
      Click me!
    </a>

For a full documentation about the path operation related attributes, see
``AjaxPath`` docs.


Operation Execution Order
~~~~~~~~~~~~~~~~~~~~~~~~~

When defining multiple Ajax operations on a single DOM element, they get
executed in the following order:

1. If a confirmation disalog is requested, it gets displayed first.
2. Action operation gets dispatched if defined.
3. Event operation gets dispatched if defined.
4. Overlay operation gets dispatched if defined.
5. Path operation gets dispatched if defined.


Ajax Forms
~~~~~~~~~~

Forms can be "ajaxified" by adding either ``ajax:form`` attribute or the CSS
class ``ajax`` to the ``form`` DOM element. The value of ``ajax:form`` can
be arbitrary:

.. code-block:: html

    <form ajax:form="true"
          id="someform"
          method="post"
          action="http://example.com/some/path/formendpoint"
          enctype="multipart/form-data">
    </form>

Unlike the other operations, Ajax forms are no "real" Ajax operation in terms
of the implementation. Under the hood, Ajax forms are posted to a hidden
``iframe``, and a defined response format is expected from the server
implementation processing the form. This approach is chosen to avoid common
problems with file uploads and Ajax forms.

The form ``action`` URL gets called as is, it's up to the user to provide the
Server implementation rendering the expected response.

See Server Side Documentation for details how to proper implement
Ajax form responses.


Server Side
-----------

Treibstoff not provides any SSR implementation. It's up to the user to
implement the required enpoints on the server.


Ajax Action
~~~~~~~~~~~

When executing Ajax actions, a JSON request gets send to the ``ajaxaction``
endpoint on server target (see 'Define Target').

The following request parameters are passed (additional to the one defined on
the action target):

* ``ajax.action``
    Name of the requested action.

* ``ajax.selector``
    DOM element selector for action. It must be added to response response.
    Can be ``NONE``, which means that no markup is manipulated after action.
    This is useful in combination with continuation operations.

* ``ajax.mode``
    The DOM manipulation mode. Either ``inner`` or ``replace`` or ``NONE``
    (see above).

* ``ajax.overlay-uid``
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


Forms
~~~~~

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


Ajax Operation
~~~~~~~~~~~~~~

.. js:autoclass:: AjaxOperation
    :members: constructor, execute, handle


Path Operation
~~~~~~~~~~~~~~

.. js:autoclass:: AjaxPath
    :members: execute


Action Operation
~~~~~~~~~~~~~~~~

.. js:autoclass:: AjaxAction
    :members: execute


Event Operation
~~~~~~~~~~~~~~~

.. js:autoclass:: AjaxEvent
    :members: execute


Overlay Operation
~~~~~~~~~~~~~~~~~

.. js:autoclass:: AjaxOverlay
    :members: execute


Ajax Utilities
~~~~~~~~~~~~~~

.. js:autoclass:: AjaxUtil
    :members: parse_target, parse_definition, action_target


Ajax Singleton
~~~~~~~~~~~~~~

.. js:autoclass:: Ajax
    :members:
        register,
        request,
        action,
        trigger,
        path,
        overlay,
        bind,
        parseurl,
        parsequery,
        parsepath,
        parsetarget,
        message,
        info,
        warning,
        error,
        dialog
