#!/bin/bash
#
# Generate sphinx docs.

# since we installed jsdoc locally, we need to set path
export PATH=$PATH:$(pwd)/node_modules/jsdoc
./bin/sphinx-build docs/source/ docs/html
