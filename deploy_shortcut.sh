#!/bin/bash

cd /Users/abozaid/workspace/lenaAI-website
git checkout main
git pull

FILE="./trigger_deploy.txt"

# Add a static line
echo "Trigger deploy" >> "$FILE"

# Git add, commit, and push
git add "$FILE"
git commit -m "Trigger deploy"
git push
