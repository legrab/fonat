#!/usr/bin/env sh
set -eu
npm ci
npm run validate
npm test
