#!/usr/bin/env node
'use strict';

const spawn = require('cross-spawn');
const readline = require('node:readline/promises');

const HELP = `Claude Cum v0.1.0 — the command Google invented, made real.

Unofficial parody. This is not a Claude or Anthropic feature.

Usage:
  claude-cum [options] [Claude arguments]

Options:
  -y, --yes      Confirm that Claude will skip permission prompts
  --dry-run      Show what would run without launching Claude
  -h, --help     Show this help

All other arguments go to Claude Code. Claude Code must be installed separately.
The launcher runs: claude --dangerously-skip-permissions [Claude arguments]
`;

async function main() {
  const input = process.argv.slice(2);

  if (input.includes('--help') || input.includes('-h')) {
    process.stdout.write(HELP);
    return;
  }

  const confirmed = input.includes('--yes') || input.includes('-y');
  const dryRun = input.includes('--dry-run');
  const forwarded = input.filter(arg =>
    !['--yes', '-y', '--dry-run', '--dangerously-skip-permissions'].includes(arg)
  );
  const command = ['--dangerously-skip-permissions', ...forwarded];

  if (dryRun) {
    process.stdout.write(`Would run: claude ${command.map(JSON.stringify).join(' ')}\n`);
    return;
  }

  process.stdout.write('Google made this command up. I made it run.\n');

  if (!confirmed) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      process.stderr.write('Claude Cum skips Claude permission prompts. Run interactively to confirm, or pass --yes.\n');
      process.exitCode = 2;
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let answer;
    try {
      answer = await rl.question('Claude will run without permission prompts. Continue? [y/N] ');
    } finally {
      rl.close();
    }

    if (!/^y(es)?$/i.test(answer.trim())) {
      process.stdout.write('Fair. Google can keep this one.\n');
      return;
    }
  }

  const child = spawn('claude', command, { stdio: 'inherit' });
  child.on('error', error => {
    if (error.code === 'ENOENT') {
      process.stderr.write('Claude Code was not found on your PATH. Install it first: https://docs.anthropic.com/en/docs/claude-code/overview\n');
    } else {
      process.stderr.write(`Could not launch Claude: ${error.message}\n`);
    }
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.stderr.write(`Claude stopped after signal ${signal}.\n`);
      process.exitCode = 1;
    } else {
      process.exitCode = code ?? 1;
    }
  });
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
