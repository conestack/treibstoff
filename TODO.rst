TODO
====

[ ] - Either include jquery and bootstrap dist here or create dedicated
      delivery package with webresource declarations.

[ ] - Change all ``ajax:*`` attributes to ``data-t-ssr-*`` attributes.

[ ] - Introduce JS instance attaching to DOM nodes and implement an ``unload``
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