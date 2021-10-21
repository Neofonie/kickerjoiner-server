#!/bin/bash
# https://www.tutorialspoint.com/unix/if-fi-statement.htm
# https://gist.github.com/BigOokie/fea128a063e6e4e870cb4a246967a419
#Use the following pattern for `pgrep` to identify a running process that contains specific commandline parameters
#
#Note the following pgrep options are needed:
#-a, --list-full           list PID and full command line
#-f, --full                use full process name to match
#-c, --count               count of matching processes
#
#
#To find a specific process with a specific commandline parameter use the following:
#pgrep -a -f "{processname}.*{commandline param}"
#
#For example:
## This will likely return a number of results
#pgrep -a -f "systemd"
#
## This will identify any instances of systemd where the --user commandline parameter was passed
#pgrep -a -f "systemd.*user"
#12207 /lib/systemd/systemd --user
#
#To return the count of the number of running processes that match the pattern, add the -c option
#For example:
#pgrep -a -f -c "systemd.*user"
#1
#
#pgrep -a -f "you-wont-find-this-process"
#0
echo "kill process" `pgrep -f -a "node.*$1"`

if [ `pgrep -f -c "node.*$1"` -gt 0 ]
then
  # 7960 node ./node_modules/.bin/json-server --watch ./db/notify-db.json --host=0.0.0.0 --port=61359
  kill -9 `pgrep -f "node.*$1" | tail -1`
  echo "process killed"
else
  echo "no process killed"
fi

exit 0
