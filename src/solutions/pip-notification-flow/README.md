# PIP Status Notification Flow

This solution implements a robust notification system that automatically sends emails when a SharePoint list item's status is changed. It supports configurable email templates and sending multiple notifications to different recipients for a single status change.

## Overview

The Status Notification Flow monitors changes to item statuses in a SharePoint list and sends multiple notifications using email configuration templates stored in a mapping list. When a status changes, the flow:

1. Detects the status field change
2. Looks up the appropriate email configurations in a mapping list
3. Processes each email configuration, replacing placeholders with actual values
4. Sends multiple emails as defined in the configuration array
5. Logs the notification activity for audit purposes

## Business Problem Solved

This workflow solves several key challenges:

- **Minimal List Structure**: Requires only status and title fields in the main list
- **Multiple Stakeholder Notifications**: Send different email content to different recipients for the same status change
- **Complete Email Control**: Store entire email configurations in SharePoint
- **Permissions Management**: Administrators can manage notification settings without requiring access to the flow itself
- **Template Management**: Notifications can be updated without IT intervention

## SharePoint List Structure

### Main List (Simplified)
- **Title** - Student ID or other primary identifier
- **Status** - Status field (with name specified in configuration)

### Notification Mapping List
- **StatusValue** - Value that exactly matches status values in the main list
- **EmailConfiguration** - Multi-line text field containing a JSON array of email configurations

### Sample EmailConfiguration JSON (Multiple Emails)

```json
[{
  "type": "OpenApiConnection",
  "inputs": {
    "parameters": {
      "request/to": "advisor@university.edu",
      "request/subject": "Action Needed - Status Change for [[STUDENTID]]",
      "request/text": "<p>The status for student ID [[STUDENTID]] has been changed to [[STATUS]]. Please follow up as needed.</p>",
      "request/cc": "department@university.edu",
      "request/bcc": "records@university.edu"
    },
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sendmail",
      "connection": "shared_sendmail",
      "operationId": "SendEmailV3"
    }
  }
},{
  "type": "OpenApiConnection",
  "inputs": {
    "parameters": {
      "request/to": "student-services@university.edu",
      "request/subject": "Records Update - [[STUDENTID]] Status Change",
      "request/text": "<p>This is a notification that student [[STUDENTID]] has had their status changed to [[STATUS]].</p>",
      "request/cc": "",
      "request/bcc": "records@university.edu"
    },
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sendmail",
      "connection": "shared_sendmail",
      "operationId": "SendEmailV3"
    }
  }
}]
```

### Activity Log List
This list is automatically created with "_ActivityLog" appended to the main list ID.

## Configuration Options

The solution can be customized through dynamic inputs:

- `listUrl` - URL of the main SharePoint list
- `listId` - ID of the main SharePoint list
- `notificationMappingListUrl` - URL of the notification mapping list
- `notificationMappingListId` - ID of the notification mapping list
- `statusFieldName` - Name of the field to monitor for changes (default: "Status")

## Connections Configuration

The flow uses the following connections:
- `sharePoint`: Used for list operations (default: "shared_sharepointonline")
- `outlook`: Used for sending emails (default: "shared_office365")

These connections are provided with fallback values to ensure the flow works even if the connections information is not properly configured in the user-config.ts file.

## Usage

Generate the solution with:

```bash
npm run generate
```

With custom configuration:

```bash
npm run generate -- --example pip-notification-flow --statusFieldName "StudentStatus" --listUrl "https://your-tenant.sharepoint.com/sites/StudentServices" --listId "your-list-id" --notificationMappingListId "your-mapping-list-id"
```

## Template Variables

The flow automatically replaces these placeholders in email templates:

- `[[STUDENTID]]` - The Title field from the main list
- `[[STATUS]]` - The new status value

## Handling Single vs Multiple Emails

The flow is smart enough to handle both single email configurations and arrays:

- If the EmailConfiguration field contains an array (starts with `[`), it processes each email in the array
- If it contains a single email configuration object, it wraps it in an array and processes it
- If no configuration is found for a status, it uses a default email template

## Error Handling

The solution includes robust error handling:
- Safely accesses configuration properties with optional chaining
- Provides default values for all required configuration settings
- Gracefully handles missing or malformed email configurations
- Logs detailed information when errors occur

## Security Considerations

- The mapping list should have appropriate permissions to restrict who can manage notification templates
- Consider using security groups rather than individual emails in the templates
- Only authorized users should have access to modify the EmailConfiguration JSON
- Ensure valid JSON formatting in the EmailConfiguration field 

## Compatibility Considerations

Power Automate has some limitations in its expression language compared to JavaScript/TypeScript:

- **Nullish Coalescing Operator (`??`)**: This operator is not supported in Power Automate expressions. Instead, we use the `if(equals(value, null), defaultValue, value)` pattern.

- **Template Placeholders**: Avoid using curly braces `{}` in template placeholders as they conflict with Power Automate expression syntax. We use double square brackets instead (e.g., `[[STUDENTID]]` instead of `{StudentId}`).

For more details on compatibility issues and best practices, see the [Compatibility Guidelines](../../docs/COMPATIBILITY.md).