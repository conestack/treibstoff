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

[ ] - Form module
    - Button widget in form?
    - Move form to yafowil?