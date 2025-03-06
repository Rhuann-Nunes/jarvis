import { Task } from '@/types';
import { format, addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';
import { LOCAL_STORAGE_KEYS, getLocalStorageItem, setLocalStorageItem } from './utils';

/**
 * Requests notification permission
 * @returns Promise resolving to the permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    setLocalStorageItem(LOCAL_STORAGE_KEYS.NOTIFICATION_PERMISSION, permission);
    return permission;
  }
  
  // Guarda a preferência atual
  setLocalStorageItem(LOCAL_STORAGE_KEYS.NOTIFICATION_PERMISSION, Notification.permission);
  return Notification.permission;
}

/**
 * Verifica se as notificações estão habilitadas
 * @returns boolean indicando se as notificações estão habilitadas
 */
export function areNotificationsEnabled(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  
  return Notification.permission === 'granted';
}

/**
 * Sends a notification for a task
 * @param task The task to send a notification for
 */
export function sendTaskNotification(task: Task): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const title = `JARVIS Reminder: ${task.title}`;
  const options = {
    body: task.description || 'Task due now',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: `task-${task.id}`,
    data: { taskId: task.id }
  };
  
  new Notification(title, options);
}

/**
 * Schedules a notification for a task
 * @param task The task to schedule a notification for
 */
export function scheduleTaskNotification(task: Task): void {
  if (!task.dueDate) return;
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  // If due date is in the past, don't schedule
  if (isBefore(dueDate, now)) return;
  
  // Calculate time until due date in milliseconds
  const timeUntilDue = dueDate.getTime() - now.getTime();
  
  // Schedule notification
  setTimeout(() => {
    sendTaskNotification(task);
  }, timeUntilDue);
}

/**
 * Calculates the next occurrence of a recurring task
 * @param task The recurring task
 * @param fromDate The date to calculate from (defaults to now)
 * @returns The date of the next occurrence or undefined if not recurring
 */
export function getNextOccurrence(task: Task, fromDate: Date = new Date()): Date | undefined {
  if (!task.recurrence) return undefined;
  
  // Start from the due date or current date if no due date
  const startDate = task.dueDate ? new Date(task.dueDate) : new Date(fromDate);
  
  // Handle string recurrence (old format)
  if (typeof task.recurrence === 'string') {
    return addDays(startDate, 1);
  }
  
  // Handle object recurrence (new format)
  const { type, interval, daysOfWeek } = task.recurrence;
  let nextDate: Date;
  
  switch (type) {
    case 'daily':
      nextDate = addDays(startDate, interval);
      break;
    case 'weekly':
      nextDate = addWeeks(startDate, interval);
      // If specific days of week are specified, adjust to the next matching day
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Implementation for specific days of week would go here
        // This is a simplified version
        nextDate = addDays(nextDate, 1); // Placeholder
      }
      break;
    case 'monthly':
      nextDate = addMonths(startDate, interval);
      break;
    case 'yearly':
      nextDate = addYears(startDate, interval);
      break;
    default:
      return undefined;
  }
  
  return nextDate;
}

/**
 * Formats a date for display
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return 'No due date';
  return format(date, 'PPP'); // e.g., "April 29th, 2023"
}

/**
 * Formats a time for display
 * @param date The date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | undefined): string {
  if (!date) return '';
  return format(date, 'p'); // e.g., "12:00 AM"
} 