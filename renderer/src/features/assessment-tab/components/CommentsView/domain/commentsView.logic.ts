import type { CommentsTab } from '../../../../../state';
import type { FeedbackItem } from '../../../../../types';

export function isCommentsTabActive(activeTab: CommentsTab): boolean {
  return activeTab === 'comments';
}

export function isScoreTabActive(activeTab: CommentsTab): boolean {
  return activeTab === 'score';
}

export function canGenerateDocument(canGenerateFeedbackDocument: boolean, isGeneratePending: boolean): boolean {
  return canGenerateFeedbackDocument && !isGeneratePending;
}

export function shouldShowEmptyCommentsState(args: {
  isLoading: boolean;
  error?: string;
  comments: FeedbackItem[];
}): boolean {
  return !args.isLoading && !args.error && args.comments.length === 0;
}

export function shouldRenderCommentsList(comments: FeedbackItem[]): boolean {
  return comments.length > 0;
}
