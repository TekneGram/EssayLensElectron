import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface SQLiteOptions {
  dbPath: string;
  migrationsDir?: string;
}

export interface SQLiteMigration {
  id: string;
  filePath: string;
  sql: string;
}

export class SQLiteClient {
  private readonly dbPath: string;
  private readonly migrationsDir: string;
  private initialized = false;

  constructor(options: SQLiteOptions) {
    this.dbPath = options.dbPath;
    this.migrationsDir = options.migrationsDir ?? path.resolve(process.cwd(), 'electron/main/db/migrations');
  }

  initialize(): void {
    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  getPath(): string {
    return this.dbPath;
  }

  getMigrationsDir(): string {
    return this.migrationsDir;
  }

  loadMigrations(): SQLiteMigration[] {
    const migrationFiles = readdirSync(this.migrationsDir)
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    return migrationFiles.map((fileName) => {
      const filePath = path.join(this.migrationsDir, fileName);
      return {
        id: fileName.replace(/\.sql$/, ''),
        filePath,
        sql: readFileSync(filePath, 'utf8')
      };
    });
  }

  close(): void {
    this.initialized = false;
  }
}
