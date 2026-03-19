# Local Agent Instructions

- When the user asks to start localhost, start both services by default:
  frontend with `npm run dev` from `/home/john/git-repos/analytics-hub/frontend`
  backend with `python3 backend/app.py` from `/home/john/git-repos/analytics-hub`
- For development work, always create and use a feature branch. Never develop directly on `main`.
- When pushing completed work, always create the pull request with `gh` terminal commands.
- After a pull request is merged, clean up both local and remote state:
  pull the latest `main` locally
  delete the merged feature branch locally
  delete the merged feature branch on the remote
