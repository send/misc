#!/bin/sh
LIMIT=80
IS_OVER=0
for CAPACITY in `df | grep "^/" | awk '{print $5}' | sed 's/%//'`
do
  if [ "$CAPACITY" -ge "$LIMIT" ] ; then
    IS_OVER=1
  fi
done
if [ $IS_OVER -eq 1 ] ; then
  df -h
fi
