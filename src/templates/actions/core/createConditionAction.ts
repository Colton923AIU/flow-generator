import { WorkflowActionItem, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Creates a conditional 'If' action with true and false branches.
 * 
 * @param expression The expression to evaluate (must resolve to a boolean)
 * @param ifTrueActions Actions to perform if the condition is true
 * @param ifFalseActions Actions to perform if the condition is false (optional)
 * @returns A WorkflowActionItem object for the Condition action
 */
export function createConditionAction(
  expression: ExpressionString,
  ifTrueActions: Record<string, WorkflowActionItem>,
  ifFalseActions?: Record<string, WorkflowActionItem>
): WorkflowActionItem {

  const action: WorkflowActionItem = {
    type: 'If',
    expression: expression,
    actions: ifTrueActions || {},
    runAfter: {}, // Initialize empty, should be set by FlowGenerator if needed
  };

  // Add else actions if provided
  if (ifFalseActions) {
    action.else = {
      actions: ifFalseActions
    };
  }

  return action;
} 