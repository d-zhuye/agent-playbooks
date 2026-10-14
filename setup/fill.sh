#!/usr/bin/env bash
# Prints the setup files with REPO replaced by this clone's absolute path (see SETUP.md).
#   setup/fill.sh claude-md      lines for ~/.claude/CLAUDE.md
#   setup/fill.sh codex-agents   section for ~/.codex/AGENTS.md
#   setup/fill.sh <file>         any file in setup/ (claude-settings.json, codex.rules, codex-config.toml)
#   setup/fill.sh check          compares this machine's installed files with the repo; exit 1 if they differ
set -euo pipefail

setup_dir="$(cd "$(dirname "$0")" && pwd -P)"
repo="$(dirname "$setup_dir")"
start='<!-- agent-playbooks:start -->'
end='<!-- agent-playbooks:end -->'

claude_md() {
  echo "$start"
  echo "Playbooks repo: $repo (REPO in the rules below). If the rules below didn't load, read and follow $repo/setup/agent-rules.md."
  echo
  echo "@$repo/setup/agent-rules.md"
  echo "$end"
}

codex_agents() {
  echo "$start"
  echo "Playbooks repo: $repo (REPO in the rules below). Copied from $repo/setup/agent-rules.md; don't edit here."
  echo
  cat "$setup_dir/agent-rules.md"
  echo "$end"
}

installed_section() {
  [ -f "$1" ] && sed -n "\|^$start\$|,\|^$end\$|p" "$1"
}

check() {
  local status=0
  if ! diff <(claude_md) <(installed_section ~/.claude/CLAUDE.md || true) >/dev/null; then
    echo "~/.claude/CLAUDE.md: playbooks section missing or out of date"; status=1
  fi
  if ! diff <(codex_agents) <(installed_section ~/.codex/AGENTS.md || true) >/dev/null; then
    echo "~/.codex/AGENTS.md: playbooks section missing or out of date"; status=1
  fi
  if ! diff <(fill "$setup_dir/codex.rules") ~/.codex/rules/agent-playbooks.rules >/dev/null 2>&1; then
    echo "~/.codex/rules/agent-playbooks.rules: missing or out of date"; status=1
  fi
  if ! jq -e --slurpfile want <(fill "$setup_dir/claude-settings.json") \
      '($want[0].permissions.allow - (.permissions.allow // [])) == []
       and ($want[0].permissions.additionalDirectories - (.permissions.additionalDirectories // [])) == []' \
      ~/.claude/settings.json >/dev/null 2>&1; then
    echo "~/.claude/settings.json: playbooks permissions missing"; status=1
  fi
  [ "$status" = 0 ] && echo "Installed rules match the repo."
  return "$status"
}

fill() {
  sed "s#REPO#$repo#g" "$1"
}

case "${1:-}" in
  claude-md) claude_md ;;
  codex-agents) codex_agents ;;
  check) check ;;
  "") sed -n '2,6s/^# \{0,1\}//p' "$0"; exit 2 ;;
  *) fill "$setup_dir/$(basename "$1")" ;;
esac
