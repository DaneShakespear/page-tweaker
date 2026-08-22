#!/usr/bin/env node
const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron');
const source = process.argv[2];
if (!source) {
  console.error('Usage: page-tweaker <local-html-file|public-url>');
  process.exitCode = 1;
} else {
  spawn(electron, [path.join(__dirname, '..'), source], { detached: true, stdio: 'ignore' }).unref();
}
