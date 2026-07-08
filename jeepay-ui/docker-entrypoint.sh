#!/bin/sh
set -e

if [ -z "$BACKEND_HOST" ]; then
  echo "ERROR: BACKEND_HOST environment variable is required" >&2
  exit 1
fi

envsubst '${BACKEND_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
