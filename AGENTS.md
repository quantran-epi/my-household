## Deployment

When the user asks to deploy this app, follow `docs/deployment.md`.

Summary: run `yarn build`, copy all files from `build/` into `docs/` except `build/manifest.json`, then run `git add ./src/*`, `git add ./docs/*`, and `git push`.