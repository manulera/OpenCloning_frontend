#!/usr/bin/env sh

echo -e "\033[1;34m>\033[0m Checking for axios outside of client files..."

ALL_FILES=$(find packages -name "*.js" -o -name "*.jsx" | grep -v "test.js")
ALL_FILES="$ALL_FILES $(find apps -name "*.js" -o -name "*.jsx" | grep -v "test.js"| grep -v "apps/syntax-builder"|grep -v "apps/opencloning/build")"

FILES_WITH_AXIOS=$(grep -l "import.*axios\|axios.*import" $ALL_FILES)

ACCEPTED_FILES="packages/ui/src/components/eLabFTW/common.js packages/utils/src/utils/getHttpClient.js"

for file in $FILES_WITH_AXIOS; do
  if ! echo "$ACCEPTED_FILES" | grep -q "$file"; then
    echo "Error: Found axios import in $file. Axios should only be used in client files ($ACCEPTED_FILES)."
    exit 1
  fi
done

