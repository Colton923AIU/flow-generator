import { WorkflowTriggerItem, ApiConnectionInputs, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Defines the type of SharePoint list event to trigger on.
 */
export type SharePointTriggerEventType = 'onItemCreated' | 'onItemModified' | 'onItemCreatedOrModified';

/**
 * Creates a SharePoint trigger definition for list item events.
 * 
 * @param siteAddress SharePoint site address (can be an ExpressionString).
 * @param listId SharePoint list GUID (can be an ExpressionString).
 * @param triggerEventType The type of event to trigger on ('onItemCreated', 'onItemModified', 'onItemCreatedOrModified').
 * @param connectionNameLogical The logical name of the SharePoint connection reference (e.g., 'shared_sharepointonline').
 * @param apiId The Resource ID of the SharePoint API connection (e.g., '/providers/Microsoft.PowerApps/apis/shared_sharepointonline').
 * @returns A WorkflowTriggerItem object for the specified SharePoint trigger.
 */
export function createSharePointItemTrigger(
  siteAddress: ExpressionString,
  listId: ExpressionString,
  triggerEventType: SharePointTriggerEventType,
  connectionNameLogical: string,
  apiId: string
): WorkflowTriggerItem {

  const connectionNameExpression: ExpressionString = `@parameters('$connections')['${connectionNameLogical}']['connectionId']`;

  // Determine the correct path based on the trigger type
  let triggerPath: string;
  switch (triggerEventType) {
    case 'onItemCreated':
      triggerPath = `/datasets/@{encodeURIComponent(encodeURIComponent('${siteAddress}'))}/tables/@{encodeURIComponent(encodeURIComponent('${listId}'))}/onnewitems`;
      break;
    case 'onItemModified':
    case 'onItemCreatedOrModified': // Power Automate often uses the same underlying polling for modified/createdOrModified
      triggerPath = `/datasets/@{encodeURIComponent(encodeURIComponent('${siteAddress}'))}/tables/@{encodeURIComponent(encodeURIComponent('${listId}'))}/onupdateditems`;
      break;
    default:
      // Fallback or error? For now, default to onupdateditems
      console.warn(`[createSharePointItemTrigger] Unknown triggerEventType '${triggerEventType}', defaulting to /onupdateditems path.`);
      triggerPath = `/datasets/@{encodeURIComponent(encodeURIComponent('${siteAddress}'))}/tables/@{encodeURIComponent(encodeURIComponent('${listId}'))}/onupdateditems`;
  }

  const inputs: ApiConnectionInputs = {
    host: {
      connection: {
        name: connectionNameExpression
      },
      api: {
        id: apiId
      }
    },
    method: 'GET', // Most SP list triggers are polling GET requests
    path: triggerPath,
    authentication: { 
        type: 'Raw',
        value: "@triggers().outputs?['headers']?['X-MS-APIM-Tokens']"
    }
    // queries: {} // Add queries like $filter or $select if needed based on trigger type
  };

  const trigger: WorkflowTriggerItem = {
    type: 'ApiConnection',
    inputs: inputs,
    splitOn: "@triggerBody()?['value']", // Common for item triggers to process items individually
    recurrence: { // Added default recurrence for polling
        frequency: 'Minute',
        interval: 1
    }
  };

  return trigger;
} 