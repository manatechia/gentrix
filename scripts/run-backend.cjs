const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const isProductionRuntime =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

function forwardProcess(command, args, description) {
  console.log(description);

  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

if (isProductionRuntime) {
  const compiledEntry = path.resolve(__dirname, '..', 'dist', 'apps', 'backend', 'main.js');

  if (!existsSync(compiledEntry)) {
    console.error(
      `Compiled backend entrypoint not found at ${compiledEntry}. Run the build before starting the service.`,
    );
    process.exit(1);
  }

  forwardProcess(
    process.execPath,
    [compiledEntry],
    'Production runtime detected: starting the compiled NestJS backend.',
  );
} else {
  if (process.platform === 'win32') {
    forwardProcess(
      'cmd.exe',
      ['/d', '/s', '/c', 'pnpm exec nx serve backend'],
      'Development runtime detected: starting Nx backend serve.',
    );
  } else {
    forwardProcess(
      'pnpm',
      ['exec', 'nx', 'serve', 'backend'],
      'Development runtime detected: starting Nx backend serve.',
    );
  }
}
