#!/bin/bash
node server2 3333 > server2.log 2>&1 &
timeout 3 tail -f server2.log
