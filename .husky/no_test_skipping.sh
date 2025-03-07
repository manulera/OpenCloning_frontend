#!/usr/bin/env sh

echo -e "\033[1;34m>\033[0m Checking for \033[1;33mit.only()\033[0m or \033[1;33mit.skip()\033[0m in test files..."

TEST_FILES=$(find . -not -path "./node_modules/*" -a \( -name "*.cy.js" -o -name "*.cy.jsx" -o -name "*.test.js" \))
if grep -r 'it.only(' $TEST_FILES || grep -r 'it.skip(' $TEST_FILES; then
  echo "Error: Found it.only() or it.skip() in test files. Please remove them before committing."
  exit 1
fi

