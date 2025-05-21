/**
 * Unified exports for all trigger types
 */

// Export basic triggers from the main triggers module
// export { createManualTrigger } from '../triggers';

// Export SharePoint triggers
export {
  createSharePointItemTrigger
} from './sharepoint';

// Export scheduled triggers
export {
  createScheduledTrigger
} from './scheduled';

// Export manual trigger
export { createManualTrigger } from './manual';

// Export SharePoint trigger options
export {
  SharePointTriggerOptions
} from '../sharepoint/triggers';

// Export schedule triggers
export {
  RecurrenceTriggerOptions,
  createRecurrenceTrigger,
  createDailyTrigger,
  createWeeklyTrigger,
  createBusinessDaysTrigger,
  createMonthlyTrigger
} from '../schedule/triggers';

// Export Outlook triggers
export * from './outlook'; 