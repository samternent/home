#!/bin/bash
set -e # exit when error

FS_PACKAGE_NAME=$(node -p "require('./apps/footballsocial/package.json').name")
FS_PACKAGE_VERSION=$(node -p "require('./apps/footballsocial/package.json').version")

CA_PACKAGE_NAME=$(node -p "require('./apps/concords/package.json').name")
CA_PACKAGE_VERSION=$(node -p "require('./apps/concords/package.json').version")

# Packages
CL_PACKAGE_NAME=$(node -p "require('./packages/ledger/package.json').name")
CL_PACKAGE_VERSION=$(node -p "require('./packages/ledger/package.json').version")

CU_PACKAGE_NAME=$(node -p "require('./packages/utils/package.json').name")
CU_PACKAGE_VERSION=$(node -p "require('./packages/utils/package.json').version")

CE_PACKAGE_NAME=$(node -p "require('./packages/encrypt/package.json').name")
CE_PACKAGE_VERSION=$(node -p "require('./packages/encrypt/package.json').version")

CI_PACKAGE_NAME=$(node -p "require('./packages/identity/package.json').name")
CI_PACKAGE_VERSION=$(node -p "require('./packages/identity/package.json').version")

CPOW_PACKAGE_NAME=$(node -p "require('./packages/proof-of-work/package.json').name")
CPOW_PACKAGE_VERSION=$(node -p "require('./packages/proof-of-work/package.json').version")

GK_PACKAGE_NAME=$(node -p "require('./packages/game-kit/package.json').name")
GK_PACKAGE_VERSION=$(node -p "require('./packages/game-kit/package.json').version")

# packageArray=("${FS_PACKAGE_NAME}-${FS_PACKAGE_VERSION}" "${CA_PACKAGE_NAME}-${CA_PACKAGE_VERSION}" "${CL_PACKAGE_NAME}-${CL_PACKAGE_VERSION}" "${CU_PACKAGE_NAME}-${CU_PACKAGE_VERSION}" "${CE_PACKAGE_NAME}-${CE_PACKAGE_VERSION}" "${CI_PACKAGE_NAME}-${CI_PACKAGE_VERSION}" "${CPOW_PACKAGE_NAME}-${CPOW_PACKAGE_VERSION}" "${GK_PACKAGE_NAME}-${GK_PACKAGE_VERSION}")
packageArray=("${CL_PACKAGE_NAME}@${CL_PACKAGE_VERSION}" "${CU_PACKAGE_NAME}@${CU_PACKAGE_VERSION}")

# Accessing the passed branch name as a command line argument
branch_name="${GITHUB_REF#refs/heads/}"

for str in ${packageArray[@]}; do
  if [ $(git tag -l "${str}") ]; then
    echo "> release ${str} already exists."
    echo "> Aborting..."
    # exit 1
  else
    echo "> create release ${str}"

    # get the latest merged PR to main and extract changelog targeting head branch changeset-release/main
    # gh pr list -B main -s merged -H changeset-release/main --json body --jq '.[].body' -L 1
    prDesc=$(gh release view concords-proof-of-work-0.0.7)
    releaseNotes=$(echo "$prDesc" | sed -e "s/.*concords-ledger@1.0.11\(.*\)ncords-proof-of.*/\1/")
    # releaseNotes=$(echo "$prDesc" | perl -0777pe "s/## ${str}/\2/s")
    echo "> Extracted notes ${releaseNotes}"

    # get the merged commit SHA so we can tag this release precisely and avoid including any subsequest merges
    releaseMergeCommitSHA=$(gh pr list -B "$branch_name" -s merged -H changeset-release/"$branch_name" --json mergeCommit --jq '.[].mergeCommit.oid' -L 1)

    # releaseReponse=$(gh release create "${str}" -t "${str}" -n "${str}" -n "$releaseNotes" --target "${releaseMergeCommitSHA}")

  fi
done
