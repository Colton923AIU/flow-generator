import { ScheduledTrigger } from '../../../models/flow-types';

/**
 * Creates a scheduled trigger that runs at a specified interval
 * @param frequency The frequency type ('Minute', 'Hour', 'Day', 'Week', 'Month')
 * @param interval The number of frequency units between runs
 * @returns A ScheduledTrigger object
 */
export function createScheduledTrigger(
  frequency: 'Minute' | 'Hour' | 'Day' | 'Week' | 'Month' = 'Day',
  interval: number = 1
): ScheduledTrigger {
  return {
    type: 'Recurrence',
    inputs: {},
    recurrence: {
      frequency,
      interval
    }
  };
} 