/* ===========================
   NOTIFICATION MANAGER - Système centralisé de notifications
   Gère toutes les notifications du site avec l'API du navigateur
   =========================== */

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.lastNotificationTime = 0;
    this.notificationCooldown = 1000; // 1 seconde entre les notifications
    this.init();
  }

  // Initialiser le système de notifications
  async init() {
    if ('Notification' in window) {
      // Demander la permission si nécessaire
      if (Notification.permission === 'default') {
        this.permission = await this.requestPermission();
      } else {
        this.permission = Notification.permission;
      }
    }
  }

  // Demander la permission de notification
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      return 'denied';
    }
  }

  // Envoyer une notification
  send(options = {}) {
    // Vérifier le cooldown pour éviter les notifications multiples
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return false;
    }
    this.lastNotificationTime = now;

    const defaults = {
      title: 'Notification',
      body: '',
      icon: '/assets/image.png',
      tag: 'default',
      requireInteraction: false,
      silent: false,
      vibration: [200, 100, 200],
      data: {}
    };

    const config = { ...defaults, ...options };

    // Vérifier si on est sur mobile
    const isMobile = window.innerWidth <= 768;
    
    // Sur mobile, utiliser toujours le fallback DOM
    if (isMobile) {
      this.showFallbackNotification(config);
      return true;
    }

    // Vérifier si les notifications sont supportées (PC)
    if (!('Notification' in window)) {
      this.showFallbackNotification(config);
      return false;
    }

    // Vérifier la permission (PC uniquement)
    if (this.permission !== 'granted') {
      this.showFallbackNotification(config);
      return false;
    }

    try {
      // Créer et afficher la notification système (PC)
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon,
        tag: config.tag,
        requireInteraction: config.requireInteraction,
        silent: config.silent,
        data: config.data,
        vibrate: config.vibration
      });

      // Auto-fermeture si spécifié
      if (config.autoClose) {
        setTimeout(() => {
          notification.close();
        }, config.autoClose);
      }

      // Gérer les clics
      if (config.onClick) {
        notification.onclick = () => {
          config.onClick(notification);
          notification.close();
        };
      }

      return notification;
    } catch (error) {
      this.showFallbackNotification(config);
      return false;
    }
  }

  // Notification de fallback pour navigateurs non compatibles
  showFallbackNotification(config) {
    // Supprimer les notifications existantes pour éviter les doublons
    const existingNotifications = document.querySelectorAll('.notification-fallback');
    existingNotifications.forEach(notif => notif.remove());
    
    // Déterminer le type de notification pour le style
    const isError = config.data?.type?.includes('error') || 
                   config.tag?.includes('error') || 
                   config.title?.toLowerCase().includes('erreur') ||
                   config.title?.toLowerCase().includes('limite');
    
    // Créer une notification DOM
    const notification = document.createElement('div');
    notification.className = `notification-fallback ${isError ? 'error' : 'success'}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-text">
          <div class="notification-title">
            ${config.title}
          </div>
          <div class="notification-body">${config.body}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Auto-fermeture
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, config.autoClose || 5000);

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }

  // Notifications prédéfinies pour les formulaires
  formSuccess(formName, userName = '', userEmail = '') {
    const messages = {
      'contact': {
        title: 'Message envoyé avec succès',
        body: userName ? `Merci ${userName} ! Votre message a été envoyé et je vous répondrai rapidement.` : 'Votre message a été envoyé avec succès. Je vous répondrai rapidement.'
      },
      'newsletter': {
        title: 'Newsletter : Inscription réussie',
        body: userEmail ? `Bienvenue ${userEmail} ! Vous êtes maintenant inscrit à ma newsletter.` : 'Vous êtes maintenant inscrit à ma newsletter.'
      },
      'feedback': {
        title: 'Avis envoyé avec succès',
        body: userName ? `Merci ${userName} ! Votre avis a été reçu et est très apprécié.` : 'Votre avis a été reçu et est très apprécié.'
      }
    };

    const config = messages[formName] || messages['contact'];
    
    return this.send({
      title: config.title,
      body: config.body,
      tag: `form-success-${formName}`,
      icon: '/assets/logo.png',
      vibration: [200, 100, 200],
      autoClose: 5000,
      data: { type: 'form-success', form: formName, userName, userEmail }
    });
  }

  formError(formName, error = '') {
    const messages = {
      'contact': {
        title: 'Erreur lors de l\'envoi du message',
        body: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.'
      },
      'newsletter': {
        title: 'Newsletter : Erreur d\'inscription',
        body: 'Une erreur est survenue lors de votre inscription à la newsletter. Veuillez réessayer.'
      },
      'feedback': {
        title: 'Erreur lors de l\'envoi de l\'avis',
        body: 'Une erreur est survenue lors de l\'envoi de votre avis. Veuillez réessayer.'
      }
    };

    const config = messages[formName] || messages['contact'];
    
    return this.send({
      title: config.title,
      body: config.body,
      tag: `form-error-${formName}`,
      icon: '/assets/logo.png',
      vibration: [200, 200, 200],
      requireInteraction: true,
      data: { type: 'form-error', form: formName, error }
    });
  }

  // Notifications spécifiques aux formulaires
  contactSuccess(name) {
    return this.formSuccess('contact', name);
  }

  contactError(error = '') {
    return this.formError('contact', error);
  }

  newsletterSuccess(email) {
    return this.formSuccess('newsletter', '', email);
  }

  newsletterError(error = '') {
    return this.formError('newsletter', error);
  }

  feedbackSuccess(name) {
    return this.formSuccess('feedback', name);
  }

  feedbackError(error = '') {
    return this.formError('feedback', error);
  }

  // Notification personnalisée
  custom(title, body, options = {}) {
    return this.send({
      title,
      body,
      tag: `custom-${Date.now()}`,
      icon: '/assets/logo.png',
      autoClose: 5000,
      ...options
    });
  }

  // Réinitialiser le cooldown (utile pour les tests)
  resetCooldown() {
    this.lastNotificationTime = 0;
  }
}

// Créer l'instance globale
window.notificationManager = new NotificationManager();

// Fonctions de test pour déboguer (à retirer en production)
window.testNotifications = {
  testError: function(formType = 'contact') {
    // Réinitialiser le cooldown pour les tests
    window.notificationManager.resetCooldown();
    
    switch(formType) {
      case 'contact':
        window.notificationManager.contactError('Erreur de test - message');
        break;
      case 'newsletter':
        window.notificationManager.newsletterError('Erreur de test - newsletter');
        break;
      case 'feedback':
        window.notificationManager.feedbackError('Erreur de test - feedback');
        break;
    }
  },
  
  testSuccess: function(formType = 'contact', userName = 'Test User', userEmail = 'test@example.com') {
    // Réinitialiser le cooldown pour les tests
    window.notificationManager.resetCooldown();
    
    switch(formType) {
      case 'contact':
        window.notificationManager.contactSuccess(userName);
        break;
      case 'newsletter':
        window.notificationManager.newsletterSuccess(userEmail);
        break;
      case 'feedback':
        window.notificationManager.feedbackSuccess(userName);
        break;
    }
  },
  
  testRateLimit: function() {
    window.notificationManager.resetCooldown();
    window.notificationManager.custom(
      'Limite d\'envoi atteinte',
      'Vous avez atteint la limite de 2 envois par 12 heures. Réessayez plus tard.',
      { tag: 'rate-limit', requireInteraction: true }
    );
  }
};


// Exporter pour les modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}
