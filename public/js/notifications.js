// Notifications & Alert Center Module
let notificationsList = [];

async function loadNotifications() {
  if (!authToken) return;

  try {
    const res = await fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const result = await res.json();

    if (result.success) {
      notificationsList = result.data;
      const unreadCount = result.unreadCount || 0;

      // Update counters
      const topBadge = document.getElementById('top-notif-count');
      const sideBadge = document.getElementById('sidebar-notif-count');
      const fullBadge = document.getElementById('notif-full-unread-count');

      if (topBadge) {
        topBadge.textContent = unreadCount;
        topBadge.classList.toggle('d-none', unreadCount === 0);
      }
      if (sideBadge) sideBadge.textContent = unreadCount;
      if (fullBadge) fullBadge.textContent = `${unreadCount} Unread`;

      renderNotificationDropdown(notificationsList.slice(0, 8));
      renderNotificationFullList(notificationsList);
    }
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
}

function renderNotificationDropdown(items) {
  const container = document.getElementById('notif-dropdown-list');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="p-3 text-center text-muted small">No notifications right now.</div>';
    return;
  }

  container.innerHTML = items.map(n => {
    let iconClass = 'fa-solid fa-bell text-primary';
    let iconBg = 'rgba(79, 70, 229, 0.15)';

    if (n.severity === 'CRITICAL') {
      iconClass = 'fa-solid fa-triangle-exclamation text-danger';
      iconBg = 'rgba(239, 68, 68, 0.15)';
    } else if (n.severity === 'WARNING') {
      iconClass = 'fa-solid fa-circle-exclamation text-warning';
      iconBg = 'rgba(245, 158, 11, 0.15)';
    }

    return `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="handleNotifClick('${n.notificationId}', '${n.module}', '${n.relatedId}')">
        <div class="notif-icon" style="background: ${iconBg};">
          <i class="${iconClass}"></i>
        </div>
        <div class="flex-grow-1 min-w-0">
          <div class="fw-semibold text-white small text-truncate">${escapeHTML(n.title)}</div>
          <div class="text-secondary small" style="font-size: 0.75rem;">${escapeHTML(n.message)}</div>
          <span class="text-muted" style="font-size: 0.65rem;">${formatTimeAgo(n.createdAt)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderNotificationFullList(items) {
  const container = document.getElementById('notifications-full-list');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="p-4 text-center text-muted">All caught up! No active notifications.</div>';
    return;
  }

  container.innerHTML = items.map(n => {
    let borderStyle = 'border-primary';
    let badgeClass = 'bg-primary';
    if (n.severity === 'CRITICAL') { borderStyle = 'border-danger'; badgeClass = 'bg-danger'; }
    else if (n.severity === 'WARNING') { borderStyle = 'border-warning'; badgeClass = 'bg-warning text-dark'; }

    return `
      <div class="p-3 border-bottom border-secondary d-flex align-items-start gap-3 ${n.isRead ? '' : 'bg-dark'}" style="border-left: 4px solid var(--${n.severity === 'CRITICAL' ? 'danger' : (n.severity === 'WARNING' ? 'warning' : 'primary')});">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge ${badgeClass}" style="font-size: 0.65rem;">${n.severity}</span>
            <span class="fw-bold text-white small">${escapeHTML(n.title)}</span>
            <span class="text-muted small ms-auto" style="font-size: 0.7rem;">${formatTimeAgo(n.createdAt)}</span>
          </div>
          <p class="text-secondary small m-0 mb-2">${escapeHTML(n.message)}</p>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark border border-secondary text-muted" style="font-size: 0.65rem;">Module: ${n.module}</span>
            ${n.relatedId ? `<span class="badge bg-dark border border-secondary text-primary font-monospace" style="font-size: 0.65rem;">Ref: ${n.relatedId}</span>` : ''}
          </div>
        </div>
        <div class="d-flex flex-column gap-1">
          ${!n.isRead ? `<button class="btn btn-sm btn-outline-light py-0 px-2" style="font-size: 0.75rem;" title="Mark Read" onclick="markNotificationRead('${n.notificationId}')"><i class="fa-solid fa-check"></i></button>` : ''}
          <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" title="Dismiss" onclick="dismissNotification('${n.notificationId}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

async function markNotificationRead(notifId) {
  try {
    await fetch(`/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    loadNotifications();
  } catch (_) {}
}

async function markAllNotificationsRead() {
  try {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    showToast('All notifications marked as read', 'info');
    loadNotifications();
  } catch (_) {}
}

async function dismissNotification(notifId) {
  try {
    await fetch(`/api/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    loadNotifications();
  } catch (_) {}
}

function handleNotifClick(notifId, module, relatedId) {
  markNotificationRead(notifId);
  document.getElementById('notification-dropdown')?.classList.remove('active');

  if (module === 'LICENSES') navigateTo('view-licenses');
  else if (module === 'SEAT_ALLOCATION') navigateTo('view-allocations');
  else if (module === 'RENEWALS') navigateTo('view-renewals');
}
