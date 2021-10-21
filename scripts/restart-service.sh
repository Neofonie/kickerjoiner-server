#!/bin/sh
echo "restart service" $*

cd /home/dutscher/api.willy-selma.de/

echo "stop service" $1
npm run srvc:stop $1

echo "clear process" $1
npm run pid:kill $1

echo "clear logs" $1
cd dir-logs-tmp
rm $1-*
cd ..

echo "start service" $1
npm run srvc:start $1

