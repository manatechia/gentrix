const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const isProductionRuntime =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

function forward(command, args, shell = false) {
  const child = spawn(command, args, { stdio: 'inherit', shell });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

if (isProductionRuntime) {
  const entry = path.resolve(__dirname, '..', 'dist', 'apps', 'backend', 'main.js');
  if (!existsSync(entry)) {
    console.error(
      `Compiled backend entrypoint not found at ${entry}. Run the build before starting the service.`,
    );
    process.exit(1);
  }
  console.log('Production runtime detected: starting the compiled NestJS backend.');
  forward(process.execPath, [entry]);
} else {
  console.log('Development runtime detected: starting Nx backend serve.');
  if (process.platform === 'win32') {
    forward('cmd.exe', ['/d', '/s', '/c', 'pnpm exec nx serve backend']);
  } else {
    forward('pnpm', ['exec', 'nx', 'serve', 'backend']);
  }
}
