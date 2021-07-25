Ajax
====

``treibstoff`` provides a singleton for AJAX operations driven by
XML-attributes. Attributes are defined in its own XML namespace, placed in
the XHTML markup.


Attributes
----------

Following attributes are available:

**ajax:bind="evt1 evt2"**
    Indicate ajax behavior on DOM element and the event(s) triggering
    it/them.

**ajax:event="evt1:sel1 evt2:sel2"**
    Trigger event(s) on selector. The triggered event gets the target
    as additional parameter on event.ajaxtarget.

**ajax:action="name1:selector1:mode1 name2:selector2:mode2"**
    Perform AJAX action(s) on selector with mode. An AJAX action performs a
    request to the server, which may return a HTML snippet. Selector points to
    target DOM element, mode defines how to modify the DOM tree. Possible
    mode values are ``inner`` and ``replace``.

**ajax:target="http://fubar.org?param=value"**
    AJAX target definition. Consists out of target context URL and a
    query string used for requests on the target context.
    ``ajax:target`` is mandatory when ``ajax:event`` is defined, and
    optional when ``ajax:action`` is defined (depends on if event is triggered
    by treibstoff or browser event).

**ajax:confirm="Do you really want to do this?"**
    Show confirmation dialog before actually executing actions and trigger
    events.

**ajax:overlay="actionname"**
    Renders ajax action to overlay.

**ajax:overlay-css="additional-overlay-css-class"**
    Additional CSS class which is added when overlay is opened and removed
    as soon as overlay is closed.

**ajax:form="true"**
    Indicate AJAX form. Valid only on ``form`` elements. Value is ignored.

**ajax:path="/some/path"**
    Sets the browser URL path and pushes history state if supported by browser.
    If value is ``href``, path gets taken from ``href`` attribute. If value is
    ``target`` path gets taken from event ``ajaxtarget`` or ``ajax:target``
    attribute. Otherwise value is taken as defined.

    On ``popstate`` event treibstoff executes the definitions written to state
    object. The state object consists of ``target``, ``action`` and ``event``
    attributes. Execution behaves the way described at ``ajax:action`` and
    ``ajax:event``.

    Target gets taken from ``ajax:path-target`` if set, otherwise falls back
    to target from event ``ajaxtarget`` or ``ajax:target``. If
    ``ajax:path-target`` set with empty value, target gets taken from ``path``.

    Action gets taken from ``ajax:path-action`` if set, otherwise falls back
    to ``ajax:action``. If ``ajax:path-action`` set with empty value, action
    execution on history state change can be suppressed even if ``ajax:action``
    is set.

    Event gets taken from ``ajax:path-event`` if set, otherwise falls back
    to ``ajax:event``. If ``ajax:path-event`` set with empty value, event
    triggering on history state change can be suppressed even if ``ajax:event``
    is set.

    Overlay gets taken from ``ajax:path-overlay`` if set, otherwise falls back
    to ``ajax:overlay``. If ``ajax:path-overlay`` set with empty value, overlay
    triggering on history state change can be suppressed even if
    ``ajax:overlay`` is set.

    Additional CSS class for overlay gets taken from ``ajax:path-overlay-css``
    if set, otherwise falls back to ``ajax:overlay-css``.

    If no action and no event and no overlay defined on history state change,
    treibstoff performs a redirect to target.

    Bdajax appends the request parameter ``popstate=1`` to requests made by
    history browsing. This is useful to determine on server side whether to
    skip setting ajax path as continuation definition.

**ajax:path-target="http://fubar.org?param=value"**
    Can be used in conjunction with ``ajax:path``.

**ajax:path-action="name1:selector1:mode1"**
    Can be used in conjunction with ``ajax:path``.

**ajax:path-event="evt1:sel1"**
    Can be used in conjunction with ``ajax:path``.

**ajax:path-overlay="actionname:selector:content_selector"**
    Can be used in conjunction with ``ajax:path``.

