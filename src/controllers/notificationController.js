const db = require('../config/db');
const alertEngine = require('../services/alertEngine');

const notificationController = {
  async getNotifications(req, res) {
    try {
      // Refresh notifications dynamically based on active licenses
      const notifications = await alertEngine.syncAlerts();
      const activeNotifications = notifications.filter(n => !n.isDismissed);
      const unreadCount = activeNotifications.filter(n => !n.isRead).length;

      res.json({
        success: true,
        unreadCount,
        count: activeNotifications.length,
        data: activeNotifications
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const updated = await db.update('notifications', id, { isRead: true }, 'notificationId');
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      res.json({ success: true, message: 'Notification marked as read.', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const notifications = await db.read('notifications');
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      await db.write('notifications', updated);

      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async dismissNotification(req, res) {
    try {
      const { id } = req.params;
      const updated = await db.update('notifications', id, { isDismissed: true }, 'notificationId');
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      res.json({ success: true, message: 'Notification dismissed.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = notificationController;
