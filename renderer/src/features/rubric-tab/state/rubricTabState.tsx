import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

export interface RubricTabListItem {
  entityUuid: string;
  name: string;
  isActive: boolean;
  isArchived: boolean;
}

export interface RubricTabState {
  rubricList: RubricTabListItem[];
  selectedEditingRubricId: string | null;
  interactionMode: 'editing' | 'viewing';
  activeMatrix: null;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

export type RubricTabAction =
  | { type: 'rubricTab/setList'; payload: RubricTabListItem[] }
  | { type: 'rubricTab/selectEditing'; payload: string | null }
  | { type: 'rubricTab/setInteractionMode'; payload: RubricTabState['interactionMode'] }
  | { type: 'rubricTab/setStatus'; payload: RubricTabState['status'] }
  | { type: 'rubricTab/setError'; payload?: string };

const initialRubricTabState: RubricTabState = {
  rubricList: [],
  selectedEditingRubricId: null,
  interactionMode: 'viewing',
  activeMatrix: null,
  status: 'idle'
};

function rubricTabReducer(state: RubricTabState, action: RubricTabAction): RubricTabState {
  switch (action.type) {
    case 'rubricTab/setList':
      return {
        ...state,
        rubricList: action.payload
      };
    case 'rubricTab/selectEditing':
      return {
        ...state,
        selectedEditingRubricId: action.payload
      };
    case 'rubricTab/setInteractionMode':
      return {
        ...state,
        interactionMode: action.payload
      };
    case 'rubricTab/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'rubricTab/setError':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

const RubricTabStateContext = createContext<RubricTabState | undefined>(undefined);
const RubricTabDispatchContext = createContext<Dispatch<RubricTabAction> | undefined>(undefined);

interface RubricTabStateProviderProps {
  children: ReactNode;
}

export function RubricTabStateProvider({ children }: RubricTabStateProviderProps) {
  const [state, dispatch] = useReducer(rubricTabReducer, initialRubricTabState);
  const stateValue = useMemo(() => state, [state]);

  return (
    <RubricTabStateContext.Provider value={stateValue}>
      <RubricTabDispatchContext.Provider value={dispatch}>{children}</RubricTabDispatchContext.Provider>
    </RubricTabStateContext.Provider>
  );
}

export function useRubricTabState(): RubricTabState {
  const context = useContext(RubricTabStateContext);
  if (!context) {
    throw new Error('useRubricTabState must be used within RubricTabStateProvider');
  }
  return context;
}

export function useRubricTabDispatch(): Dispatch<RubricTabAction> {
  const context = useContext(RubricTabDispatchContext);
  if (!context) {
    throw new Error('useRubricTabDispatch must be used within RubricTabStateProvider');
  }
  return context;
}
