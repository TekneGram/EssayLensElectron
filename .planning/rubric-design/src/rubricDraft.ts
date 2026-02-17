import type { Id, RubricNameRow, RubricDetailRow, RubricScoreRow } from './fakeserver';

export interface RubricDraft {
    rubricId: Id;
    rubricName: string;
    type: "detailed"

    categoryOrder: Id[]
    scoreOrder: Id[]

    categoriesById: Record<Id, { id: Id; name: string }>;
    scoresById: Record<Id, { id: Id; value: number }>;

    cellsByKey: Record<
        string, // `${categoryId}:${scoreId}`
        {
            key: string;
            categoryId: Id;
            scoreId: Id;
            detailId: Id;
            scoreRowId: Id;
            description: string;
        }
    >;
}

const categoryAxisId = (name: string) => `cat${name}`;
const scoreAxisId = (value: number) => `score:${value}`;
const makeKey = (catId: Id, scoreId: Id) => `${catId}:${scoreId}`;

export function buildDraft(input: {
    rubric: RubricNameRow;
    details: RubricDetailRow[];
    scores: RubricScoreRow[];
}): RubricDraft {
    const scoreByDetailsId: Record<Id, RubricScoreRow> = {};
    for (const s of input.scores) scoreByDetailsId[s.details_id] = s;

    const categoryNames = new Set<string>();
    const scoreValues = new Set<number>();

    for (const d of input.details) {
        const s = scoreByDetailsId[d.id];
        if (!s) continue;
        categoryNames.add(d.category);
        scoreValues.add(s.score_values);
    }

    const categoryIds = Array.from(categoryNames).map(categoryAxisId);
    const scoreIds = Array.from(scoreValues).sort((a, b) => b - a).map(scoreAxisId);

    const categoriesById: RubricDraft["categoriesById"] = {};
    for (const name of categoryNames) {
        const id = categoryAxisId(name)
        categoriesById[id] = { id, name };
    }

    const scoresById: RubricDraft["scoresById"] = {}
    for (const v of scoreValues) {
        const id = scoreAxisId(v);
        scoresById[id] = { id, value: v };
    }

    const cellsByKey: RubricDraft["cellsByKey"] = {};
    for (const d of input.details) {
        const s = scoreByDetailsId[d.id];
        if (!s) continue;
        const cId = categoryAxisId(d.category);
        const scId = scoreAxisId(s.score_values);
        const key = makeKey(cId, scId);
        cellsByKey[key] = {
            key,
            categoryId: cId,
            scoreId: scId,
            detailId: d.id,
            scoreRowId: s.id,
            description: d.description ?? ""
        };
    }

    for (const cId of categoryIds) {
        for (const scId of scoreIds) {
            const key = makeKey(cId, scId);
            if (!cellsByKey[key]) {
                cellsByKey[key] = {
                    key,
                    categoryId: cId,
                    scoreId: scId,
                    detailId: `temp_detail:${key}`,
                    scoreRowId: `temp_score:${key}`,
                    description: ""
                };
            }
        }
    }

    return {
        rubricId: input.rubric.id,
        rubricName: input.rubric.name,
        type: "detailed",
        categoryOrder: categoryIds,
        scoreOrder: scoreIds,
        categoriesById,
        scoresById,
        cellsByKey,
    }
}