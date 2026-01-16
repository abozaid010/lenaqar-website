#!/bin/bash

# Git alias setup script
# Run this script to set up the mergew alias

# Create mergew alias: Create PR and merge it
git config --global alias.mergew '!f() { 
  BRANCH=$(git branch --show-current); 
  echo "🚀 Creating PR for branch: $BRANCH"; 
  
  # Create PR with auto-fill (uses existing PR template if available)
  PR_URL=$(gh pr create --base main --head "$BRANCH" --title "Merge $BRANCH" --body "Auto-merge PR" --fill 2>&1); 
  
  if [ $? -eq 0 ]; then 
    # Extract PR number from URL or output
    PR_NUMBER=$(echo "$PR_URL" | grep -oE "pull/[0-9]+" | cut -d/ -f2);
    if [ -z "$PR_NUMBER" ]; then
      PR_NUMBER=$(echo "$PR_URL" | grep -oE "[0-9]+" | head -1);
    fi;
    
    echo "✅ PR created: $PR_URL";
    echo "🔄 Merging PR #$PR_NUMBER...";
    
    # Merge PR (try with delete-branch, fallback to regular merge)
    gh pr merge "$PR_NUMBER" --merge --delete-branch 2>/dev/null || \
    gh pr merge "$PR_NUMBER" --merge || \
    gh pr merge "$PR_NUMBER" --squash || \
    gh pr merge "$PR_NUMBER";
    
    if [ $? -eq 0 ]; then
      echo "✅ PR merged successfully!";
      echo "📦 Updating local main branch...";
      git checkout main 2>/dev/null;
      git pull origin main 2>/dev/null;
    else
      echo "❌ Failed to merge PR. Please merge manually.";
      exit 1;
    fi;
  else 
    echo "❌ Failed to create PR";
    echo "Error: $PR_URL";
    exit 1;
  fi; 
}; f'

echo "✅ Alias 'mergew' created successfully!"
echo ""
echo "Usage: git mergew"
echo "This will:"
echo "  1. Create a PR from current branch to main"
echo "  2. Merge the PR automatically"
echo "  3. Delete the branch (if possible)"
echo "  4. Switch to main and pull latest changes"
