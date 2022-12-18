#!/bin/bash

# Find and kill all processes with "sclang" in the name
pids=$(pgrep sclang)
if [ -n "$pids" ]; then
  kill $pids
fi

# Find and kill all processes with "scsynth" in the name
pids=$(pgrep scsynth)
if [ -n "$pids" ]; then
  kill $pids
fi

# Find and kill all processes with "server.js" in the name
pids=$(pgrep node)
if [ -n "$pids" ]; then
  kill $pids
fi
