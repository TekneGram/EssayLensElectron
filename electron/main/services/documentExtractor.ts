export interface ExtractedDocument {
  text: string;
  extractedAt: string;
}

export async function extractDocumentText(_filePath: string): Promise<ExtractedDocument> {
  return {
    text: '',
    extractedAt: new Date().toISOString()
  };
}
