'use client';

import { useReducer } from 'react';
import { reducer, initialState } from '@/state/reducer';
import SpecInputPage from '@/components/SpecInputPage';
import ToolCardGrid from '@/components/ToolCardGrid';
import DownloadBar from '@/components/DownloadBar';

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <main>
      {state.step === 'input' && (
        <SpecInputPage dispatch={dispatch} />
      )}

      {(state.step === 'review' || state.step === 'download') && state.metadata && (
        <>
          <ToolCardGrid
            toolCards={state.toolCards}
            sessionToken={state.sessionToken}
            dispatch={dispatch}
          />
          <DownloadBar
            toolCards={state.toolCards}
            metadata={state.metadata}
            dispatch={dispatch}
          />
        </>
      )}
    </main>
  );
}
