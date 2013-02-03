#!/bin/sh
URL="http://send.sh"
TRY=5
TIMEOUT=30
WGET="/opt/local/bin/wget"
GREP="/usr/bin/grep"

health=`$WGET -nv -S --spider -T $TIMEOUT -t $TRY $URL 2>&1 | $GREP -c "200 OK"`

if [ $health -lt 1 ]; then
  echo "can not connect $URL."
fi