**ajax:path-overlay-css="actionname:selector:content_selector"**
    Can be used in conjunction with ``ajax:path``.

.. note::

    No selectors containing spaces are supported!


Define namespace
----------------

In order to keep your XHTML valid when using the XML namespace extension define
this namespace in the XHTML document:

.. code-block:: html

    <html xmlns="http://www.w3.org/1999/xhtml"
          xmlns:ajax="http://namespaces.conestack.org/ajax">
        ...
    </html>


Event binding
-------------

Indicate AJAX behavior on DOM element:

.. code-block:: html

    <a href="http://fubar.com"
       ajax:bind="keydown click">
      fubar
    </a>

Binds this element to events ``keydown`` and ``click``.


Trigger events
--------------

Bind event behavior to DOM element:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:event="contextchanged:.contextsensitiv"
       ajax:target="http://fubar.com/baz?a=a">
      fubar
    </a>

This causes the ``contextchanged`` event to be triggered on all DOM elements
defining ``contextsensitiv`` css class. The extra attribute ``ajaxtarget`` gets
written to the event before it is triggered, containing definitions from
``ajax:target``.


Set URL path
------------

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


Perform actions
---------------

An action performs a JSON request to the server and modifies the DOM tree as
defined.

treibstoff expects a resource (i.e a zope/pyramid view or some script) named
``ajaxaction`` on server. Resource is called on target url with target query
parameters. Three additional arguments are passed:

**ajax.action**
    name of the action

**ajax.selector**
    given selector must be added to response. Can be ``NONE``, which means
    that no markup is manipulated after action (useful i.e. in combination with
    continuation actions and events).

**ajax.mode**
    the manipulation mode. Either ``inner`` or ``replace`` or ``NONE``
    (see above).

The resource is responsible to return the requested resource as a JSON
response in the format as follows:

.. code-block:: js

    {
        mode: 'inner',             // the passed mode
        selector: '#someid',       // the passed selector
        payload: '<div>...</div>', // markup rendered by the action
        continuation: [{}],        // continuation definitions
    }


Action continuation
~~~~~~~~~~~~~~~~~~~

The ``continuation`` value defines an array of tasks which should
be performed after an ajax action returns. Available continuation
definitions are described below.

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
        'selector': '#ajax-overlay',
        'content_selector': '.overlay_content',
        'css': 'some-css-class',
        'target': 'http://example.com',
        'close': false
    }

Overlays dynamically get a close button. In order to keep overlay contents
easily alterable inside the overlay element an element exists acting as overlay
content container. ``content_selector`` defines the selector of this container.

Setting close to ``true`` closes overlay at ``selector``. In this case
``action`` and target are ignored.

**messages**:

.. code-block:: js

    {
        'type': 'message',
        'payload': 'Text or <strong>Markup</strong>',
        'flavor': 'error',
        'selector': null,
    }

Either ``flavor`` or ``selector`` must be given.
Flavor could be one of 'message', 'info', 'warning', 'error' and map to the
corresponding ``ts.ajax`` UI helper functions. Selector indicates to hook
returned payload at a custom location in DOM tree instead of displaying a
message. In this case, payload is set as contents of DOM element returned by
selector.

If both ``flavor`` and ``selector`` are set, ``selector`` is ignored.

Be aware that you can provoke infinite loops with continuation actions and
events, use this feature sparingly.


Trigger actions directly
~~~~~~~~~~~~~~~~~~~~~~~~

Bind an action which is triggered directly:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:action="renderfubar:.#fubar:replace"
       ajax:target="http://fubar.com/baz?a=a">
      fubar
    </a>

On click the DOM element with id ``fubar`` will be replaced by the results of
action ``renderfubar``. Request context and request params are taken from
``ajax:target`` definition.


Trigger actions as event listener
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Bind an action acting as event listener. See section 'Trigger events'.
A triggered event indicates change of context on target with params.
Hereupon perform some action:

.. code-block:: html

    <div id="content"
         class="contextsensitiv"
         ajax:bind="contextchanged"
         ajax:action="rendercontent:#content:inner">
      ...
    </div>

