import { WorkflowActionItem, ApiConnectionInputs, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Creates a SharePoint 'Create item' action definition.
 * @param siteAddress SharePoint site address (can be an ExpressionString).
 * @param listId SharePoint list GUID (can be an ExpressionString).
 * @param itemData An object representing the list item data to create. Keys are column names, values are the data (can be ExpressionStrings).
 * @param connectionNameLogical The logical name of the SharePoint connection reference (e.g., 'shared_sharepointonline').
 * @param apiId The Resource ID of the SharePoint API connection (e.g., '/providers/Microsoft.PowerApps/apis/shared_sharepointonline').
 * @returns A WorkflowActionItem object for the SharePoint Create Item action.
 */
export function createSharePointCreateItemAction(
  siteAddress: ExpressionString,
  listId: ExpressionString,
  itemData: Record<string, any>,
  connectionNameLogical: string,
  apiId: string
): WorkflowActionItem {

  const connectionNameExpression: ExpressionString = `@parameters('$connections')['${connectionNameLogical}']['connectionId']`;

  // The specific inputs structure for SharePoint CreateItem
  const inputs: ApiConnectionInputs = {
    host: {
      connection: {
        name: connectionNameExpression
      },
      api: {
        id: apiId
      }
    },
    method: 'POST', // Common method for CreateItem (Must be uppercase)
    path: `/datasets/@{encodeURIComponent(encodeURIComponent('${siteAddress}'))}/tables/@{encodeURIComponent(encodeURIComponent('${listId}'))}/items`, // Standard path construction
    body: itemData, // The item data goes directly into the body
    authentication: { // Include standard authentication
        type: 'Raw',
        value: "@triggers().outputs?['headers']?['X-MS-APIM-Tokens']"
    }
  };

  const action: WorkflowActionItem = {
    type: 'ApiConnection',
    inputs: inputs,
    runAfter: {}, // Initialize empty, should be set by FlowGenerator if needed
    metadata: { // Example metadata - adjust as needed
        operationMetadataId: 'SOME_GUID' // Placeholder GUID
    }
  };

  return action;
} 