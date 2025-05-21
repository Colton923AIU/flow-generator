import { WorkflowTriggerItem, TriggerKind } from '../../../models/workflow-definition.schema';

/**
 * Creates a manual trigger definition.
 * Corresponds to "Manually trigger a flow".
 * @param inputsSchema Optional JSON schema for any inputs the user should provide when triggering.
 * @returns A WorkflowTriggerItem object for a manual trigger.
 */
export function createManualTrigger(inputsSchema?: any): WorkflowTriggerItem {
    const trigger: WorkflowTriggerItem = {
        // Manual triggers are of type 'Request' with various kinds
        type: 'Request',
        kind: 'Button', // 'Button' is common for basic manual trigger, could be 'PowerApp', 'Http' etc.
        inputs: {
            schema: inputsSchema || { // Default to an empty schema if none provided
                "type": "object",
                "properties": {},
                "required": []
            }
            // Add method: 'POST', relativePath: '/...' etc. if using kind: 'Http'
        }
        // No recurrence needed for manual triggers
        // BaseTriggerOperation properties (metadata, description, etc.) can be added if needed
    };
    return trigger;
} 