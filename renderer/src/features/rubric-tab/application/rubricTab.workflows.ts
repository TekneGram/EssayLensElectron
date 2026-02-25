import type { AppAction, RubricState } from '../../../state';
import {
  isSelectedRubricStillValid,
  resolvePreferredRubricSelection,
  type RubricListItem
} from '../domain/rubricTab';

type Dispatch = (action: AppAction) => void;
type InteractionMode = RubricState['interactionMode'];

interface ReconcileRubricSelectionArgs {
  rubrics: RubricListItem[];
  selectedRubricId: string | null;
  lastUsedRubricId?: string;
}

interface RubricActionDeps {
  dispatch: Dispatch;
  flushPendingUpdates: () => Promise<void>;
}

interface SelectRubricDeps extends RubricActionDeps {
  setLastUsed: (rubricId: string) => Promise<void>;
}

interface CreateRubricDeps extends RubricActionDeps {
  createRubric: (name: string) => Promise<string>;
}

interface CloneRubricDeps extends SelectRubricDeps {
  cloneRubric: (rubricId: string) => Promise<string>;
}

interface DeleteRubricDeps extends RubricActionDeps {
  deleteRubric: (rubricId: string) => Promise<void>;
}

function setSelectionAndMode(dispatch: Dispatch, rubricId: string | null, mode: InteractionMode): void {
  dispatch({ type: 'rubric/selectEditing', payload: rubricId });
  dispatch({ type: 'rubric/setInteractionMode', payload: mode });
}

export function reconcileRubricSelection(args: ReconcileRubricSelectionArgs): { rubricId: string | null; mode: 'viewing' } | null {
  const { rubrics, selectedRubricId, lastUsedRubricId } = args;

  if (rubrics.length === 0) {
    return { rubricId: null, mode: 'viewing' };
  }

  if (isSelectedRubricStillValid(rubrics, selectedRubricId)) {
    return null;
  }

  const preferredRubricId = resolvePreferredRubricSelection({ rubrics, selectedRubricId, lastUsedRubricId });
  return { rubricId: preferredRubricId, mode: 'viewing' };
}

export async function selectRubric(deps: SelectRubricDeps, rubricId: string): Promise<void> {
  await deps.flushPendingUpdates();
  setSelectionAndMode(deps.dispatch, rubricId, 'viewing');
  void deps.setLastUsed(rubricId);
}

export async function createRubricAndSelect(deps: CreateRubricDeps, rubricName = 'New Rubric'): Promise<void> {
  await deps.flushPendingUpdates();
  const createdRubricId = await deps.createRubric(rubricName);
  setSelectionAndMode(deps.dispatch, createdRubricId, 'editing');
}

export async function cloneRubricAndSelect(deps: CloneRubricDeps, rubricId: string): Promise<void> {
  await deps.flushPendingUpdates();
  const clonedRubricId = await deps.cloneRubric(rubricId);
  setSelectionAndMode(deps.dispatch, clonedRubricId, 'editing');
  await deps.setLastUsed(clonedRubricId);
}

export async function deleteRubricAndClearSelection(deps: DeleteRubricDeps, rubricId: string): Promise<void> {
  await deps.flushPendingUpdates();
  await deps.deleteRubric(rubricId);
  setSelectionAndMode(deps.dispatch, null, 'viewing');
}

export async function setRubricInteractionMode(
  dispatch: Dispatch,
  flushPendingUpdates: () => Promise<void>,
  mode: 'editing' | 'viewing'
): Promise<void> {
  await flushPendingUpdates();
  dispatch({ type: 'rubric/setInteractionMode', payload: mode });
}
