import { WorkflowActionItem, ApiConnectionInputs, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Creates an action definition for sending an email using the Office 365 Outlook connector.
 * @param subject The email subject.
 * @param body The email body (HTML).
 * @param toRecipients Semicolon-separated list of recipient email addresses.
 * @param connectionNameLogical The logical name of the O365 connection reference (e.g., 'shared_office365').
 * @param apiId The Resource ID of the O365 API connection (e.g., '/providers/Microsoft.PowerApps/apis/shared_office365').
 * @returns A WorkflowActionItem object for the Send Email action.
 */
export function createSendEmailAction(
  subject: ExpressionString,
  body: ExpressionString,
  toRecipients: ExpressionString,
  connectionNameLogical: string,
  apiId: string
): WorkflowActionItem {

  // Construct the connection name expression expected by the runtime
  const connectionNameExpression: ExpressionString = `@parameters('$connections')['${connectionNameLogical}']['connectionId']`;

  const inputs: ApiConnectionInputs = {
    host: {
      connection: {
        name: connectionNameExpression
      },
      api: {
        id: apiId // Provided API ID
        // name/type are optional in schema, can be added if needed
      }
    },
    method: 'POST', // Method for SendEmail_V2 (Must be uppercase)
    path: '/v2/Mail', // Path for SendEmail_V2
    body: {
      "To": toRecipients,
      "Subject": subject,
      "Body": body,
      // "Importance": "Normal" // Optional parameters can be added
    },
    authentication: { // Include authentication structure
      type: 'Raw', 
      value: "@triggers().outputs?['headers']?['X-MS-APIM-Tokens']" // Common pattern for auth
    },
    // queries: {}, // No specific queries needed for this action typically
    // headers: {}, // No specific headers needed typically
    // retryPolicy: { type: 'None' } // Optional retry policy
  };

  const action: WorkflowActionItem = {
    type: 'ApiConnection',
    inputs: inputs,
    runAfter: {}, // Initialize empty, should be set by FlowGenerator if needed
    metadata: { // Example metadata
      operationMetadataId: 'SOME_GUID' // Replace with actual or remove if not needed
    }
    // kind, description, operationOptions, trackedProperties, runtimeConfiguration can be added
  };

  return action;
} 