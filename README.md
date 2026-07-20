# pr-ping

TUI tool that monitors GitHub PRs in a local repository. Displays open PRs, review status, CI checks, and sends desktop notifications when something changes.

Built with [Ink](https://github.com/vadimdemedes/ink) + React.

## Install

### Quick (curl pipe)

```sh
curl -fsSL https://github.com/usman1100/pr-ping/releases/latest/download/pr-ping-install.sh | bash
```

Installs to `/usr/local/bin`. Set `PR_PING_INSTALL_DIR` to change the target directory.

### Homebrew

```sh
brew install usman1100/tap/pr-ping
```

### Manual

Download the archive for your platform from the [latest release](https://github.com/usman1100/pr-ping/releases/latest), extract it, and place the binary in your `$PATH`.

### From source

```sh
bun install
bun run build
./pr-ping /path/to/repo
```

## Usage

```sh
pr-ping /path/to/github/repo
```

The tool runs a full-screen terminal UI. It requires [GitHub CLI (`gh`)](https://cli.github.com/) to be installed and authenticated.

### Controls

| Key | Action |
|---|---|
| `j` / `k` | Navigate PR list |
| `Enter` | Open selected PR in browser |
| `s` | Toggle subscription to the selected PR |
| `S` | Toggle subscription + notification filters |
| `r` | Force refresh |
| `/` | Search PRs |
| `?` | Toggle help overlay |
| `q` / `Esc` | Quit |

### Notifications

When subscribed to a PR, pr-ping checks for changes every 60 seconds and sends a macOS notification when:
- New comments are posted
- CI status changes
- The PR is merged or closed
- A review is requested of you

## Requirements

- [GitHub CLI (`gh`)](https://cli.github.com/) — authenticated (`gh auth login`)
- macOS 13+ (for terminal-notifier notifications)
- A local clone of the repository you want to monitor

## How it works

pr-ping shells out to `gh pr list` and `gh pr view` to fetch PR data. It parses the JSON output and displays it in a TUI dashboard. Subscriptions are stored in `~/.pr-ping/state.json` alongside the auth token.
