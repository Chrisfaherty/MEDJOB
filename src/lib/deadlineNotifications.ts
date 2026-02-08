/**
 * Deadline Notification System for MedMatch-IE
 * Monitors job application deadlines and sends notifications
 */

import { differenceInHours, format } from 'date-fns';
import type { Job } from '@/types/database.types';

export interface DeadlineAlert {
  job: Job;
  urgency: 'critical' | 'warning' | 'normal';
  hoursRemaining: number;
  message: string;
}

/**
 * Get urgency level based on hours remaining
 */
export function getDeadlineUrgency(hoursRemaining: number): 'critical' | 'warning' | 'normal' {
  if (hoursRemaining <= 48) return 'critical'; // 2 days
  if (hoursRemaining <= 168) return 'warning'; // 7 days
  return 'normal';
}

/**
 * Get formatted message for deadline
 */
export function getDeadlineMessage(job: Job, hoursRemaining: number): string {
  if (hoursRemaining <= 2) {
    return `⚠️ URGENT: ${job.title} closes in ${Math.floor(hoursRemaining)} hours!`;
  } else if (hoursRemaining <= 24) {
    return `⏰ Last day to apply: ${job.title} closes tomorrow`;
  } else if (hoursRemaining <= 48) {
    return `📅 2 days left: ${job.title} deadline approaching`;
  } else if (hoursRemaining <= 168) {
    const daysLeft = Math.ceil(hoursRemaining / 24);
    return `⏳ ${daysLeft} days remaining: ${job.title}`;
  }
  return `Application open: ${job.title}`;
}

/**
 * Check jobs for upcoming deadlines
 */
export function checkDeadlines(jobs: Job[], reminderHours: number[] = [48, 24, 2]): DeadlineAlert[] {
  const now = new Date();
  const alerts: DeadlineAlert[] = [];

  jobs.forEach((job) => {
    const deadline = new Date(job.application_deadline);
    const hoursRemaining = differenceInHours(deadline, now);

    // Only include jobs with deadlines in the future
    if (hoursRemaining <= 0) return;

    // Check if we should send a reminder
    const shouldAlert = reminderHours.some((hours) => {
      // Alert if we're within the reminder window (±1 hour tolerance)
      return Math.abs(hoursRemaining - hours) <= 1;
    });

    if (shouldAlert || hoursRemaining <= 48) {
      alerts.push({
        job,
        urgency: getDeadlineUrgency(hoursRemaining),
        hoursRemaining,
        message: getDeadlineMessage(job, hoursRemaining),
      });
    }
  });

  // Sort by urgency (critical first, then by hours remaining)
  return alerts.sort((a, b) => {
    const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
    if (a.urgency !== b.urgency) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.hoursRemaining - b.hoursRemaining;
  });
}

/**
 * Send browser notification (requires permission)
 */
export async function sendBrowserNotification(alert: DeadlineAlert): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notification = new Notification('MedMatch-IE: Application Deadline', {
    body: alert.message,
    icon: '/icon.png',
    badge: '/badge.png',
    tag: alert.job.id, // Prevents duplicate notifications for same job
    requireInteraction: alert.urgency === 'critical',
    data: {
      jobId: alert.job.id,
      url: alert.job.application_url,
    },
  });

  notification.onclick = function () {
    window.focus();
    if (alert.job.application_url) {
      window.open(alert.job.application_url, '_blank');
    }
    notification.close();
  };

  return true;
}

/**
 * Send email notification (via API route)
 */
export async function sendEmailNotification(
  userEmail: string,
  alerts: DeadlineAlert[]
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        alerts: alerts.map((alert) => ({
          jobId: alert.job.id,
          jobTitle: alert.job.title,
          hospital: alert.job.hospital_name,
          deadline: alert.job.application_deadline,
          urgency: alert.urgency,
          applicationUrl: alert.job.application_url,
        })),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Schedule recurring deadline checks
 * Should be called when user logs in
 */
export function scheduleDeadlineChecks(
  jobs: Job[],
  userEmail: string,
  intervalMinutes: number = 60
): NodeJS.Timeout {
  const checkAndNotify = async () => {
    const alerts = checkDeadlines(jobs);

    if (alerts.length > 0) {
      console.log(`Found ${alerts.length} deadline alerts`);

      // Send browser notifications for critical deadlines
      for (const alert of alerts.filter((a) => a.urgency === 'critical')) {
        await sendBrowserNotification(alert);
      }

      // Send daily email digest if there are warnings
      const warningAlerts = alerts.filter((a) => a.urgency !== 'normal');
      if (warningAlerts.length > 0) {
        await sendEmailNotification(userEmail, warningAlerts);
      }
    }
  };

  // Run immediately
  checkAndNotify();

  // Schedule recurring checks
  return setInterval(checkAndNotify, intervalMinutes * 60 * 1000);
}

/**
 * Get summary statistics of upcoming deadlines
 */
export function getDeadlineStats(jobs: Job[]): {
  total: number;
  critical: number; // < 48 hours
  warning: number; // 2-7 days
  normal: number; // > 7 days
} {
  const now = new Date();
  const stats = {
    total: 0,
    critical: 0,
    warning: 0,
    normal: 0,
  };

  jobs.forEach((job) => {
    const hoursRemaining = differenceInHours(new Date(job.application_deadline), now);

    if (hoursRemaining <= 0) return; // Skip passed deadlines

    stats.total++;
    const urgency = getDeadlineUrgency(hoursRemaining);
    stats[urgency]++;
  });

  return stats;
}

/**
 * Example usage in a component:
 *
 * useEffect(() => {
 *   const alerts = checkDeadlines(jobs);
 *   if (alerts.length > 0) {
 *     // Show notification UI
 *     setNotifications(alerts);
 *   }
 * }, [jobs]);
 */
