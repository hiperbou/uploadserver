#!/bin/bash
node server 3330 > server.log 2>&1 &
timeout 3 tail -f server.log
