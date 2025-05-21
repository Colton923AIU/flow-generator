/**
 * Configuration for the Status Notification Flow
 * 
 * This file contains all configurable parameters for the status notification flow.
 * Edit this file to customize the behavior of the flow without modifying the core logic.
 */
import { userConfig, sharePointListMap } from '../../config/user-config';

/**
 * Email template placeholders that will be replaced in the notification emails
 */
export const EMAIL_PLACEHOLDERS = {
  STUDENT_ID: '[[STUDENTID]]',
  STATUS: '[[STATUS]]'
};

/**
 * Default email configuration used when no mapping is found for a status
 */
export const DEFAULT_EMAIL_CONFIG = {
  subject: `Status Change Notification: ${EMAIL_PLACEHOLDERS.STUDENT_ID}`,
  body: `<p>The status for student ID ${EMAIL_PLACEHOLDERS.STUDENT_ID} has changed to ${EMAIL_PLACEHOLDERS.STATUS}.</p><p>Please review and take appropriate action.</p>`,
  cc: '',
  bcc: ''
};

/**
 * SharePoint list and field configuration
 */
export const SHAREPOINT_CONFIG = {
  /** The default name of the status field to monitor */
  defaultStatusFieldName: 'Status',
  
  /** Suffix to append to the main list ID for the activity log list */
  activityLogSuffix: '_ActivityLog',
  
  /** Fields for activity log entries */
  activityLog: {
    titleField: 'Status Notification Sent',
    activityType: 'StatusChange',
    descriptionTemplate: `Status changed from {previousStatus} to {currentStatus}. Sent {emailCount} notification(s).`
  },

  /** Default SharePoint list IDs from user config */
  lists: {
    mainList: sharePointListMap['FlowTestData'] || '',
    notificationMappingList: sharePointListMap['FlowTest'] || ''
  },

  /** Default SharePoint site URL */
  siteUrl: 'https://livecareered.sharepoint.com/sites/DEV-TestingTeamsApps'
};

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  /** Default provider for email sending */
  provider: {
    apiId: '/providers/Microsoft.PowerApps/apis/shared_sendmail',
    connection: 'shared_sendmail',
    operationId: 'SendEmailV3'
  },
  
  /** Flag to auto-create default email template if none is found */
  useDefaultEmailIfNoMappingFound: true,
  
  /** Email parameter fields */
  parameters: {
    to: 'request/to',
    subject: 'request/subject',
    body: 'request/text',
    cc: 'request/cc',
    bcc: 'request/bcc'
  }
};

/**
 * Generate the default email JSON configuration
 * @param defaultCcEmail The default CC email to use
 * @returns A JSON string with the default email configuration
 */
export function generateDefaultEmailConfig(defaultCcEmail: string): string {
  return JSON.stringify({
    type: 'OpenApiConnection',
    inputs: {
      parameters: {
        [EMAIL_CONFIG.parameters.to]: defaultCcEmail,
        [EMAIL_CONFIG.parameters.subject]: DEFAULT_EMAIL_CONFIG.subject,
        [EMAIL_CONFIG.parameters.body]: DEFAULT_EMAIL_CONFIG.body,
        [EMAIL_CONFIG.parameters.cc]: DEFAULT_EMAIL_CONFIG.cc,
        [EMAIL_CONFIG.parameters.bcc]: DEFAULT_EMAIL_CONFIG.bcc
      },
      host: {
        apiId: EMAIL_CONFIG.provider.apiId,
        connection: EMAIL_CONFIG.provider.connection,
        operationId: EMAIL_CONFIG.provider.operationId
      }
    }
  });
} 