Changes
=======

2.0.1 (unreleased)
------------------

- Extend the JS tests to 100 % coverage, all modules including bundles are
  loaded by the tests now.
  [rnix]

- Update biome to 2.6 and add ``check`` and ``format`` targets running biome to
  ``include.mk``.
  [rnix]

- JS tooling: Commit ``pnpm-lock.yaml``. Upgrade ``@web/test-runner`` to 1.0
  and run the JS tests headless in Chromium via Playwright, installed in the JS
  CI workflow. Drop the accidental ``install`` dev dependency. Pin patched
  versions of vulnerable transitive dependencies via ``pnpm.overrides``.
  [rnix]

- Set ``PYTHON_MIN_VERSION`` in the Makefile to 3.10.
  [rnix]


2.0.0 (2026-10-24)
------------------

- Complete package metadata: description, keywords, project urls and
  development status, audience and license classifiers. pyroma rated the
  package 0/10 without them.
  [rnix]

- Re create the hidden form iframe on submit in ``AjaxForm``. It is shared by
  every bound form and gets removed on a successful submit, so a form that was
  bound before that and has not been re rendered since pointed at a frame name
  the browser could no longer resolve - and submitting it opened a new tab
  instead of posting in place.
  [rnix]

- Import node payloads owned by a foreign document in ``AjaxHandle.update``
  instead of adopting them. Ajax form responses pass a live node from the
  response iframe, and Firefox never opens native ``<select>`` popups on
  adopted nodes.
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


1.0.0 (2026-02-03)
------------------

- Refactor package layout to use ``pyproject.toml``.
  [rnix]


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
