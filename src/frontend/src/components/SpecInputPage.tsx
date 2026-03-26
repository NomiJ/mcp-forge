'use client';

import { Dispatch } from 'react';
import { AppAction } from '@/state/reducer';

interface Props {
  dispatch: Dispatch<AppAction>;
}

// TODO: implement spec input form
// Inputs: direct spec URL, base server URL (with auto-discovery), file upload
// On submit: call POST /api/v1/discover (base URL) or POST /api/v1/parse (spec URL or file)
// On success: dispatch PARSE_SUCCESS with toolCards, metadata, sessionToken
export default function SpecInputPage({ dispatch: _dispatch }: Props) {
  return (
    <div>
      <h1>MCPForge</h1>
      <p>SpecInputPage — not yet implemented</p>
    </div>
  );
}
