#!/bin/bash
echo "handle service" $*
# https://manual.uberspace.de/daemons-supervisord.html
# if[$1 == "create"]
#then

#fi

if [ $1 == "remove" ]
then
  supervisorctl stop $2
  supervisorctl remove $2
fi
