export type Id = string;

// These three interfaces represent the tables in the database
export interface RubricNameRow {
    id: Id;
    name: string;
    type: "flat" | "detailed"
}

export interface RubricDetailRow {
    id: Id;
    rubric_id: Id;
    category: string;
    description:string;
}

export interface RubricScoreRow {
    id: Id;
    details_id: Id;
    score_values: number;
}

// This represents data extracted from or sent to the database
type DetailedRubricPayload = {
    rubric: RubricNameRow;
    details: RubricDetailRow[];
    scores: RubricScoreRow[]
};

// ------------------
// In-memory DB
// ------------------

const db: {
    rubric: RubricNameRow;
    details: RubricDetailRow[];
    scores: RubricScoreRow[];
} = (() => {
    const rubricId = "1";
    const categories = ["Content", "Delivery", "Slides"];
    const scores = [4, 3, 2, 1];

    const rubric: RubricNameRow = {
        id: rubricId,
        name: "Presentation Rubric",
        type: "detailed"
    };

    const details: RubricDetailRow[] = [];
    const scoreRows: RubricScoreRow[] = [];

    let d = 1;
    let s = 1;

    for (const cat of categories) {
        for (const score of scores) {
            const detailId = `d-${d++}`;
            details.push({
                id:detailId,
                rubric_id: rubricId,
                category: cat,
                description: `${cat} at ${score} points`,
            });
            scoreRows.push({
                id: `s-${s++}`,
                details_id: detailId,
                score_values: score,
            });
        }
    }

    return { rubric, details, scores: scoreRows}
})();

// IIFS creates an in memory database object that looks something like this
// db.details = [
//     {"d-1", "Content", "Content at 1 points"},
//     {"d-2", "Content", "Content at 2 points"},
//     {"d-3", "Content", "Content at 3 points"},
//     {"d-4", "Content", "Content at 4 points"},
//     {"d-5", "Delivery", "Delivery at 1 points"},
//     {"d-6", "Delivery", "Delivery at 2 points"},
//     {"d-7", "Delivery", "Delivery at 3 points"},
//     ...
//     {"d-12", "Slides", "Slides at 4 points"},

// ]

// db.scores = [
//     { "s-1", "d-1", 1 },
//     { "s-2", "d-2", 2 },
//     { "s-3", "d-3", 3 },
//     { "s-4", "d-4", 4 },
//     { "s-5", "d-5", 1 },
//     { "s-6", "d-6", 2 },
//     ...
//     { "s-12", "d-12", 4 },
// ]

function delay<T>(value: T, ms = 150): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function newId(prefix: string) {
    return `${prefix}-${Math.random().toString(16).slice(2)}`
}

// ----------------------
// Fake API (same shape as IPC calls later)
// ----------------------

export const fakeApi = {
    async getDetailedRubric(rubricId: Id): Promise<DetailedRubricPayload> {
        if (db.rubric.id !== rubricId) throw new Error("Rubric not found");
        return delay({ rubric: db.rubric, details: db.details, scores: db.scores });
    },

    async updateCellDescription(args: { detailId: Id; description: string }) {
        const row = db.details.find((d) => d.id === args.detailId)
        if (!row) throw new Error("detail not found");
        row.description = args.description;
        return delay({ ok: true });
    },

    async updateCategoryName(rubricId: Id, args: { from: string; to: string }) {
        if (db.rubric.id !== rubricId) throw new Error("Rubric not found");
        for (const d of db.details) {
            if (d.rubric_id === rubricId && d.category === args.from) d.category = args.to;
        }
        return delay({ ok: true });
    },

    async updateScoreValue(rubricId: Id, args: { from: number; to: number }) {
        if (db.rubric.id !== rubricId) throw new Error("Rubric not found");

        // all details with score=from should become to (This approach is redundant in a simple example but demos more complex scenarios)
        const detailsWithFrom = new Set<Id>();
        for (const sc of db.scores) {
            if (sc.score_values === args.from) detailsWithFrom.add(sc.details_id);
        }
        for (const sc of db.scores) {
            if (detailsWithFrom.has(sc.details_id)) sc.score_values = args.to;
        }
        return delay({ ok: true })
    },

    async createCategory(rubricId: Id, name: string) {
        if (db.rubric.id !== rubricId) throw new Error("Rubric not found");
        // For each existing score value, create a new cell

        // existing score values take the elements of the db.scores array, extracts the score_values as an array
        // puts them in a set to remove duplicates
        // returns them to an array
        // then sorts them
        const existingScoreValues = Array.from(
            new Set(db.scores.map((s) => s.score_values))
        ).sort((a, b) => b - a);

        for (const scoreValue of existingScoreValues) {
            const detailId = newId("d");
            db.details.push({
                id: detailId,
                rubric_id: rubricId,
                category: name,
                description: ""
            });
            db.scores.push({
                id: newId("s"),
                details_id: detailId,
                score_values: scoreValue
            });
        }
        return delay({ ok: true });
    },

    async createScore(rubricId: Id, value: number) {
        if (db.rubric.id !== rubricId) throw new Error("Rubric not found")
            
            // existingCategories takes each element from db.details and maps the category value into an array
            // then places it into a set to remove duplicates
            // then sets it back as an array.
            const existingCategories = Array.from(
                new Set(db.details.map((d) => d.category))
            );
            
            for (const cat of existingCategories) {
                const detailId = newId("d");
                db.details.push({
                    id: detailId,
                    rubric_id: rubricId,
                    category: cat,
                    description: "",
                });
                db.scores.push({
                    id: newId("s"),
                    details_id: detailId,
                    score_values: value,
                });
            }
            return delay({ ok: true });
    },
};