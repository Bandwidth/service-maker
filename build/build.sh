#!/bin/bash -Eev
BASEDIR=`dirname ${BASH_SOURCE[0]}`
PROJECT_DIRECTORY="${BASEDIR}/.."

echo "1"
# Run the unit tests.
pushd "${PROJECT_DIRECTORY}" > /dev/null
echo "2"
npm test
echo "3"
popd > /dev/null
echo "4"
# Run the integration tests.
pushd "${PROJECT_DIRECTORY}" > /dev/null
npm run-script integration-tests
popd > /dev/null