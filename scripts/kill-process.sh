#!/bin/bash
echo "kill process" $1 `pgrep -f $1`

kill -9 `pgrep -f $1`