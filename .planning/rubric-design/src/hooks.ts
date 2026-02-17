import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fakeApi, type Id} from "./fakeserver";
import { buildDraft, type RubricDraft } from "./rubricDraft"

const key = (rubricId: Id) => ["rubric", rubricId, "detailed"] as const;

export function useRubricDraft(rubricId: Id) {
    return useQuery({
        queryKey: key(rubricId),
        queryFn: async () => buildDraft(await fakeApi.getDetailedRubric(rubricId)),
    });
}

export function useUpdateCellDescription(rubricId: Id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fakeApi.updateCellDescription,
        onMutate: async (args) => {
            await qc.cancelQueries({ queryKey: key(rubricId) });
            const prev = qc.getQueryData<RubricDraft>(key(rubricId));
            qc.setQueryData<RubricDraft>(key(rubricId), (draft) => {
                if (!draft) return draft;
                const next = structuredClone(draft);
                for (const k in next.cellsByKey) {
                    const cell = next.cellsByKey[k]
                    if (cell.detailId === args.detailId) {
                        cell.description =args.description;
                        break;
                    }
                }
                return next;
            });
            return  { prev };
        },
        onError: (_e, _a, ctx) => ctx?.prev && qc.setQueryData(key(rubricId), ctx.prev),
        onSettled: () => qc.invalidateQueries({ queryKey: key(rubricId) }),
    });
}

export function useRenameCategory(rubricId: Id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (args: { from: string; to: string }) =>
            fakeApi.updateCategoryName(rubricId, args),
        onSettled: () => qc.invalidateQueries({ queryKey: key(rubricId) }),
    });
}

export function useChangeScoreValue(rubricId: Id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (args: { from: number; to: number }) =>
            fakeApi.updateScoreValue(rubricId, args),
        onSettled: () => qc.invalidateQueries({ queryKey: key(rubricId) }),
    });
}

export function useCreateCategory(rubricId: Id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => fakeApi.createCategory(rubricId, name),
        onSettled: () => qc.invalidateQueries({ queryKey: key(rubricId) }),
    });
}

export function useCreateScore(rubricId: Id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (value: number) => fakeApi.createScore(rubricId, value),
        onSettled: () => qc.invalidateQueries({ queryKey: key(rubricId) }),
    });
}