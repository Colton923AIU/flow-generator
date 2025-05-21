# Flow Creator

A TypeScript library for programmatically generating Microsoft Power Automate flows with type safety and reusable components.

## Overview

Flow Creator provides a programmatic approach to creating Power Automate flows using TypeScript. It offers several advantages over the traditional GUI approach:

- **Type Safety**: All flow components are strongly typed with TypeScript interfaces
- **Version Control**: Store flow definitions in source control
- **Reusability**: Create templates and components that can be reused across different flows
- **Consistency**: Enforce consistent patterns across your organization's flows
- **Testability**: Test flow logic before deployment

## Project Structure

```
flow-creator/
├── src/
│   ├── config/                # User and environment configuration
│   ├── generators/            # Core flow generation logic
│   ├── models/                # TypeScript interfaces and schemas
│   ├── solutions/             # Solution configurations 
│   ├── templates/             # Reusable flow components and templates
│   │   ├── actions/           # Common actions (email, compose, conditions)
│   │   ├── triggers/          # Trigger definitions for various sources
│   │   └── common/            # Common helper functions
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── dist/                      # Compiled JavaScript output
└── output/                    # Generated flow files (JSON)
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create your user config: Copy `src/config/user-config.template.ts` to `src/config/user-config.ts` and update with your values
4. Try generating solutions:
    ```
    npm run generate:basic
    ```
    or
    ```
    npm run generate:sp-notifier
    ```
5. Build the project: `npm run build`

## Usage

Create a new flow by instantiating the `FlowGenerator` class and adding triggers and actions:

```typescript
import { FlowGenerator } from './generators/flow-generator';
import { createBusinessDaysTrigger } from './templates/triggers/schedule/createBusinessDaysTrigger';
import { createComposeAction } from './templates/actions/core/createComposeAction';
import { createSendEmailAction } from './templates/actions/outlook/createSendEmailAction';
import { config } from './config/user-config';

// Create a new flow
const scheduledFlow = new FlowGenerator(
  'Daily Business Hours Check',
  'A flow that runs every business day at 9:00 AM'
);

// Add a trigger that runs every weekday at 9:00 AM in the Eastern time zone
scheduledFlow.addTrigger(
  'businessDaysTrigger', 
  createBusinessDaysTrigger(9, 0, 'Eastern Standard Time')
);

// Add a compose action to create a timestamp
scheduledFlow.addAction(
  'createTimestamp',
  createComposeAction('@formatDateTime(utcNow(), \'yyyy-MM-dd HH:mm:ss\')')
);

// Add a notification action
scheduledFlow.addAction(
  'sendDailyNotification',
  createSendEmailAction(
    config.utils.getEnvironmentEmails(config.user.distributionLists.workflowNotifications),
    'Daily Business Check',
    `<p>This is the daily business check notification.</p>
    <p>Current timestamp: @{body('createTimestamp')}</p>
    <p>All systems are operational.</p>`,
    config.connections.outlook
  )
);
```

## Configuration

The library uses a unified configuration system defined in `src/config/user-config.ts`. This file exports a single `config` object containing all settings organized by category:

```typescript
import { config } from './config/user-config';

// Access user information
const adminEmail = config.user.adminEmail;

// Access SharePoint site details
const siteUrl = config.sharePoint.rorEvaluation.siteUrl;

// Access environment settings
const isDev = config.environment.mode === 'dev';

// Use utility functions
const notificationEmails = config.utils.getEnvironmentEmails(
  config.user.distributionLists.workflowNotifications
);
```

The configuration contains:

- `config.user`: User-specific settings (email addresses, team members)
- `config.sharePoint`: SharePoint site details and list mappings
- `config.connections`: Power Automate connection IDs
- `config.publisher`: Publisher information for solution packaging
- `config.environment`: Environment-specific settings
- `config.utils`: Helper functions

Create a copy of `src/config/user-config.template.ts` as `src/config/user-config.ts` and update it with your own settings.

## Trigger Types

The library provides several types of triggers organized by category:

### SharePoint Triggers

```typescript
import { createSharePointItemCreatedTrigger } from './templates/triggers/sharepoint/createSharePointItemCreatedTrigger';
import { config } from './config/user-config';

