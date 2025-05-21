import { z } from 'zod';

// Core flow types based on reverse engineering the structure

export interface FlowManifest {
  id: string;
  name: string;
  type: string;
  properties: {
    apiId: string;
    displayName: string;
    description?: string;
    iconUri?: string;
    environmentName?: string;
    definition: FlowDefinition;
    connectionReferences?: Record<string, ConnectionReference>;
  };
}

export interface FlowDefinition {
  $schema: string;
  contentVersion: string;
  outputs?: any;
  parameters?: Record<string, any>;
  triggers: Record<string, FlowTrigger>;
  actions: Record<string, FlowAction>;
  description?: string;
}

export interface ConnectionReference {
  connection: {
    id: string;
  };
  api: {
    id: string;
  };
  connectionName?: string;
  source?: string;
  tier?: string;
  apiName?: string;
}

export interface FlowTrigger {
  type: string;
  kind?: string;
  inputs: Record<string, any>;
  recurrence?: {
    frequency: string;
    interval: number;
  };
  conditions?: any[];
  metadata?: Record<string, any>;
  splitOn?: string;
  host?: {
    connection?: any;
    api?: any;
    operationId?: string;
    connectionName?: string;
  };
}

export interface FlowAction {
  type: string;
  runAfter?: Record<string, string[]>;
  inputs: Record<string, any>;
  metadata?: Record<string, any>;
  expression?: any;
  actions?: Record<string, FlowAction>;
  else?: {
    actions: Record<string, FlowAction>;
  };
  path?: string;
  host?: {
    connection?: any;
    api?: any;
    operationId?: string;
    connectionName?: string;
  };
  method?: string;
  body?: any;
}

// Specific trigger types
export interface ManualTrigger extends FlowTrigger {
  type: 'Request';
  kind: 'Http';
  inputs: {
    schema: Record<string, any>;
    method: string;
  };
}

export interface ScheduledTrigger extends FlowTrigger {
  type: 'Recurrence';
  recurrence: {
    frequency: 'Minute' | 'Hour' | 'Day' | 'Week' | 'Month';
    interval: number;
  };
}

export interface SharePointTrigger extends FlowTrigger {
  type: 'ApiConnection';
  inputs: {
    host: {
      connection: {
        name: string;
      };
      api: {
        runtimeUrl: string;
      };
    };
    method: string;
    path: string;
    authentication: string;
  };
  recurrence: {
    frequency: string;
    interval: number;
  };
  splitOn: string;
}

// Specific action types
export interface HttpAction extends FlowAction {
  type: 'Http';
  inputs: {
    method: string;
    uri: string;
    headers?: Record<string, string>;
    body?: any;
    authentication?: any;
  };
}

export interface ConditionAction extends FlowAction {
  type: 'If';
  inputs: {
    expression: any;
    actions: Record<string, FlowAction>;
    else?: {
      actions: Record<string, FlowAction>;
    };
  };
}

export interface SwitchAction extends FlowAction {
  type: 'Switch';
  inputs: {
    expression: any;
    cases: Record<string, {
      actions: Record<string, FlowAction>;
    }>;
    default?: {
      actions: Record<string, FlowAction>;
    };
  };
}

export interface ComposeAction extends FlowAction {
  type: 'Compose';
  inputs: any;
}

export interface EmailAction extends FlowAction {
  type: 'ApiConnection';
  inputs: {
    host: {
      connection: {
        name: string;
      };
      api: {
        runtimeUrl: string;
      };
    };
    method: string;
    body: {
      to: string;
      subject: string;
      text: string;
      ishtml?: boolean;
      cc?: string;
      bcc?: string;
    };
    path: string;
    authentication: string;
  };
}

// Zod schemas for runtime validation

export const FlowActionSchema = z.object({
  type: z.string(),
  runAfter: z.record(z.array(z.string())).optional(),
  inputs: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  path: z.string().optional(),
  method: z.string().optional(),
  body: z.any().optional()
});

export const FlowTriggerSchema = z.object({
  type: z.string(),
  kind: z.string().optional(),
  inputs: z.record(z.any()),
  recurrence: z.object({
    frequency: z.string(),
    interval: z.number()
  }).optional(),
  conditions: z.array(z.any()).optional(),
  splitOn: z.string().optional()
});

export const FlowDefinitionSchema = z.object({
  $schema: z.string(),
  contentVersion: z.string(),
  outputs: z.any().optional(),
  parameters: z.record(z.any()).optional(),
  triggers: z.record(FlowTriggerSchema),
  actions: z.record(FlowActionSchema),
  description: z.string().optional()
});

export const ConnectionReferenceSchema = z.object({
  connection: z.object({
    id: z.string()
  }),
  api: z.object({
    id: z.string()
  }),
  connectionName: z.string().optional(),
  source: z.string().optional(),
  tier: z.string().optional(),
  apiName: z.string().optional()
});

export const FlowManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  properties: z.object({
    apiId: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    iconUri: z.string().optional(),
    environmentName: z.string().optional(),
    definition: FlowDefinitionSchema,
    connectionReferences: z.record(ConnectionReferenceSchema).optional()
  })
}); 