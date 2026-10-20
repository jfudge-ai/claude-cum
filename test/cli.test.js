'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.join(__dirname, '..', 'bin', 'claude-cum.js');

function run(args, env = process.env) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    env,
    input: ''
  });
}

test('help identifies this as an unofficial parody', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Unofficial parody/);
});

test('dry run shows the real Claude flag and forwards arguments', () => {
  const result = run(['--dry-run', '--print', 'hello']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--dangerously-skip-permissions/);
  assert.match(result.stdout, /--print/);
  assert.match(result.stdout, /hello/);
});

test('non-interactive launch requires confirmation', () => {
  const result = run(['--print', 'hello']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /permission prompts/);
});

test('--yes launches Claude and forwards arguments', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-cum-'));
  try {
    const stub = path.join(dir, process.platform === 'win32' ? 'claude.cmd' : 'claude');
    if (process.platform === 'win32') {
      fs.writeFileSync(stub, '@echo off\r\necho CLAUDE_STUB %*\r\n');
    } else {
      fs.writeFileSync(stub, '#!/bin/sh\necho CLAUDE_STUB "$@"\n', { mode: 0o755 });
    }
    const result = run(['--yes', '--print', 'hello'], {
      ...process.env,
      PATH: `${dir}${path.delimiter}${process.env.PATH || ''}`
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CLAUDE_STUB/);
    assert.match(result.stdout, /--dangerously-skip-permissions/);
    assert.match(result.stdout, /--print/);
    assert.match(result.stdout, /hello/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
