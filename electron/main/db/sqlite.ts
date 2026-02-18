export interface SQLiteOptions {
  dbPath: string;
}

export class SQLiteClient {
  private readonly dbPath: string;
  private initialized = false;

  constructor(options: SQLiteOptions) {
    this.dbPath = options.dbPath;
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

  close(): void {
    this.initialized = false;
  }
}
