import fs from 'fs';
import path from 'path';

// Private server data (credentials, local database, settings). Unlike uploads/, nothing here is
// served over HTTP — keep it out of every static route.
export const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

// Path of a data file, moving it out of the public uploads/ folder where older versions kept it
export function dataFile(name: string): string {
  const target = path.join(DATA_DIR, name);
  const legacy = path.join(process.cwd(), 'uploads', name);
  if (!fs.existsSync(target) && fs.existsSync(legacy)) {
    fs.renameSync(legacy, target);
  }
  return target;
}
