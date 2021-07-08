Overview
========

This package will containe the Javascritp foundations for cone.app.


Development
-----------

Install system dependencies::

    sudo apt-get install npm

Install test requirements::

    npm install qunit karma karma-qunit karma-coverage karma-chrome-launcher

Install deployment requirements::

    npm install rollup


Javascript Tests
----------------

Cone uses karma testrunner for JS testing:

    Karma: https://karma-runner.github.io/6.3/intro/installation.html
    Istanbul: https://istanbul.js.org/
    Puppeteer: https://pptr.dev/

Following plugins are used:

    karma-qunit
    karma-chrome
    karma-viewport

Start karma server (immediately run tests)::

    node_modules/karma/bin/karma start karma.conf.js

Re-run tests (needs karma server to be started)::

    node_modules/karma/bin/karma run karma.conf.js

To view coverage report, open::

    karma/coverage/[browser name]/index.html
