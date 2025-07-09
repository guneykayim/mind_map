#!/bin/zsh
# Deploy script for mind_map app

npm run build && npx wrangler pages deploy dist
