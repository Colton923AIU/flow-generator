import { WorkflowTriggerItem, ApiConnectionInputs, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Creates an Outlook 'When a new email arrives' trigger definition.
 * @param folderPath The path to the folder to monitor (e.g., 'Inbox', 'Inbox/Subfolder'). Defaults to 'Inbox'.
 * @param connectionNameLogical The logical name of the O365 connection reference (e.g., 'shared_office365').
 * @param apiId The Resource ID of the O365 API connection (e.g., '/providers/Microsoft.PowerApps/apis/shared_office365').
 * @returns A WorkflowTriggerItem object for the Outlook email trigger.
 */
export function createOutlookEmailTrigger(
  connectionNameLogical: string,
  apiId: string,
  folderPath: ExpressionString = 'Inbox'
): WorkflowTriggerItem {

  const connectionNameExpression: ExpressionString = `@parameters('$connections')['${connectionNameLogical}']['connectionId']`;

  // The specific inputs structure for Outlook 'OnNewEmail' trigger
  const inputs: ApiConnectionInputs = {
    host: {
      connection: {
        name: connectionNameExpression
      },
      api: {
        id: apiId
      }
    },
    method: 'GET', // Common method for OnNewEmail polling trigger
    path: `/MailFolders/@{encodeURIComponent(encodeURIComponent('${folderPath}'))}/onnewemail`, // Standard path construction
    // Body/Auth usually not needed for GET trigger
    // Queries might include things like $filter, $top depending on operation
    authentication: { // Might be needed
        type: 'Raw',
        value: "@triggers().outputs?['headers']?['X-MS-APIM-Tokens']"
    }
  };

  const trigger: WorkflowTriggerItem = {
    type: 'ApiConnection',
    inputs: inputs,
    // recurrence: { ... } // Add recurrence if needed
    // splitOn: "@triggerBody()?['value']" // Common for email triggers
  };

  return trigger;
} 