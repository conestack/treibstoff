#!/bin/bash

set -e

./rollup.sh
python setup.py bdist_wheel
