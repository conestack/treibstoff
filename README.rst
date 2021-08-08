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

Treibstoff uses karma testrunner for JS testing:

- Karma: https://karma-runner.github.io/6.3/intro/installation.html
- Istanbul: https://istanbul.js.org/
- Puppeteer: https://pptr.dev/

Following plugins are used:

- karma-qunit
- karma-chrome

Start karma server (immediately run tests)::

    ./karma.sh

To view coverage report, open::

    karma/coverage/[browser name]/index.html


Deploy
------

As python package
~~~~~~~~~~~~~~~~~

Create JS bundle with rollup::

    ./rollup.sh

Create python package::

    python setup.py sdist


As npm package
~~~~~~~~~~~~~~

Create treibstoff package::

    npm pack


Documentation
-------------

Install jsdoc::

    npm install --save-dev jsdoc

Link ``jsdoc`` executable::

    sudo ln -s $(pwd)/node_modules/jsdoc/jsdoc.js /usr/local/bin/jsdoc

Install virtualenv::

    python3 -m venv .
    ./bin/pip install wheel

Install treibstoff with docs extra dependencies::

    ./bin/pip install -e .[docs]

Generate docs::

    ./docs.sh
