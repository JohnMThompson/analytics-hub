# Local Agent Instructions

- When the user asks to start localhost, start both services by default:
  frontend with `npm run dev` from `/home/john/git-repos/analytics-hub/frontend`
  backend with `python3 backend/app.py` from `/home/john/git-repos/analytics-hub`
- For development work, always create and use a feature branch. Never develop directly on `main`.
- When pushing completed work, always create the pull request with `gh` terminal commands.
- Never include plaintext credentials or credential-adjacent values in any public-facing text, including pull requests, issue comments, commit messages, READMEs, documentation, code comments, or operational notes. Refer to secret names or configuration keys generically instead.
- After a pull request is merged, clean up both local and remote state:
  pull the latest `main` locally
  delete the merged feature branch locally
  delete the merged feature branch on the remote
