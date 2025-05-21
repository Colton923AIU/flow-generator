import { WorkflowActionItem, ApiConnectionInputs, ExpressionString } from '../../../models/workflow-definition.schema';

/**
 * Creates a SharePoint 'Get items' action definition for querying SharePoint list items.
 * @param siteAddress SharePoint site address (can be an ExpressionString).
 * @param listId SharePoint list GUID (can be an ExpressionString).
 * @param queryOptions An object with $select, $filter, $top, $orderby options.
 * @param connectionNameLogical The logical name of the SharePoint connection reference (e.g., 'shared_sharepointonline').
 * @param apiId The Resource ID of the SharePoint API connection (e.g., '/providers/Microsoft.PowerApps/apis/shared_sharepointonline').
 * @returns A WorkflowActionItem object for the SharePoint Get Items action.
 */
export function createSharePointGetItemsAction(
  siteAddress: ExpressionString,
  listId: ExpressionString,
  queryOptions: {
    $select?: string,
    $filter?: string,
    $top?: number,
    $orderby?: string
  },
  connectionNameLogical: string,
  apiId: string
): WorkflowActionItem {

  const connectionNameExpression: ExpressionString = `@parameters('$connections')['${connectionNameLogical}']['connectionId']`;

  // The specific inputs structure for SharePoint GetItems
  const inputs: ApiConnectionInputs = {
    host: {
      connection: {
        name: connectionNameExpression
      },
      api: {
        id: apiId
      }
    },
    method: 'GET', // Method for GetItems is GET
    path: `/datasets/@{encodeURIComponent(encodeURIComponent('${siteAddress}'))}/tables/@{encodeURIComponent(encodeURIComponent('${listId}'))}/items`, // Standard path construction
    queries: queryOptions, // Query parameters
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