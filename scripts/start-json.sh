#!/bin/bash
echo "start json" $*

node ./node_modules/.bin/json-server --watch ./db/$1.json --host=0.0.0.0 --routes ./scripts/routes.json $2