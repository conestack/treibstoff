TODO
====

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