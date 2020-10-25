import type { DatabaseConnection } from './interface';

export async function create(uri: string): Promise<DatabaseConnection> {
  if (typeof global !== 'undefined') {
    return (await import('./node.js')).create(uri!);
  } else {
    return (await import('./browser.js')).create(uri!);
  }
}
