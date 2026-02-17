# MCP Servers Setup Guide for AI Analytics

Welcome! This guide explains MCP (Model Context Protocol) servers and how to use them with Copilot CLI. MCP servers extend Copilot's abilities to interact with external tools and services.

**Note:** The custom MCP servers mentioned in earlier versions of this guide (`python-mcp-server`, `nodejs-mcp-server`, `docker-mcp-server`) are not pre-built or available through Copilot CLI. This guide has been updated to reflect what's actually available.

---

## Prerequisites

Before you start, verify you have these installed:

### Check Python
```bash
python3 --version
# Should output Python 3.8 or higher
```

### Check Node.js & npm
```bash
node --version
npm --version
# Should output v18 or higher for both
```

### Check Docker
```bash
docker --version
docker-compose --version
# Should output Docker 20.10+ and Docker Compose 2.0+
```

**Don't have them?** Install [Python](https://www.python.org), [Node.js](https://nodejs.org), and [Docker](https://www.docker.com/products/docker-desktop) first, then come back.

---

## What Are MCP Servers?

MCP (Model Context Protocol) servers allow Copilot to interact with external tools and services. Copilot CLI comes pre-configured with the **GitHub MCP Server**, which enables interaction with GitHub repositories, issues, and pull requests.

Other MCP servers can be added to extend capabilities, but they must be:
1. Publicly available and published
2. Properly configured with the correct startup command
3. Running or installable on your system

---

## Available MCP Servers

### GitHub MCP Server (Pre-installed)

This server is already configured and allows Copilot to:
- Read and search GitHub repositories
- View issues and pull requests
- Create and manage GitHub resources

No additional setup needed—it works out of the box.

### Other Available MCP Servers

You can add publicly available MCP servers if needed. Some examples include:
- **Sentry**: Error tracking and monitoring
- **Notion**: Access to Notion databases and pages
- **Cloudflare**: Interaction with Cloudflare services
- **Azure**: Azure resource management

To see all available servers or add new ones, type in Copilot CLI:
```
/mcp add
```

This will show you the available options.

---

## Running Python, Node.js, and Docker Commands

**Important:** Copilot CLI doesn't need special MCP servers to run Python, Node.js, or Docker commands. You can ask Copilot directly to run these commands, and it will execute them using your system's installed tools.

### Examples:

**Run Python tests:**
```
Can you run pytest in the backend directory?
```

**Run Node.js commands:**
```
Run npm install and npm test in the frontend directory
```

**Run Docker:**
```
Start the development environment with docker-compose up
```

Copilot will execute these commands and show you the results. It will ask for permission before running commands that modify files or execute code.

---

## Managing MCP Servers

### View Configured Servers

In the Copilot CLI, type:
```
/mcp show
```

This displays all configured MCP servers.

### Add a New MCP Server

To add an available MCP server:
```
/mcp add
```

This shows you a list of available servers. Select one and fill in any required configuration details.

### Edit Server Configuration

To edit an existing server's configuration:
```
/mcp edit <server-name>
```

### Remove a Server

To delete a server:
```
/mcp delete <server-name>
```

---

## Troubleshooting

### Problem: Can't find the Python/Node.js/Docker server in `/mcp add`

**Explanation:** These aren't available as pre-built MCP servers. Instead, ask Copilot directly to run commands.

**Solution:** Instead of looking for a server, just ask Copilot:
```
Run the backend tests
```

Copilot will execute `pytest` directly on your system.

### Problem: Want to add a custom MCP server

If you want to use a custom or third-party MCP server, you'll need:
1. The startup command (e.g., `python -m myserver` or `npx my-mcp-server`)
2. The server's required arguments and environment variables
3. The list of tools the server provides

Then use `/mcp add` and provide these details when prompted.

### Problem: Copilot says it can't find Python/npm/docker

**Cause:** These tools aren't installed or not in your PATH.

**Solution:**
1. Exit Copilot CLI: `Ctrl+D`
2. Verify the tool is installed:
   ```bash
   python3 --version
   node --version
   docker --version
   ```
3. If any are missing, install them
4. Restart Copilot CLI: `copilot`

### Problem: Permission denied when running commands

**Cause:** Your user doesn't have permission to run certain commands.

**For Docker specifically:**
```bash
# Exit Copilot CLI first (Ctrl+D)
sudo usermod -aG docker $USER
# Log out and back in, or restart your terminal
```

Then restart Copilot CLI.

### Problem: Want to see what command Copilot is about to run

**Solution:** Ask Copilot to show you:
```
Run the backend tests and show me the exact commands before executing them
```

Copilot will display each command and ask for your approval before running it.

---

## How to Use Copilot for Development

With Copilot CLI, you can ask for Python, Node.js, and Docker commands directly. Here are some examples:

### Backend Development
```
Can you run the Python tests for me?
```

```
Install the Python dependencies from backend/requirements.txt
```

```
Check the backend for linting issues with flake8
```

### Frontend Development
```
Run the React tests in the frontend directory
```

```
Build the React app for production
```

```
Start the frontend dev server
```

### Full Stack Development
```
Start the full development environment with docker-compose up
```

```
Show me the logs from the backend container
```

```
Stop all running containers
```

---

## Next Steps

1. **Read the main instructions**: Check out `.github/copilot-instructions.md` for architecture and development patterns specific to this project.

2. **Try it out**: In Copilot CLI, ask:
   ```
   Run the backend tests
   ```

3. **Ask questions naturally**: 
   ```
   I want to add a new dashboard for cryptocurrency prices. What files should I create?
   ```

4. **Review your changes**: Before committing, ask Copilot:
   ```
   /review
   ```

---

## Quick Reference Cheat Sheet

| Task | Command |
|------|---------|
| Show configured MCP servers | `/mcp show` |
| Add a new MCP server | `/mcp add` |
| Edit MCP server config | `/mcp edit <name>` |
| Remove a server | `/mcp delete <name>` |
| Get help | `/help` |
| Exit CLI | `Ctrl+D` |

---

## More Information

- Official docs: https://docs.github.com/copilot/concepts/agents/about-copilot-cli
- MCP protocol info: https://modelcontextprotocol.io/
- For bug reports: `/feedback` in the CLI

Good luck! You're now ready to develop AI Analytics with Copilot's help. 🚀
