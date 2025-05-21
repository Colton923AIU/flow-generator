import { WorkflowTriggerItem, Recurrence } from '../../models/workflow-definition.schema';

// Define type aliases for schedule components for clarity
type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
type MonthDay = number;

/**
 * Configuration options for recurrence-based schedule triggers
 * Follows the structure of the Recurrence type from the schema.
 */
export interface RecurrenceTriggerOptions {
  frequency: Recurrence['frequency'];
  interval: Recurrence['interval'];
  startTime?: Recurrence['startTime'];
  timeZone?: Recurrence['timeZone'];
  // Schedule properties 
  daysOfWeek?: DayOfWeek[];
  daysOfMonth?: MonthDay[];
  // Add hours?: number[], minutes?: number[], monthlyOccurrences?: Recurrence['schedule']?['monthlyOccurrences'] if needed
}

/**
 * Creates a schedule trigger definition based on recurrence.
 * @param options Configuration options for the recurrence trigger, conforming to RecurrenceTriggerOptions.
 * @returns A WorkflowTriggerItem for scheduled execution.
 */
export function createRecurrenceTrigger(options: RecurrenceTriggerOptions): WorkflowTriggerItem {
  const { 
    frequency, 
    interval, 
    startTime,
    timeZone,
    daysOfWeek,
    daysOfMonth
  } = options;

  // Construct the recurrence object based on the schema
  const recurrence: Recurrence = {
    frequency,
    interval
  };

  // Add optional parameters directly to the recurrence object
  if (startTime) {
    recurrence.startTime = startTime;
  }
  if (timeZone) {
    recurrence.timeZone = timeZone;
  }

  // Build the schedule object if needed
  let schedule: Recurrence['schedule'] = {};
  let hasSchedule = false;
  if (frequency === 'Week' && daysOfWeek && daysOfWeek.length > 0) {
    schedule.weekDays = daysOfWeek;
    hasSchedule = true;
  }
  if (frequency === 'Month' && daysOfMonth && daysOfMonth.length > 0) {
    schedule.monthDays = daysOfMonth;
    hasSchedule = true;
  }
  // Add hours, minutes, monthlyOccurrences to schedule here if needed

  if (hasSchedule) {
    recurrence.schedule = schedule;
  }

  // Construct the final WorkflowTriggerItem
  const trigger: WorkflowTriggerItem = {
    type: 'Recurrence',
    recurrence: recurrence,
    // Inputs are typically not used for Recurrence type triggers
    // Add metadata, description, etc. as needed
  };
  
  return trigger;
}

/**
 * Creates a daily trigger that runs at a specific time.
 * @param hour Hour of the day (0-23).
 * @param minute Minute of the hour (0-59).
 * @param timeZone Time zone (e.g., 'UTC', 'Eastern Standard Time').
 * @returns A WorkflowTriggerItem for daily execution at the specified time.
 */
export function createDailyTrigger(
  hour: number, 
  minute: number, 
  timeZone?: string // Optional timeZone
): WorkflowTriggerItem {
  // Calculate the start time in ISO 8601 format
  const now = new Date();
  // Set time on today's date, then get ISO string
  // Note: This creates a startTime based on the *server* running this code.
  // For consistent time zone behavior regardless of server location,
  // relying solely on timeZone parameter within Power Automate is better.
  // We might remove startTime calculation here if timeZone is always provided.
  const startTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  ).toISOString();

  const options: RecurrenceTriggerOptions = {
    frequency: 'Day',
    interval: 1,
    startTime: startTime, // Pass the calculated start time
  };
  if (timeZone) {
    options.timeZone = timeZone;
  }

  return createRecurrenceTrigger(options);
}

/**
 * Creates a weekly trigger that runs on specific days of the week.
 * @param daysOfWeek Days of the week to run.
 * @param hour Hour of the day (0-23).
 * @param minute Minute of the hour (0-59).
 * @param timeZone Optional time zone.
 * @returns A WorkflowTriggerItem for weekly execution on specified days.
 */
export function createWeeklyTrigger(
  daysOfWeek: DayOfWeek[], // Use the defined type alias
  hour: number,
  minute: number,
  timeZone?: string
): WorkflowTriggerItem {
  const now = new Date();
  const startTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  ).toISOString();

  const options: RecurrenceTriggerOptions = {
    frequency: 'Week',
    interval: 1,
    startTime: startTime,
    daysOfWeek: daysOfWeek
  };
  if (timeZone) {
    options.timeZone = timeZone;
  }

  return createRecurrenceTrigger(options);
}

/**
 * Creates a business days (Monday-Friday) trigger.
 * @param hour Hour of the day (0-23).
 * @param minute Minute of the hour (0-59).
 * @param timeZone Optional time zone.
 * @returns A WorkflowTriggerItem for execution on business days.
 */
export function createBusinessDaysTrigger(
  hour: number,
  minute: number,
  timeZone?: string
): WorkflowTriggerItem {
  return createWeeklyTrigger(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hour,
    minute,
    timeZone
  );
}

/**
 * Creates a monthly trigger that runs on specific days of the month.
 * @param daysOfMonth Days of the month to run.
 * @param hour Hour of the day (0-23).
 * @param minute Minute of the hour (0-59).
 * @param timeZone Optional time zone.
 * @returns A WorkflowTriggerItem for monthly execution on specified days.
 */
export function createMonthlyTrigger(
  daysOfMonth: MonthDay[], // Use the defined type alias
  hour: number,
  minute: number,
  timeZone?: string
): WorkflowTriggerItem {
  const now = new Date();
  const startTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  ).toISOString();

  const options: RecurrenceTriggerOptions = {
    frequency: 'Month',
    interval: 1,
    startTime: startTime,
    daysOfMonth: daysOfMonth
  };
   if (timeZone) {
    options.timeZone = timeZone;
  }

  return createRecurrenceTrigger(options);
} 