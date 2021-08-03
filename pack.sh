#!/bin/bash

mkdir -p ./bundle
rm -f ./bundle/*
cp treibstoff/static/* ./bundle/

npm pack
