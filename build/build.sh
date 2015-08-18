#!/bin/bash -Eev
BASEDIR=`dirname ${BASH_SOURCE[0]}`
PROJECT_DIRECTORY="${BASEDIR}/.."

# Run the unit tests.
pushd "${PROJECT_DIRECTORY}" > /dev/null
npm test
popd > /dev/null

# Run the integration tests.
pushd "${PROJECT_DIRECTORY}" > /dev/null
npm run-script integration-tests
popd > /dev/null