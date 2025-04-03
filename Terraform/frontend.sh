#!/bin/bash

echo "cd to root directory..."
cd /root

echo "whoami..."
whoami

echo "pwd..."
pwd

# comment this command out to speed things up
# uncomment this command before you submit your coursework
# otherwise marks will be lost
echo "upgrading..."
sudo dnf upgrade -y -q

echo "end of script..."