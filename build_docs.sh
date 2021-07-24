#!/bin/bash

export PATH=$PATH:$(pwd)/node_modules/jsdoc
./bin/sphinx-build docs/source/ docs/html
