export interface FeedbackFileRequest {
  sourceFilePath: string;
  outputPath: string;
}

export interface FeedbackFileResult {
  outputPath: string;
}

export async function generateFeedbackFile(
  request: FeedbackFileRequest
): Promise<FeedbackFileResult> {
  return {
    outputPath: request.outputPath
  };
}
