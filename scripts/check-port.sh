#!/bin/bash
echo "check port" $*

netstat -tulpen | grep $1