Note: If binding actions as event listeners, there's no need to define a target
since it is passed along with the event.


Multiple behaviors
------------------

Bind multiple behaviors to the same DOM element:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:event="contextchanged:.contextsensitiv"
       ajax:action="rendersomething:.#something:replace"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:path="/some/path">
      fubar
    </a>

In this example on click event ``contextchanged`` is triggered, action
``rendersomething`` is performed and URL path ``/some/path`` get set.


Confirm actions
---------------

Bdajax can display a confirmation dialog before performing actions or trigger
events:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:event="contextchanged:.contextsensitiv"
       ajax:action="rendersomething:.#something:replace"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:confirm="Do you really want to do this?">
      fubar
    </a>

If ``ajax:confirm`` is set, a modal dialog is displayed before dispatching is
performed.


Overlays
--------

Ajax actions can be rendered to overlay directly by using ``ajax:overlay``:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:overlay="acionname">
      fubar
    </a>

This causes treibstoff to perform action ``acionname`` on context defined in
``ajax:target`` and renders the result to an overlay element.

In addition a selector for the overlay can be defined. This is useful if
someone needs to display multiple overlays:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:overlay="acionname:#custom-overlay">
      fubar
    </a>

Optional to a custom overlay selector a content container selector can be
defined:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:overlay="acionname:#custom-overlay:.custom_overlay_content">
      fubar
    </a>

Overlays can be closed by setting special value ``CLOSE`` at
``ajax:overlay``, optionally with colon seperated overlay selector:

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:overlay="CLOSE:#custom-overlay">
      fubar
    </a>


JavaScript API
--------------

.. js:autoclass:: AjaxMixin

    .. js:autofunction:: parse_target

    |

    .. js:autofunction:: event_target

|

.. js:autoclass:: Ajax

    .. js:autofunction:: register

    |

    .. js:autofunction:: request

    |

    .. js:autofunction:: action

    |

    .. js:autofunction:: trigger

    |

    .. js:autofunction:: path

    |

    .. js:autofunction:: overlay

|

.. js:autoclass:: AjaxDeprecated

    .. js:autofunction:: parseurl

    |

    .. js:autofunction:: parsequery

    |

    .. js:autofunction:: parsepath

    |

    .. js:autofunction:: parsetarget

    |

    .. js:autofunction:: message

    |

    .. js:autofunction:: info

    |

    .. js:autofunction:: warning

    |

    .. js:autofunction:: error

    |

    .. js:autofunction:: dialog


Ajax forms
----------

Forms must have ``ajax:form`` attribute or CSS class ``ajax`` (deprecated)
set in order to be handled by ajax singleton:

.. code-block:: html

    <form ajax:form="True"
          id="my_ajax_form"
          method="post"
          action="http://example.com/myformaction"
          enctype="multipart/form-data">
      ...
    </form>

Ajax form processing is done using a hidden iframe where the form gets
triggered to. The server side must return a response like so on form submit:

.. code-block:: html

    <div id="ajaxform">

        <!-- this is the rendering payload -->
        <form ajax:form="True"
              id="my_ajax_form"
              method="post"
              action="http://example.com/myformaction"
              enctype="multipart/form-data">
          ...
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

        // call ``ts.ajax.render_ajax_form`` on parent frame (remember, we're in
        // iframe here). ``render_ajax_form`` expects the result DOM element,
        // the ``selector``, the fiddle ``mode`` and ``continuation``
        // definitions which may be used to perform ajax continuation.
        parent.ts.ajax.render_ajax_form(child, '#my_ajax_form', 'replace', {});

    </script>

If ``div`` with id ``ajaxform`` contains markup, it gets rendered to
``selector`` (#my_ajax_form) with ``mode`` (replace). This makes it possible
to rerender forms on validation error or display a success page or similar.
Optional continuation definitions can be given.

Again, treibstoff does not provide any server side implementation, it's up to you
providing this.
