#!/bin/bash
#
# Install development environment.

set -e

./scripts/clean.sh

if ! which npm &> /dev/null; then
    sudo apt-get install npm
fi

npm --save-dev install \
    qunit \
    karma \
    karma-qunit \
    karma-coverage \
    karma-chrome-launcher \
    karma-module-resolver-preprocessor \
    rollup \
    rollup-plugin-cleanup \
    rollup-plugin-terser \
    jsdoc \
    https://github.com/jquery/jquery#main

JSDOC_BIN="/usr/local/bin/jsdoc"

if [ -L $JSDOC_BIN ] && [ ! -e $JSDOC_BIN ]; then
    sudo rm /usr/local/bin/jsdoc
fi

if [ ! -e $JSDOC_BIN ]; then
    sudo ln -s $(pwd)/node_modules/jsdoc/jsdoc.js $JSDOC_BIN
fi

python3 -m venv .
./bin/pip install wheel
./bin/pip install -e .[docs]
