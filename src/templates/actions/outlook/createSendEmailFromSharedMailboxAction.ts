import { ExpressionString, WorkflowActionItem } from '../../../models/workflow-definition.schema';

/**
 * Inputs for the SendEmailFromSharedMailbox (V2) action.
 */
export interface SendEmailFromSharedMailboxInputs {
  host: {
    connectionName: ExpressionString;
    apiId: ExpressionString;
    operationId: 'SharedMailboxSendEmailV2';
  };
  parameters: {
    'emailMessage/MailboxAddress': ExpressionString;
    'emailMessage/To': ExpressionString;
    'emailMessage/Subject': ExpressionString;
    'emailMessage/Body': ExpressionString;
    'emailMessage/Importance'?: 'Low' | 'Normal' | 'High';
    'emailMessage/Cc'?: ExpressionString;
    'emailMessage/Bcc'?: ExpressionString;
    // Add attachments later if needed
  };
  authentication?: ExpressionString | object; // Typically "@parameters('$authentication')"
}

/**
 * Creates a 'Send an email from a shared mailbox (V2)' action definition.
 *
 * @param mailboxAddress The email address of the shared mailbox.
 * @param toRecipients The email address(es) of the recipient(s).
 * @param subject The subject of the email.
 * @param body The body of the email (HTML is supported).
 * @param connectionNameLogical The logical name of the Office 365 connection.
 * @param apiId The API ID for Office 365 (usually '/providers/Microsoft.PowerApps/apis/shared_office365').
 * @param importance Optional importance level of the email.
 * @param ccRecipients Optional CC recipients.
 * @param bccRecipients Optional BCC recipients.
 * @param authentication Optional authentication object or expression.
 * @returns A WorkflowActionItem object for the SendEmailFromSharedMailbox action.
 */
export function createSendEmailFromSharedMailboxAction(
  mailboxAddress: ExpressionString,
  toRecipients: ExpressionString,
  subject: ExpressionString,
  body: ExpressionString,
  connectionNameLogical: ExpressionString,
  apiId: ExpressionString = '/providers/Microsoft.PowerApps/apis/shared_office365',
  importance: 'Low' | 'Normal' | 'High' = 'Normal',
  ccRecipients?: ExpressionString,
  bccRecipients?: ExpressionString,
  authentication: ExpressionString | object = "@parameters('$authentication')"
): WorkflowActionItem {
  const inputs: SendEmailFromSharedMailboxInputs = {
    host: {
      connectionName: connectionNameLogical,
      apiId: apiId,
      operationId: 'SharedMailboxSendEmailV2',
    },
    parameters: {
      'emailMessage/MailboxAddress': mailboxAddress,
      'emailMessage/To': toRecipients,
      'emailMessage/Subject': subject,
      'emailMessage/Body': body,
      'emailMessage/Importance': importance,
    },
    authentication: authentication,
  };

  if (ccRecipients) {
    inputs.parameters['emailMessage/Cc'] = ccRecipients;
  }
  if (bccRecipients) {
    inputs.parameters['emailMessage/Bcc'] = bccRecipients;
  }

  return {
    type: 'ApiConnection',
    inputs: inputs,
    runAfter: {}, // Should be set by the FlowGenerator if this action depends on others
  };
} 