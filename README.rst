Overview
========

Treibstoff contains a set of useful javascript tools for writing browser based
applications (or parts of it).


Development
-----------

Install system dependencies::

    sudo apt-get install npm

Install test requirements::

    npm --save-dev install \
        qunit \
        karma \
        karma-qunit \
        karma-coverage \
        karma-chrome-launcher \
        karma-module-resolver-preprocessor

Install jquery from git as jquery 4 is not released yet but required to run
tests as modules and import from jquery sources works::

    npm --save-dev install https://github.com/jquery/jquery#main

Install deployment requirements::

    npm --save-dev install \
        rollup \
        rollup-plugin-cleanup \
        rollup-plugin-terser


Javascript Tests
----------------

Cone uses karma testrunner for JS testing:

- Karma: https://karma-runner.github.io/6.3/intro/installation.html
- Istanbul: https://istanbul.js.org/
- Puppeteer: https://pptr.dev/

Following plugins are used:

- karma-qunit
- karma-chrome

Start karma server (immediately run tests)::

    node_modules/karma/bin/karma start karma.conf.js

Re-run tests (needs karma server to be started)::

    node_modules/karma/bin/karma run karma.conf.js

To view coverage report, open::

    karma/coverage/[browser name]/index.html

jQuery is included as git submodule to ensure we can import from it in tests.
For any reason the jquery package from npm includes the wrong sources.


Deploy
------

Create JS bundle with rollup::

    node_modules/rollup/dist/bin/rollup --config rollup.conf.js


Documentation
-------------

Install jsdoc::

    npm install --save-dev jsdoc

Install virtualenv::

    python3 -m venv .
    ./bin/pip install wheel

Install treibstoff with docs extra dependencies::

    ./bin/pip install -e .[docs]

Generate docs (since we installed jsdoc locally, we need to set path first)::

    export PATH=$PATH:$(pwd)/node_modules/jsdoc
    ./bin/sphinx-build docs/source/ docs/html