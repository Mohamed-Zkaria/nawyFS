import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const STATE_FILE = join(__dirname, '.testcontainers.json');

// The container itself is intentionally left for testcontainers' Ryuk
// reaper to stop — globalSetup and globalTeardown run in separate
// processes, so there's no in-memory container handle to close here.
export default function globalTeardown(): void {
  if (existsSync(STATE_FILE)) {
    unlinkSync(STATE_FILE);
  }
}
