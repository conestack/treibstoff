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

[ ] - Form module
    - Button widget in form?
    - Move form to yafowil?