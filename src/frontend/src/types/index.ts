export type QualityScore = 'green' | 'yellow' | 'red';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  type: string;
  description: string;
}

export interface RequestBody {
  required: boolean;
  contentType: string;
  schema: Record<string, unknown>;
}

export interface AuthScheme {
  type: 'apiKey' | 'bearer' | 'basic';
  location: 'header' | 'query' | 'cookie';
  name: string;
}

export interface ToolCard {
  id: string;
  enabled: boolean;
  toolName: string;
  description: string;
  method: HttpMethod;
  path: string;
  parameters: Parameter[];
  requestBody: RequestBody | null;
  auth: AuthScheme | null;
  qualityScore: QualityScore;
  llmPreview: string;
}

export interface SpecMetadata {
  title: string;
  version: string;
  baseUrl: string;
}

export interface ParseResponse {
  metadata: SpecMetadata;
  toolCards: ToolCard[];
}

export interface RewriteResponse {
  toolName: string;
  description: string;
}
