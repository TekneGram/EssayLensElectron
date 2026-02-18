export type EntityId = string;
export type ISODateString = string;

export type FileKind =
  | 'docx'
  | 'pdf'
  | 'jpeg'
  | 'jpg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'bmp'
  | 'svg'
  | 'heic'
  | 'heif'
  | 'avif'
  | 'tiff'
  | 'tif'
  | 'unknown';

export type CommentKind = 'inline' | 'block';
export type ChatRole = 'system' | 'teacher' | 'assistant';

export type AssessmentTopTab = 'assessment' | 'rubric';
export type CommentsTab = 'comments' | 'score';
export type Theme = 'light' | 'dark' | 'system';
