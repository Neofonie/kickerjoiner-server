#!/bin/bash
echo "start json" $*

node ./node_modules/.bin/json-server --watch /home/dutscher/kij.willy-selma.de/db/$1.json --host=0.0.0.0 --port=$2
