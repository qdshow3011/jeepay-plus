#!/bin/sh
set -e

# Generate nginx config from template
# Fail gracefully if template is missing
if [ -f /etc/nginx/templates/default.conf.template ]; then
  envsubst '${BACKEND_HOST},${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "WARNING: nginx template not found, using default config"
fi

# Test nginx config before starting
nginx -t

exec nginx -g "daemon off;"
