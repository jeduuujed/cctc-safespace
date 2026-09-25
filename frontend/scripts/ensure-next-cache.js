const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const frontendDir = path.join(__dirname, '..');
const nextDir = path.join(frontendDir, '.next');

function isJunction(target) {
  if (process.platform !== 'win32' || !fs.existsSync(target)) return false;
  try {
    const out = execFileSync('cmd.exe', ['/c', 'fsutil', 'reparsepoint', 'query', target], {
      encoding: 'utf8'
    });
    return /Reparse Tag Value/i.test(out);
  } catch {
    return false;
  }
}

function removeJunction(linkPath) {
  try {
    execFileSync('cmd.exe', ['/c', 'rmdir', linkPath], { stdio: 'ignore' });
  } catch {
    try {
      fs.rmSync(linkPath, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

if (isJunction(nextDir)) {
  removeJunction(nextDir);
}

fs.mkdirSync(nextDir, { recursive: true });
