import { WorkflowActionItem } from '../../../models/workflow-definition.schema';

/**
 * Creates a Compose action definition.
 * Used for setting variables or manipulating data within a flow.
 * @param inputs The value or expression to set (this becomes the action's output).
 * @returns A WorkflowActionItem object for the Compose action.
 */
export function createComposeAction(inputs: any): WorkflowActionItem {

  const action: WorkflowActionItem = {
    type: 'Compose',
    inputs: inputs, // The value itself is the input
    runAfter: {}, // Initialize empty, should be set by FlowGenerator if needed
    // Add metadata, description, etc. as needed
  };

  return action;
} 