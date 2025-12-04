Changes
=======

1.0.0 (unreleased)
------------------

- Refactor package layout to use ``pyproject.toml``.
  [rnix]

- Split ``ajax.js`` into ``ssr`` js module.
  [lenadax]

- Rework ``Spinner`` class to prevent persisting detached elements.
  [lenadax]

- Unbind events on Motion ``reset_state`` method.
  [lenadax]

- Unbind events on ``destroy`` method in ``create_listener`` subclass factory.
  [lenadax]

- Move ``AjaxDestroy`` to ``ajaxdestroy`` module to prevent circular import dependency.
  [lenadax]

- Fix widgets not being fully destroyed if rendered within an ``Overlay`` inside body.
  [lenadax]

- Modify ``AjaxDestroy`` parse method to prevent DOM memory leaks.
  [lenadax]

- Replace svg spinner with Bootstrap5 spinner.
  [lenadax]


0.4.0 (2024-02-12)
------------------

- Use web test runner instead of deprecated karma.
  [rnix]

- Deprecate usage of ``ts.ajax.request``. ``ts.http_request`` shall be used
  instead.
  [rnix]

- Rename ``AjaxSpinner`` to ``LoadingSpinner`` and move it to ``spinner`` module.
  [rnix]

- Rename ``AjaxRequest`` to ``HTTPRequest`` and move it to ``request`` module.
  [rnix]

- Introduce ``clock`` module.
  [rnix]

- ``Events.trigger`` accepts arbitrary number of arguments passed to subscribers.
  [rnix]


0.3.0 (2023-05-18)
------------------

- Fix instant binder function not to be called twice on page load if treibstoff
  document ready handler gets called after ajax.register.
  [rnix]


0.2.0 (2023-05-16)
------------------

- Add ``object_by_path`` utility function.
  [rnix]

- Add ``Ajax.attach``.
  [rnix]

- Add ``Visibility``, ``Collapsible`` and ``Button`` widgets.
  [rnix]

- Add ``query_elem``, ``get_elem`` and ``set_visible`` utility functions.
  [rnix]

- Add ``form`` module.
  [rnix]

- Add ``listener`` module.
  [rnix]

- Add ``websocket`` module.
  [rnix]

0.1.0 (2021-12-13)
------------------

- Initial Release.
  [rnix]
