#!/bin/bash

home=/Users/kazuaki
app_bin=firefox-bin
app_name=/Applications/Firefox.app
sqlite=/opt/local/bin/sqlite3
pgrep=/opt/local/bin/pgrep
try_limit=30
open=/usr/bin/open

tried=0
while true ; do
  ps=`$pgrep $app_bin`
  if [ -z "$ps" ] ; then
    break
  fi
  tried=`expr $tried + 1`
  if [ $tried -gt $try_limit ] ; then
    echo "exceeded retry limit"
    echo "tried :$tried"
    echo "limit :$try_limit"
    exit 1
  fi
  sleep 2
done
for dir in $home/Library/Application\ Support/Firefox/Profiles/*  $home/Library/Caches/Firefox/Profiles/* ; do
  if [ -d "$dir" ] ; then
    cd "$dir"
    for f in *.sqlite ; do
      $sqlite $f vacuum .exit
      $sqlite $f reindex .exit
    done
  fi
done
$open -a $app_name
