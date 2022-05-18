TODO
====

[ ] - Conventions:
    - ``opts`` passed to widget constructors.
    - Widget lifecycle -> constructor -> compile -> update -> destroy.
    - Naming - Events always ``on_*``.
    - Renaming - unload -> destroy
    - Event callback naming -> handler, listener or subscriber?
    - Strict distinction between DOM event and TS event in docs
    - Do we want ``ts`` as namespace shortcut? Possible confusion with typescript.
      Alternative?

[ ] - ``widget.Widget``
    - add_widget
    - remove_widget
    - children

[ ] - Button widget in form?

[ ] - Fix collapsible widget.

[ ] - Either include jquery and bootstrap dist here or create dedicated
      delivery package with webresource declarations.

[ ] - Change all ``ajax:*`` attributes to ``data-t-ssr-*`` attributes.

[ ] - Introduce JS instance attaching to DOM nodes and implement an ``destroy``
      mechanism in ```AjaxHandle``.

[ ] - Use ``document.createTreeWalker`` in parsers.

[ ] - Move ``AjaxRequest`` to ``request.js -> Request``.

[ ] - Move ``AjaxSpinner`` to ``spinner.js -> Spinner``.

[ ] - Rename ``Ajax*`` to ``SSR*``.

[ ] - ``AjaxOperation.handle()`` API consolidation. Instead of ``opts``, all
      ``AjaxOperation`` deriving objects gets passed ``elem`` and ``event`` as
      arguments.

[ ] - Dedicated ``ajax:event`` and ``ajax:action`` parsing, to allow spaces and
      colon in selectors.

[ ] - Add ``ajax:selector``, ``ajax:mode`` attributes. and ``ajax:data``
      attributes.

[ ] - Support ``data-t-ajax-*`` attributes as substitute of ``ajax:*`` attributes
      and deprecate latter with B/C fallback.

[ ] - Overlay continuation definition should contain ``overlay`` instead of
      ``action``.
