#!/bin/sh
set -eu

mc alias set pdfshare http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb --ignore-existing "pdfshare/$MINIO_BUCKET"
mc quota set "pdfshare/$MINIO_BUCKET" --size 10GB
mc quota info "pdfshare/$MINIO_BUCKET"
