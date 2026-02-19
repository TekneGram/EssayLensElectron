export interface FeedbackRecord {
  id: string;
  fileId: string;
  kind: 'inline' | 'block';
  source: 'teacher' | 'llm';
  commentText: string;
  applied?: boolean;
  createdAt?: string;
  updatedAt?: string;
  exactQuote?: string;
  prefixText?: string;
  suffixText?: string;
  startAnchor?: {
    part: string;
    paragraphIndex: number;
    runIndex: number;
    charOffset: number;
  };
  endAnchor?: {
    part: string;
    paragraphIndex: number;
    runIndex: number;
    charOffset: number;
  };
}

interface FeedbackRow {
  uuid: string;
  entity_uuid: string;
  kind: 'inline' | 'block';
  source: 'teacher' | 'llm';
  comment_text: string;
  exact_quote: string | null;
  prefix_text: string | null;
  suffix_text: string | null;
  applied: 0 | 1;
  created_at: string;
  updated_at: string | null;
}

type AnchorKind = 'start' | 'end';

interface FeedbackAnchorRow {
  feedback_uuid: string;
  anchor_kind: AnchorKind;
  part: string;
  paragraph_index: number;
  run_index: number;
  char_offset: number;
}

interface FeedbackRepositoryOptions {
  now?: () => string;
}

export class FeedbackRepository {
  private feedbackById = new Map<string, FeedbackRow>();
  private anchorByFeedbackId = new Map<string, Map<AnchorKind, FeedbackAnchorRow>>();
  private readonly now: () => string;

  constructor(options: FeedbackRepositoryOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async listByFileId(fileId: string): Promise<FeedbackRecord[]> {
    const rows = Array.from(this.feedbackById.values()).filter((row) => row.entity_uuid === fileId);
    return rows.map((row) => this.mapRowToRecord(row));
  }

  async add(feedback: FeedbackRecord): Promise<FeedbackRecord> {
    const nextFeedbackById = new Map(this.feedbackById);
    const nextAnchorByFeedbackId = this.cloneAnchorMap();
    const createdAt = feedback.createdAt ?? this.now();
    const updatedAt = feedback.updatedAt ?? null;
    const appliedValue = feedback.applied === true ? 1 : 0;

    if (!feedback.id.trim()) {
      throw new Error('Feedback id is required.');
    }
    if (!feedback.fileId.trim()) {
      throw new Error('Feedback fileId is required.');
    }
    if (!feedback.commentText.trim()) {
      throw new Error('Feedback commentText is required.');
    }
    if (nextFeedbackById.has(feedback.id)) {
      throw new Error(`Feedback id already exists: ${feedback.id}`);
    }

    const isInline = feedback.kind === 'inline';
    if (!isInline) {
      if (feedback.exactQuote || feedback.prefixText || feedback.suffixText || feedback.startAnchor || feedback.endAnchor) {
        throw new Error('Block feedback cannot include inline quote or anchor fields.');
      }
    } else {
      if (!feedback.exactQuote || feedback.exactQuote.trim().length === 0) {
        throw new Error('Inline feedback requires exactQuote.');
      }
      if (feedback.prefixText === undefined || feedback.suffixText === undefined) {
        throw new Error('Inline feedback requires prefixText and suffixText.');
      }
      if (!feedback.startAnchor || !feedback.endAnchor) {
        throw new Error('Inline feedback requires both startAnchor and endAnchor.');
      }
    }

    const nextRow: FeedbackRow = {
      uuid: feedback.id,
      entity_uuid: feedback.fileId,
      kind: feedback.kind,
      source: feedback.source,
      comment_text: feedback.commentText,
      exact_quote: feedback.exactQuote ?? null,
      prefix_text: feedback.prefixText ?? null,
      suffix_text: feedback.suffixText ?? null,
      applied: appliedValue,
      created_at: createdAt,
      updated_at: updatedAt
    };
    nextFeedbackById.set(feedback.id, nextRow);

    if (isInline) {
      this.insertAnchorRow(nextAnchorByFeedbackId, {
        feedback_uuid: feedback.id,
        anchor_kind: 'start',
        ...this.toAnchorColumns(feedback.startAnchor!)
      });
      this.insertAnchorRow(nextAnchorByFeedbackId, {
        feedback_uuid: feedback.id,
        anchor_kind: 'end',
        ...this.toAnchorColumns(feedback.endAnchor!)
      });
    }

    this.feedbackById = nextFeedbackById;
    this.anchorByFeedbackId = nextAnchorByFeedbackId;
    return this.mapRowToRecord(this.feedbackById.get(feedback.id)!);
  }

  private cloneAnchorMap(): Map<string, Map<AnchorKind, FeedbackAnchorRow>> {
    return new Map(
      Array.from(this.anchorByFeedbackId.entries()).map(([feedbackId, anchors]) => {
        return [feedbackId, new Map(anchors)];
      })
    );
  }

  private insertAnchorRow(
    anchorByFeedbackId: Map<string, Map<AnchorKind, FeedbackAnchorRow>>,
    row: FeedbackAnchorRow
  ): void {
    if (!row.part.trim()) {
      throw new Error(`Anchor part is required (${row.anchor_kind}).`);
    }
    if (row.paragraph_index < 0 || row.run_index < 0 || row.char_offset < 0) {
      throw new Error(`Anchor index fields must be non-negative (${row.anchor_kind}).`);
    }

    const anchors = anchorByFeedbackId.get(row.feedback_uuid) ?? new Map<AnchorKind, FeedbackAnchorRow>();
    if (anchors.has(row.anchor_kind)) {
      throw new Error(`Duplicate ${row.anchor_kind} anchor for feedback ${row.feedback_uuid}.`);
    }
    anchors.set(row.anchor_kind, row);
    anchorByFeedbackId.set(row.feedback_uuid, anchors);
  }

  private toAnchorColumns(anchor: FeedbackRecord['startAnchor']): Omit<FeedbackAnchorRow, 'feedback_uuid' | 'anchor_kind'> {
    if (!anchor) {
      throw new Error('Anchor is required.');
    }
    return {
      part: anchor.part,
      paragraph_index: anchor.paragraphIndex,
      run_index: anchor.runIndex,
      char_offset: anchor.charOffset
    };
  }

  private mapRowToRecord(row: FeedbackRow): FeedbackRecord {
    const base: FeedbackRecord = {
      id: row.uuid,
      fileId: row.entity_uuid,
      kind: row.kind,
      source: row.source,
      commentText: row.comment_text,
      applied: row.applied === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined
    };

    if (row.kind === 'block') {
      return base;
    }

    const anchors = this.anchorByFeedbackId.get(row.uuid);
    const start = anchors?.get('start');
    const end = anchors?.get('end');
    if (!start || !end) {
      throw new Error(`Inline feedback ${row.uuid} is missing required anchors.`);
    }

    return {
      ...base,
      kind: 'inline',
      exactQuote: row.exact_quote ?? '',
      prefixText: row.prefix_text ?? '',
      suffixText: row.suffix_text ?? '',
      startAnchor: this.mapAnchorRow(start),
      endAnchor: this.mapAnchorRow(end)
    };
  }

  private mapAnchorRow(row: FeedbackAnchorRow): FeedbackRecord['startAnchor'] {
    return {
      part: row.part,
      paragraphIndex: row.paragraph_index,
      runIndex: row.run_index,
      charOffset: row.char_offset
    };
  }
}
