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

The endpoint is must return the requested resource as a JSON
response in the follow inf format:

.. code-block:: js

    {
        mode: 'inner',             // the passed mode
        selector: '#someid',       // the passed selector
        payload: '<div>...</div>', // markup rendered by the action
        continuation: [{}],        // continuation operations
    }


Continuation Operations
~~~~~~~~~~~~~~~~~~~~~~~

The server side may include continuation Ajax operation which gets executed
immediately after the client received the response from ``ajaxaction``,
modified the DOM tree and rebound the response payload.

This is useful if reloading or updating of UI components depends on the
completion of an ajax action (e.g. deleting a resource) or for closing
overlays (e.g. if overlays are used for rendering ajax forms).

The ``continuation`` property of the ``ajaxaction`` reponse contains an array
of operation definitions to execute.

To execute an action operation on continuation, add an object defining:

.. code-block:: js

    {
        'type': 'action',
        'target': 'http://tld.com',
        'name': 'actionname',
        'mode': 'inner',
        'selector': '.foo'
    }

To execute an event operation on continuation, add an object defining:

.. code-block:: js

    {
        'type': 'event',
        'target': 'http://tld.com',
        'name': 'eventname',
        'selector': '.foo',
        'data': {}
    }

The ``data`` property gets set on the event instance on client side and can be
used to pass additional data to custom event handlers.

To execute a path operation on continuation, add an object defining:

.. code-block:: js

    {
        'type': 'path',
        'path': '/some/path',
        'target': 'http://tld.com/some/path',
        'action': 'actionname:.selector:replace',
        'event': 'eventname:.selector',
        'overlay': 'actionname',
        'overlay_css': 'someclass'
    }

To execute an overlay operation on continuation, add an object defining:

.. code-block:: js

    {
        'type': 'overlay',
        'action': 'actionname',
        'css': 'someclass',
        'target': 'http://tld.com',
        'close': false,
        'uid': '1234'
    }

Setting close to ``true``, closes the overlay with ``uid``. The UID gets passed
as ``ajax.overlay-uid`` request parameter to ``ajaxaction`` endpoint when
executing an overlay operation on client side.

An additional continuation feature is to display messages. To display a
message, add an object defining:

.. code-block:: js

    {
        'type': 'message',
        'payload': 'Text or <strong>Markup</strong>',
        'flavor': 'error',
        'selector': null,
    }

Either ``flavor`` or ``selector`` must be given. Flavor causes the message to
be shown in an overlay and could be one of 'message', 'info', 'warning' or
'error'. If selector is given, the message gets displayed as content of the
DOM element identified by this selector. If both flavor and selector is set,
selector is ignored.

**Note** - Be aware that you can provoke infinite loops with continuation
action and event operations, use this features with care.


Forms
~~~~~

Ajax form processing is done by posting the form to a hidden iframe on the
client. Treibstoff not expects a form processing endpoint with a specific name
but in a defined response format:

.. code-block:: html

    <!--
      This is the rendered form payload container. If it's desired
      to stick to the form after sucessful form processing or if a
      validation error occurs, the content of the container is
      taken to rerender the form on the client.
    -->
    <div id="ajaxform">

        <form ajax:form="true"
              id="someform"
              method="post"
              action="http://example.com/myformaction"
              enctype="multipart/form-data">
        </form>

    </div>

    <!--
      This script block reads the form payload from the container
      and passes it among other options to the Ajax singleton.
      Note that this code is executed inside the hidden iframe,
      so the Ajax singleton needs to be accessed via ``parent``.
    -->
    <script language="javascript" type="text/javascript">

        // Get response payload container
        var container = document.getElementById('ajaxform');

        // Extract form DOM element from payload container
        var child = container.firstChild;
        while(child != null && child.nodeType == 3) {
            child = child.nextSibling;
        }

        /**
         * Call ``ts.ajax.form`` on parent frame. It expects the
         * form DOM element, the selector, the DOM manipulation
         * mode, optional continuation operation definitions and
         * a flag whether an error occured while processing the
         * form. The error flag not means a validation error but
         * an exception happened and is needed for proper application
         * state handling.
         */
        parent.ts.ajax.form({
            payload: child,
            selector: '#someform',
            mode: 'replace',
            next: [{}],
            error: false
        });

    </script>


