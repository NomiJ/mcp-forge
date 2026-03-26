import { ToolCard, SpecMetadata, ParseResponse } from '@/types';

export type AppStep = 'input' | 'review' | 'download';

export interface AppState {
  step: AppStep;
  metadata: SpecMetadata | null;
  toolCards: ToolCard[];
  sessionToken: string | null;
}

export type AppAction =
  | { type: 'PARSE_SUCCESS'; payload: ParseResponse & { sessionToken: string } }
  | { type: 'TOGGLE_CARD'; id: string }
  | { type: 'UPDATE_TOOL_NAME'; id: string; toolName: string }
  | { type: 'UPDATE_DESCRIPTION'; id: string; description: string }
  | { type: 'REWRITE_SUCCESS'; id: string; toolName: string; description: string }
  | { type: 'PROCEED_TO_DOWNLOAD' }
  | { type: 'RESET' };

export const initialState: AppState = {
  step: 'input',
  metadata: null,
  toolCards: [],
  sessionToken: null,
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'PARSE_SUCCESS':
      return {
        ...state,
        step: 'review',
        metadata: action.payload.metadata,
        toolCards: action.payload.toolCards,
        sessionToken: action.payload.sessionToken,
      };

    case 'TOGGLE_CARD':
      return {
        ...state,
        toolCards: state.toolCards.map((card) =>
          card.id === action.id ? { ...card, enabled: !card.enabled } : card
        ),
      };

    case 'UPDATE_TOOL_NAME':
      return {
        ...state,
        toolCards: state.toolCards.map((card) =>
          card.id === action.id ? { ...card, toolName: action.toolName } : card
        ),
      };

    case 'UPDATE_DESCRIPTION':
      return {
        ...state,
        toolCards: state.toolCards.map((card) =>
          card.id === action.id ? { ...card, description: action.description } : card
        ),
      };

    case 'REWRITE_SUCCESS':
      return {
        ...state,
        toolCards: state.toolCards.map((card) =>
          card.id === action.id
            ? { ...card, toolName: action.toolName, description: action.description }
            : card
        ),
      };

    case 'PROCEED_TO_DOWNLOAD':
      return { ...state, step: 'download' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
