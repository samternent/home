#!/bin/bash
set -e # exit when error

DOCKER_BUILDKIT=1 docker build -f ./Dockerfile ../../ -t samternent/footballsocial-api --secret id=
