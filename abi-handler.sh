#!/usr/bin/env bash

workdir=$(cd $(dirname $0); pwd)
cd $workdir
base_dir="$workdir/src/abi/"
echo $base_dir
cd $base_dir;

for dir in $(find $base_dir -type d -name "*.sol"); do
    cd $dir
    for file in `ls`; do
      echo "$file"
      cat $file | jq -c .abi > "$file.bak"
      mv "$file.bak" ../$file
      rm -rf "$file.bak"
    done
    cd $base_dir
    rm -rf $dir
done

find $base_dir -type f -name "*.dbg.json" -delete
