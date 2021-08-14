Development
===========

Treibstoff contains a set of shell scripts to ease setup of development
environment, running tests, building docs and do deployment.

All scripts must be executed from the repository root.

Install development environment:

.. code-block:: sh

    ./scripts/install.sh

Cleanup development environment:

.. code-block:: sh

    ./scripts/clean.sh

Run tests:

.. code-block:: sh

    ./scripts/karma.sh

To view coverage report, open in browser::

    karma/coverage/[browser name]/index.html

Create Javascript bundles:

.. code-block:: sh

    ./scripts/rollup.sh

Automatically build JS bundles while development:

.. code-block:: sh

    ./scripts/watch.sh

Create NPM package:

.. code-block:: sh

    ./scripts/pack.sh

Create Python package:

.. code-block:: sh

    ./scripts/wheel.sh

Build documentation:

.. code-block:: sh

    ./scripts/docs.sh
