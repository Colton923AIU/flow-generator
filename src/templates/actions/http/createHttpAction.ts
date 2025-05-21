import { WorkflowActionItem, HttpInputs, ExpressionString, HttpHeaders, HttpAuthentication } from '../../../models/workflow-definition.schema';

/**
 * Creates an HTTP action definition.
 * @param method HTTP method (e.g., 'GET', 'POST'). Must be uppercase.
 * @param uri URI to call (can be an ExpressionString).
 * @param headers Optional HTTP headers.
 * @param body Optional request body.
 * @param authentication Optional authentication object.
 * @returns A WorkflowActionItem object for the HTTP action.
 */
export function createHttpAction(
  method: HttpInputs['method'], // Use the specific method type
  uri: ExpressionString,
  headers?: HttpHeaders,
  body?: any,
  authentication?: HttpAuthentication | ExpressionString
): WorkflowActionItem {

  const inputs: HttpInputs = {
      method,
      uri,
      // Only include headers, body, authentication if they are provided
      ...(headers && { headers }),
      ...(body && { body }),
      ...(authentication && { authentication }),
      // retryPolicy, cookie, schema, relativePath could be added as params if needed
  };

  const action: WorkflowActionItem = {
    type: 'Http',
    inputs: inputs,
    runAfter: {}, // Initialize empty, should be set by FlowGenerator if needed
    // kind, metadata, description, etc., can be added
  };

  return action;
} 