Attribute Reference
-------------------

This section contains a detailed description about all available Ajax operation
related DOM attributes.


Operation
~~~~~~~~~

* ``ajax:bind="click other"``
    Bind an Ajax operation on DOM element. Value contains a space separated list
    of events which triggers the operation. Events can be DOM events or any
    arbitrary custom event.

* ``ajax:target="http://tld.com?param=value"``
    Ajax target definition. Value consists of server target URL and an optional
    query string.

* ``ajax:confirm="Do you really want to do this?"``
    Show confirmation dialog whether to execute the operation. Value contains
    the confirmation message.


Action
~~~~~~

* ``ajax:action="name1:selector1:mode1 name2:selector2:mode2"``
    Perform one or more action operations. Action definitions are colon
    separated. Each action definition consists of a triple containing action
    ``name``, ``selector``  and ``mode``. Selector is a CSS selector defining
    the DOM element(s) which gets affected by the action. Mode defines the DOM
    manipulation mode which can be either ``inner`` or ``replace``.


Event
~~~~~

* ``ajax:event="event1:selector1 event2:selector2"``
    Trigger one or more event operations. Event definitions are colon separated.
    Each event definition consists of a tuple containing event ``name`` and
    ``selector``. Name is the event name and can be any arbitrary custom event.
    Selector is a CSS selector defining the DOM element(s) to receive the event.


Overlay
~~~~~~~

* ``ajax:overlay="actionname"``
    Renders an action operation to an overlay. Value contains the action
    ``name``. Other than ``ajax:action``, value contains only the action name,
    selector mode are implicit.

* ``ajax:overlay-css="someclass"``
    Add an additional CSS class to Overlay DOM element.


Path
~~~~

* ``ajax:path="/some/path"``
    Sets the address bar path and pushes a state object containing operation
    definitions to session history stack if supported by browser.

    If value is ``href``, path gets taken from ``href`` attribute. If value is
    ``target``, path gets taken from event ``ajaxtarget`` property or
    ``ajax:target`` attribute. Otherwise value is taken as is.

    On window ``popstate`` event, the operations defined by
    the state object are executed. Possible operations are action, event and
    overlay.

    If no ajax operation is defined on state, a redirect to target is executed.

    If state object not contains ``_t_ajax`` property, it gets ignored. This
    property is set transparently and ensures that only state objects are
    considered which has been added by path operations.

    ``popstate=1`` is added to requests made by path operations. This is useful
    to determine on server side whether to skip path operation in continuation
    operations.

* ``ajax:path-target="http://tld.com?param=value"``
    Operation target gets taken from ``ajax:path-target`` if set, otherwise
    falls back to target from event ``ajaxtarget`` or ``ajax:target``. If
    ``ajax:path-target`` contains an empty value, target gets taken from
    ``ajax:path``.

* ``ajax:path-action="name:selector:mode"``
    Action operation definition gets taken from ``ajax:path-action`` if set,
    otherwise falls back to ``ajax:action``. If value is empty, action execution
    is suppressed even if ``ajax:action`` is set.

* ``ajax:path-event="evt1:sel1"``
    Event operation definition gets taken from ``ajax:path-event`` if set,
    otherwise falls back to ``ajax:event``. If value is empty, event dispatching
    is suppressed even if ``ajax:event`` is set.

* ``ajax:path-overlay="actionname"``
    Overlay operation definition gets taken from ``ajax:path-overlay`` if set,
    otherwise falls back to ``ajax:overlay``. If value is empty, overlay
    execution is suppressed even if ``ajax:overlay`` is set.

* ``ajax:path-overlay-css="somclass"``
    Additional CSS class for overlay gets taken from ``ajax:path-overlay-css``
    if set, otherwise falls back to ``ajax:overlay-css``.


Form
~~~~

* ``ajax:form``
    Valid on form DOM elements. If set, form gets handles as ajax form and is
    posted to hidden iframe.


API
---

.. js:autoclass:: Ajax
    :members:
        register,
        bind,
        request,
        action,
        trigger,
        path,
        overlay,
        form,
        parse_target,
        parseurl,
        parsequery,
        parsepath,
        parsetarget,
        message,
        info,
        warning,
        error,
        dialog
