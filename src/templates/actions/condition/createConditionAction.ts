import { WorkflowActionItem, ExpressionString } from '../../../models/workflow-definition.schema';

// Define a type alias for the action map for brevity
type ActionMap = Record<string, WorkflowActionItem>;

/**
 * Creates a condition (If) action definition.
 * @param expression The condition expression string (e.g., "@equals(variables('myVar'), 'value')") or an expression object.
 * @param trueActions An object mapping action names to WorkflowActionItem definitions for the 'true' branch.
 * @param falseActions Optional object mapping action names to WorkflowActionItem definitions for the 'false' branch.
 * @returns A WorkflowActionItem object for the If action.
 */
export function createConditionAction(
  expression: ExpressionString | object, // Allow complex expression objects too
  trueActions: ActionMap,
  falseActions?: ActionMap
): WorkflowActionItem {

  // Base structure for the 'If' action
  const action: Extract<WorkflowActionItem, { type: 'If' }> = {
    type: 'If',
    expression: expression,
    actions: trueActions,
    runAfter: {} // Initialize empty, should be set by FlowGenerator if needed
    // Add metadata, description, etc. as needed
  };

  // Add the 'else' block if provided
  if (falseActions) {
    action.else = {
      actions: falseActions
    };
  }

  // Return as the general WorkflowActionItem type
  return action as WorkflowActionItem;
} 