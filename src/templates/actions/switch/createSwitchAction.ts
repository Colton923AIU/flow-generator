import { WorkflowActionItem, ExpressionString, SwitchActionInputs } from '../../../models/workflow-definition.schema';

// Define a type alias for the action map for brevity
type ActionMap = Record<string, WorkflowActionItem>;

/**
 * Creates a Switch action definition.
 * @param expression The expression string to evaluate for the switch (e.g., "@variables('myVar')").
 * @param cases An object where keys are the string/number values to match, and values are ActionMap objects for the actions in that case.
 * @param defaultActions Optional ActionMap object for the default case actions.
 * @returns A WorkflowActionItem object for the Switch action.
 */
export function createSwitchAction(
  expression: ExpressionString,
  cases: Record<string | number, ActionMap>, // Case values are the keys
  defaultActions?: ActionMap
): WorkflowActionItem {

  // Transform the input cases map into the structure expected by the schema
  const schemaCases: SwitchActionInputs['cases'] = {};
  for (const caseValue in cases) {
    if (Object.prototype.hasOwnProperty.call(cases, caseValue)) {
      schemaCases[caseValue] = {
        case: caseValue, // The schema expects the case value here too
        actions: cases[caseValue]
      };
    }
  }

  // Base structure for the 'Switch' action
  const action: Extract<WorkflowActionItem, { type: 'Switch' }> = {
    type: 'Switch',
    expression: expression,
    cases: schemaCases,
    runAfter: {}, // Initialize empty, should be set by FlowGenerator if needed
    // Add metadata, description, etc. as needed
  };

  // Add the 'default' block if provided
  if (defaultActions) {
    action.default = {
      actions: defaultActions
    };
  }

  // Return as the general WorkflowActionItem type
  return action as WorkflowActionItem;
} 