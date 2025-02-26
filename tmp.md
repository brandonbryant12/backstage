#!/bin/bash

# Get all staged files that will be included in the commit
staged_files=$(git diff --cached --name-only --diff-filter=ACM)

# If there are no staged files, exit successfully
if [ -z "$staged_files" ]; then
    exit 0
fi

# Check each staged file for the presence of 'aicontext'
for file in $staged_files; do
    # Skip files that don't exist (might have been deleted)
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Check if the file contains 'aicontext'
    if git diff --cached "$file" | grep -q "aicontext"; then
        echo "ERROR: Found 'aicontext' in file: $file"
        echo "Commit failed. Please remove 'aicontext' before committing."
        exit 1
    fi
done

# If we get here, no files contained 'aicontext'
exit 0

mkdir -p ~/.git-templates/hooks

git config --global init.templateDir ~/.git-templates/hooks

chmod +x ~/.git-templates/hooks/pre-commit

git init