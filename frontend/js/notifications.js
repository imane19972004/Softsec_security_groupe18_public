class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      padding: 16px 20px;
      background: ${this.getBgColor(type)};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
      font-weight: 500;
    `;
    
    notification.innerHTML = `
      <span style="margin-right: 10px;">${icons[type]}</span>
      ${message}
    `;
    
    this.container.appendChild(notification);
    
    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
  }

  success(message, duration = 3000) { this.show(message, 'success', duration); }
  error(message, duration = 5000) { this.show(message, 'error', duration); }
  warning(message, duration = 4000) { this.show(message, 'warning', duration); }
  info(message, duration = 3000) { this.show(message, 'info', duration); }

  getBgColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type] || colors.info;
  }
}

window.notificationManager = new NotificationManager();