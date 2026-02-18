export interface RubricSummaryRecord {
  id: string;
  name: string;
  description?: string;
}

export interface RubricMatrixRecord {
  rubricId: string;
}

export class RubricRepository {
  async listRubrics(): Promise<RubricSummaryRecord[]> {
    return [];
  }

  async getRubricMatrix(_rubricId: string): Promise<RubricMatrixRecord | null> {
    return null;
  }
}
