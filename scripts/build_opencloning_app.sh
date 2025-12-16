#!/usr/bin/env bash
set -e  # exit immediately on error

# Ensure the reset runs even if build fails
trap 'yarn workspace @opencloning/ui postpack' EXIT

# Inject the real version into the library
yarn workspace @opencloning/ui prepack

# Build the app
yarn workspace opencloning build

# Reset happens automatically because of the trap
