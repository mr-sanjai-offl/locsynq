#!/usr/bin/env bash
# exit on error
set -o errexit

# Force installment of devDependencies even on production environments for build
echo "--- Installing all dependencies (including dev) ---"
npm install --include=dev

echo "--- Building project ---"
npm run build

echo "--- Build complete ---"
