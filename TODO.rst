TODO
====

[ ] - Conventions:
    - ``opts`` passed to widget constructors.
    - Widget lifecycle -> constructor -> compile -> update -> destroy.
    - Naming - Events always ``on_*`` (on_down, on_move, on_up).
    - Renaming - unload -> destroy
    - Event callback naming -> handler, listener or subscriber?
    - Strict distinction between DOM event and TS event in docs
    - Do we want ``ts`` as namespace shortcut? Possible confusion with typescript.
      Alternative?

[ ] - Add mechanism to control overlay size.

[ ] - Fix collapsible widget.

[ ] - Either include jquery and bootstrap dist here or create dedicated
      delivery package with webresource declarations.

[ ] - Use ``document.createTreeWalker`` in parsers.

[ ] - ``AjaxOperation.handle()`` API consolidation. Instead of ``opts``, all
      ``AjaxOperation`` deriving objects gets passed ``elem`` and ``event`` as
      arguments.

[ ] - Dedicated ``ajax:event`` and ``ajax:action`` parsing, to allow spaces and
      colon in selectors.

[ ] - Add ``ajax:selector``, ``ajax:mode`` attributes. and ``ajax:data``
      attributes.

[ ] - Overlay continuation definition should contain ``overlay`` instead of
      ``action``.

[ ] - Rename ``Ajax*`` to ``SSR*``.
    - Change all ``ajax:*`` attributes to ``data-t-ssr-*`` attributes.
    - Support ``data-t-ajax-*`` attributes as substitute of ``ajax:*`` attributes
      and deprecate latter with B/C fallback.

[ ] - ``AjaxEvent`` triggering bubbles into unrelated ajax operations.
    - ``AjaxEvent.execute`` triggers via jQuery ``.trigger()``, which bubbles up
      the DOM. If the addressed element does not bind that event name, the
      closest ancestor binding it handles the event instead, dispatches its own
      ``ajax:action`` and stops propagation
      (``AjaxDispatcher.dispatch_handle``).
    - A wrong or outdated event name therefore does not fail silently, it
      silently performs a different and usually much bigger operation.
    - Example: ``ajax:event="contextchanged:#contextmenu"`` while
      ``#contextmenu`` binds ``contextactionschanged``. The event bubbles to
      ``#content``, which re-renders the entire content area instead of the
      context menu.
    - To analyse: trigger without bubbling (``triggerHandler``), or warn when
      the selector matches elements not binding the event? Bubbling may be
      relied upon elsewhere - e.g. ``contextchanged`` triggered on a nested
      element to reach ``#layout``.

[ ] - ``replace`` re-initializes the neighbourhood, not the replaced element.
    - ``AjaxOperation`` handling of ``mode: 'replace'``
      (``src/ssr/handle.js``) calls ``this.ajax.bind(context.parent())`` after
      swapping the element. Everything else inside that parent is therefore
      bound a second time, on every reload.
    - The asymmetry is visible in the same block: ``destroy`` is given the
      replaced element, ``bind`` its parent.
    - Widgets without a guard against a second ``initialize`` multiply:
      ``yafowil.widget.datetime`` appended another trigger button beside a date
      field on every reload until two digits of it were left;
      ``yafowil.widget.autocomplete`` bound its handlers twice and left an
      orphaned dropdown on ``body``. Both have grown a guard since - the
      widget already stored itself under a data key, only the check was
      missing - but that is one defence per package, and it relies on every
      package having thought of it.
    - The obvious fix - bind ``context`` instead of ``context.parent()`` - is
      blocked by the binder contract, and that is the actual work here.
      ``bind`` serves two consumers with different semantics:
      ``parser.walk(node)`` parses the node **and** its subtree, so the
      element alone would do; the registered binders receive the context and
      look inside it with ``$(selector, context)``, which is ``find()`` and
      matches descendants only. A replaced element that **is** a widget would
      then never be initialized.
    - The likely shape of the fix is a **helper here** that a binder uses
      instead of ``$(selector, context)`` and that matches the context element
      as well. Spelling the ``addBack`` out at every call site would be the
      same migration with N places to change it again later; a helper leaves
      one, and the packages only swap an expression for an import. Binding the
      replaced element rather than its parent follows from it.
    - Not a small piece of work either way: every widget package has to move
      over before ``bind`` can stop taking the parent, and until the last one
      has, both behaviours have to hold.
    - The fallback, if it stays as it is: document that a binder must tolerate
      being called twice on the same element, so the guards stop being
      something each package had to think of on its own.

[ ] - Form module
    - Button widget in form?
    - Move form to yafowil?