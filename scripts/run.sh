#!/bin/sh
echo "service run" $*
# clear log
#cd /home/dutscher/tmp
#rm $1-*
# start npm
cd /home/dutscher/kij.willy-selma.de/
npm run $1
