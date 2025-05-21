import { FlowTrigger, FlowAction } from './flow-types'; // Assuming these are your existing trigger/action types
import {
  WorkflowDefinition,
  WorkflowParameterDefinition,
  WorkflowTriggerItem,
  WorkflowActionItem
} from './workflow-definition.schema';

/**
 * Represents a single connection reference entry within the clientData.properties.connectionReferences object.
 */
export interface ConnectionReferenceValue {
  connectionName: string;
  id: string;
  source?: string; // e.g., "Invoker"
  // Add other fields like 'connectionReferenceLogicalName' if populated from customizations.xml
}

/**
 * Parameters defined within the flow definition logic (e.g., $connections, $authentication).
 * These should conform to the structure of WorkflowParameterDefinition.
 */
export interface FlowDefinitionRunParameters {
  $connections?: WorkflowParameterDefinition & { defaultValue: object; type: 'Object'; }; // Overriding for specific structure
  $authentication?: WorkflowParameterDefinition & { defaultValue: object; type: 'SecureObject'; }; // Overriding for specific structure
  // Allow other parameters that conform to WorkflowParameterDefinition
  [key: string]: WorkflowParameterDefinition | undefined;
}

/**
 * Represents the core logic of a flow definition (triggers, actions, parameters).
 * This should align with the WorkflowDefinition schema.
 */
export interface FlowDefinitionLogic {
  $schema: WorkflowDefinition['$schema'];
  contentVersion: WorkflowDefinition['contentVersion'];
  parameters?: FlowDefinitionRunParameters; // Runtime parameters like $connections
  triggers: Record<string, WorkflowTriggerItem>;
  actions: Record<string, WorkflowActionItem>;
  outputs?: WorkflowDefinition['outputs'];
  metadata?: WorkflowDefinition['metadata'];
  description?: WorkflowDefinition['description'];
}

/**
 * Represents the 'properties' object within the clientData of a workflow.
 */
export interface ClientDataProperties {
  connectionReferences: Record<string, ConnectionReferenceValue>;
  definition: FlowDefinitionLogic;
  // Add other potential properties like apiId, templateName, etc.
  apiId?: string;
  templateName?: string | null;
}

/**
 * Represents the root clientData object for a workflow entity in a solution.
 */
export interface ClientData {
  schemaVersion: string;
  properties: ClientDataProperties;
  // Add other potential top-level properties like 'kind' if observed in examples.
  kind?: string; 
} 