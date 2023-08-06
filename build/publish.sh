
#!/bin/bash
set -e # exit when error

LS_PACKAGE_NAME=`node -p "require('./lightspeed/package.json').name"`
LS_PACKAGE_VERSION=`node -p "require('./lightspeed/package.json').version"`
DOCS_PACKAGE_NAME=`node -p "require('./docs/package.json').name"`
DOCS_PACKAGE_VERSION=`node -p "require('./docs/package.json').version"`

packageArray=("${LS_PACKAGE_NAME}-${LS_PACKAGE_VERSION}" "${DOCS_PACKAGE_NAME}-${DOCS_PACKAGE_VERSION}")

# Accessing the passed branch name as a command line argument
branch_name="${GITHUB_REF#refs/heads/}"

for str in ${packageArray[@]};
do
   if [ $(git tag -l "${str}") ]; then
    echo "> release ${str} already exists."
    echo "> Aborting..."
    # exit 1
  else
    echo "> create release ${str}"

    # get the latest merged PR to main and extract changelog targeting head branch changeset-release/main
    # gh pr list -B main -s merged -H changeset-release/main --json body --jq '.[].body' -L 1
    prDesc=$(gh pr list -B "$branch_name" -s merged -H changeset-release/"$branch_name" --json body --jq '.[].body' -L 1)
    releaseNotes=$(echo "$prDesc")
    echo "> Extracted notes ${releaseNotes}"

    # get the merged commit SHA so we can tag this release precisely and avoid including any subsequest merges
    releaseMergeCommitSHA=$(gh pr list -B "$branch_name" -s merged -H changeset-release/"$branch_name" --json mergeCommit --jq '.[].mergeCommit.oid' -L 1)

    releaseReponse=$(gh release create "${str}" -n "${str}" -n "$releaseNotes" --target "${releaseMergeCommitSHA}" )

  fi
done