// Trigger when a new item is created in a SharePoint list
flow.addTrigger(
  'newItemTrigger',
  createSharePointItemCreatedTrigger({
    siteUrl: config.sharePoint.rorEvaluation.siteUrl,
    listId: config.sharePoint.rorEvaluation.listId,
    pollingInterval: 5 // Check every 5 minutes
  })
);
```

Available SharePoint triggers:
- `createSharePointItemCreatedTrigger`: Fires when a new item is created
- `createSharePointItemModifiedTrigger`: Fires when an item is modified
- `createSharePointColumnChangedTrigger`: Fires when a specific column changes
- `createSharePointItemDeletedTrigger`: Fires when an item is deleted

### Schedule Triggers

```typescript
import { createBusinessDaysTrigger } from './templates/triggers/schedule/createBusinessDaysTrigger';

// Trigger every weekday at 9:00 AM
flow.addTrigger(
  'businessDaysTrigger',
  createBusinessDaysTrigger(9, 0, 'Eastern Standard Time')
);
```

Available schedule triggers:
- `createDailyTrigger`: Runs once per day at a specific time
- `createWeeklyTrigger`: Runs on specific days of the week
- `createBusinessDaysTrigger`: Runs on weekdays (Monday-Friday)
- `createMonthlyTrigger`: Runs on specific days of the month
- `createRecurrenceTrigger`: Advanced customization of recurrence patterns

### Other Triggers

```typescript
import { createManualTrigger } from './templates/triggers/manual/createManualTrigger';

// Manual trigger with a schema
flow.addTrigger(
  'manualTrigger',
  createManualTrigger({
    type: 'object',
    properties: {
      requestType: { type: 'string' },
      requestDetails: { type: 'string' },
      priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
      requesterEmail: { type: 'string' }
    },
    required: ['requestType', 'requestDetails', 'requesterEmail']
  })
);
```

## Actions

The library provides various actions to build your flows:

```typescript
import { createConditionAction } from './templates/actions/core/createConditionAction';
import { createSendEmailAction } from './templates/actions/outlook/createSendEmailAction';
import { config } from './config/user-config';

// Add a condition based on a field value
flow.addAction(
  'checkHighPriority',
  createConditionAction(
    "@equals(triggerBody()?['Priority'], 'High')",
    {
      // Actions for true condition
      'sendUrgentNotification': createSendEmailAction(
        config.user.adminEmail,
        'URGENT: New High Priority Item',
        `<p><strong>High Priority Item Created</strong></p>
        <p>Please review immediately.</p>`,
        config.connections.outlook
      )
    },
    {
      // Actions for false condition
      'sendRegularNotification': createSendEmailAction(
        config.user.adminEmail,
        'New Item Created',
        `<p>A new item has been created in the list.</p>`,
        config.connections.outlook
      )
    }
  )
);
```

Available actions include:
- `createSendEmailAction`: Send an email notification
- `createComposeAction`: Create a variable or format data
- `createConditionAction`: Create a conditional branch
- And many more in the templates directory

## Dependencies

The project uses the following key dependencies:
- TypeScript for type-safe code
- zod for runtime validation
- uuid for generating unique identifiers
- archiver for packaging flows

## License

MIT 

## Available Solutions

Flow Creator comes with several sample solutions to help you get started:

### SharePoint Approval Flow
A basic document approval workflow that triggers when documents are uploaded to a SharePoint library, routes approval requests to designated approvers, and processes documents differently based on file type.

### SharePoint Approval Advanced
An enhanced version of the approval flow with additional features like department-based routing, multiple approval levels, rich metadata handling, and conditional processing.

### PIP Notification Flow
A robust status notification system that sends configurable emails when a SharePoint list item's status changes. Features include:
- Multiple recipient targeting for the same status change
- Template-based email content with dynamic placeholder substitution
- Email configurations stored in SharePoint for easy management
- Detailed activity logging and error handling

Generate solutions with:
```bash
npm run generate
# or with custom parameters
npm run generate -- --example pip-notification-flow --statusFieldName "Status" --listId "your-list-id"
```

## Connection Configuration

Connection IDs for SharePoint, Outlook, and other services are configured in `src/config/user-config.ts`:

```typescript
// in user-config.ts
connections: {
  sharePoint: 'shared_sharepointonline',
  outlook: 'shared_office365'
}
```

The library is built with resilience in mind and provides fallback defaults for connections if they are not properly configured. 