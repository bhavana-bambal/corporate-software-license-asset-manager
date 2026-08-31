const db = require('../config/db');
const { generateId, getDaysRemaining } = require('../utils/helpers');

const alertEngine = {
  /**
   * Scan all licenses and automatically generate notifications for thresholds
   */
  async syncAlerts() {
    const licenses = await db.read('licenses');
    const existingNotifications = await db.read('notifications');
    const settings = (await db.read('settings')) || {};
    const thresholds = settings.alertThresholds || {
      criticalDays: 7,
      urgentDays: 30,
      warningDays: 90,
      highUtilizationPercent: 80,
      criticalUtilizationPercent: 90
    };

    const newAlerts = [];

    for (const lic of licenses) {
      const days = getDaysRemaining(lic.expirationDate);
      const total = Number(lic.totalSeats) || 0;
      const allocated = Number(lic.allocatedSeats) || 0;
      const utilPercent = total > 0 ? Math.round((allocated / total) * 100) : 0;

      // 1. Expiration Checks
      if (days !== null) {
        if (days < 0) {
          const type = `EXPIRATION_EXPIRED_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'CRITICAL',
              title: `License Expired: ${lic.softwareName}`,
              message: `License "${lic.softwareName}" (${lic.licenseId}) expired on ${lic.expirationDate} (${Math.abs(days)} days ago). Immediate review required.`,
              relatedId: lic.licenseId,
              module: 'LICENSES',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (days <= thresholds.criticalDays) {
          const type = `EXPIRATION_7D_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'CRITICAL',
              title: `Critical: ${lic.softwareName} expires in ${days} days!`,
              message: `License "${lic.softwareName}" (${lic.licenseId}) will expire on ${lic.expirationDate}. Action required within ${days} days.`,
              relatedId: lic.licenseId,
              module: 'LICENSES',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (days <= thresholds.urgentDays) {
          const type = `EXPIRATION_30D_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'WARNING',
              title: `Urgent: ${lic.softwareName} expires in ${days} days`,
              message: `License "${lic.softwareName}" (${lic.licenseId}) expires on ${lic.expirationDate}. Prepare renewal quotation.`,
              relatedId: lic.licenseId,
              module: 'LICENSES',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (days <= thresholds.warningDays) {
          const type = `EXPIRATION_90D_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'INFO',
              title: `Upcoming Expiration: ${lic.softwareName} in ${days} days`,
              message: `License "${lic.softwareName}" (${lic.licenseId}) expires on ${lic.expirationDate}.`,
              relatedId: lic.licenseId,
              module: 'LICENSES',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // 2. Seat Utilization Checks
      if (total > 0) {
        if (allocated >= total) {
          const type = `UTILIZATION_100_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'CRITICAL',
              title: `100% Capacity: ${lic.softwareName}`,
              message: `All ${total} seats for "${lic.softwareName}" (${lic.licenseId}) are allocated. No additional seats available.`,
              relatedId: lic.licenseId,
              module: 'SEAT_ALLOCATION',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (utilPercent >= thresholds.criticalUtilizationPercent) {
          const type = `UTILIZATION_90_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'WARNING',
              title: `High Utilization (${utilPercent}%): ${lic.softwareName}`,
              message: `License "${lic.softwareName}" (${lic.licenseId}) has ${allocated}/${total} seats occupied.`,
              relatedId: lic.licenseId,
              module: 'SEAT_ALLOCATION',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (utilPercent >= thresholds.highUtilizationPercent) {
          const type = `UTILIZATION_80_${lic.licenseId}`;
          if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
            newAlerts.push({
              notificationId: generateId('NOTIF'),
              type,
              severity: 'INFO',
              title: `Utilization Warning (${utilPercent}%): ${lic.softwareName}`,
              message: `License "${lic.softwareName}" has reached ${utilPercent}% seat allocation.`,
              relatedId: lic.licenseId,
              module: 'SEAT_ALLOCATION',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // 3. Renewal Pending Check
      if (lic.status === 'RENEWAL PENDING') {
        const type = `RENEWAL_PENDING_${lic.licenseId}`;
        if (!existingNotifications.some(n => n.type === type && !n.isDismissed)) {
          newAlerts.push({
            notificationId: generateId('NOTIF'),
            type,
            severity: 'WARNING',
            title: `Renewal Pending: ${lic.softwareName}`,
            message: `A renewal request is currently in progress for "${lic.softwareName}".`,
            relatedId: lic.licenseId,
            module: 'RENEWALS',
            isRead: false,
            isDismissed: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    if (newAlerts.length > 0) {
      const combined = [...newAlerts, ...existingNotifications];
      await db.write('notifications', combined);
      return combined;
    }

    return existingNotifications;
  }
};

module.exports = alertEngine;
