import { WorkflowActionItem, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Creates a 'Compose' action definition for generating variables or formatted output.
 * 
 * @param inputs The value to compose (can be a string, object, array, or expression)
 * @returns A WorkflowActionItem object for the Compose action
 */
export function createComposeAction(
  inputs: ExpressionString | any
): WorkflowActionItem {
  
  const action: WorkflowActionItem = {
    type: 'Compose',
    inputs: inputs,
    runAfter: {} // Initialize empty, should be set by FlowGenerator if needed
  };

  return action;
} 