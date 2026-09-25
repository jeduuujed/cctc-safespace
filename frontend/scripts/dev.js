const path = require('path');
const { spawn } = require('child_process');

require('./ensure-next-cache');

const frontendDir = path.join(__dirname, '..');
process.env.NODE_PATH = [path.join(frontendDir, 'node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter);

const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => process.exit(code || 0));
