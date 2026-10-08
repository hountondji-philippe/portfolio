// PWA Manager - Gestion intelligente de la connexion et notifications
class PWAManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.deferredPrompt = null;
    
    this.init();
  }

  init() {
    // Vérifier les conditions PWA
    this.checkPWAConditions();
    
    // Écouteurs de connexion
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Écouteur d'installation PWA
    window.addEventListener('beforeinstallprompt', (e) => this.handleInstallPrompt(e));
    
    // Vérifier si déjà installé
    this.checkIfInstalled();
    
    // Démarrer le service worker
    this.registerServiceWorker();
    
    // Notification initiale
    this.showInitialStatus();
  }

  checkPWAConditions() {
    // Vérifier HTTPS
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    
    // Vérifier Service Worker
    const hasSW = 'serviceWorker' in navigator;
    
    // Vérifier Manifest
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    
    // Vérifier si déjà installé
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Vérifier le navigateur
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    
    return isHTTPS && hasSW && hasManifest && !isStandalone && (isChrome || isEdge);
  }

  // Gestion de la connexion - SANS BANNIÈRE
  handleOnline() {
    if (!this.isOnline) {
      this.isOnline = true;
      // PAS de notification de connexion rétablie
    }
  }

  handleOffline() {
    if (this.isOnline) {
      this.isOnline = false;
      // PAS de notification hors ligne
    }
  }

  // Gestion de l'installation PWA
  handleInstallPrompt(e) {
    e.preventDefault();
    this.deferredPrompt = e;
    // PAS de bouton flottant - géré manuellement dans store.html
    
    // Notifier que l'installation est disponible
    this.notifyInstallAvailable();
  }

  notifyInstallAvailable() {
    // Créer un événement personnalisé pour que store.html puisse réagir
    const event = new CustomEvent('pwaInstallAvailable', {
      detail: { available: true }
    });
    window.dispatchEvent(event);
  }

  // Méthode pour vérifier si l'installation est disponible
  isInstallAvailable() {
    return this.deferredPrompt !== null;
  }

  async checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  // Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Mise à jour automatique SANS notification
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Mise à jour silencieuse
              // PAS de notification
              
              // Forcer le rechargement après un court délai
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          });
        });
      } catch (error) {
        // Erreur silencieuse
      }
    }
  }

  // Installation PWA
  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // PAS de notification d'installation
        this.isInstalled = true;
      }
      
      this.deferredPrompt = null;
    }
  }

  // Synchronisation des données
  async syncOfflineData() {
    try {
      // Récupérer les données stockées localement
      const offlineData = await this.getOfflineSubmissions();
      
      if (offlineData.length > 0) {
        // Envoyer les données au serveur
        for (const submission of offlineData) {
          try {
            await fetch('https://api.inputdev.dev/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(submission.data)
            });
            
            // Supprimer les données synchronisées
            await this.removeOfflineSubmission(submission.id);
            
            this.showNotification(
              'Synchronisation réussie',
              `${offlineData.length} formulaire(s) synchronisé(s)`,
              'success'
            );
          } catch (error) {
            console.error('Erreur synchronisation:', error);
          }
        }
      }
    } catch (error) {
      console.error('Erreur syncOfflineData:', error);
    }
  }

  // Stockage local IndexedDB
  async getOfflineSubmissions() {
    return new Promise((resolve) => {
      const request = indexedDB.open('PortfolioDB', 1);
      
      request.onerror = () => resolve([]);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['submissions'], 'readonly');
        const store = transaction.objectStore('submissions');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
        getAllRequest.onerror = () => resolve([]);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('submissions')) {
          db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async removeOfflineSubmission(id) {
    return new Promise((resolve) => {
      const request = indexedDB.open('PortfolioDB', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['submissions'], 'readwrite');
        const store = transaction.objectStore('submissions');
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve();
      };
    });
  }

  async saveOfflineSubmission(data) {
    return new Promise((resolve) => {
      const request = indexedDB.open('PortfolioDB', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['submissions'], 'readwrite');
        const store = transaction.objectStore('submissions');
        const addRequest = store.add({
          data: data,
          timestamp: Date.now(),
          synced: false
        });
        
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => resolve();
      };
    });
  }

  // Notifications via le système existant
  showNotification(title, body, type = 'info') {
    if (window.notificationManager) {
      window.notificationManager.custom(title, body, {
        tag: `pwa-${type}`,
        data: { type: type }
      });
    }
  }

  showInitialStatus() {
    // PAS de notification initiale
  }

  // Utilitaires
  getConnectionStatus() {
    return {
      online: this.isOnline,
      installed: this.isInstalled,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }
}

// Créer l'instance globale
window.pwaManager = new PWAManager();

// Exporter pour les modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}
