#!/bin/bash
import os
os.chdir("/Users/abozaid/workspace/lenaAI-website")
# Path to the file to update
FILE="./trigger_deploy.txt"

# Add a new line with timestamp
echo "Trigger deploy" >> "$FILE"

# Git add, commit, and push
git add "$FILE"
git commit -m "Trigger deploy"
git push