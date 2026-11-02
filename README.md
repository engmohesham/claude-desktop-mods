# claude-desktop-mods

Two Claude Code mods, made for the Claude desktop app (they also draw in the terminal).

- **session-search**: a pane with a search box. Type a project name, folder or session title; results are grouped into ⚡ Working and 💤 Idle, newest first, and clicking a title opens the session. Open it with `/sessions`. Refreshes every 30s or on Enter.
- **null**: a pixel-art companion above the prompt showing what Claude is doing, task progress, a session summary, with Summary / Skin / Hide buttons. Commands: `/null` (show/hide), `/handoff` (write a session handoff note to `.claude/handoffs/latest.md`; `/handoff local` uses no tokens).

## Install

At the prompt of a terminal session:

```
/plugin install session-search --marketplace engmohesham/claude-desktop-mods
/plugin install null --marketplace engmohesham/claude-desktop-mods
```

From a shell:

```bash
claude plugin install session-search --marketplace engmohesham/claude-desktop-mods
claude plugin install null --marketplace engmohesham/claude-desktop-mods
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `engmohesham/claude-desktop-mods`, then Add plugin.

Answer `y` to add the marketplace, then pick a scope.
