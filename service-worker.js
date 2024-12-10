self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('pwa-file-transfer-v1').then(cache => {
        return cache.addAll([
          './',
          './index.html',
          './style.css',
          './script.js',
          './manifest.json'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  });
  
  // Custom installation logic
  let installPromptEvent;
  
  self.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPromptEvent = event;
    // Notify the UI to show the installation prompt button
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'show-install-prompt' }));
    });
  });
  
  self.addEventListener('message', event => {
    if (event.data.type === 'trigger-install') {
      if (installPromptEvent) {
        installPromptEvent.prompt();
        installPromptEvent.userChoice.then(choiceResult => {
          // Log the user response to the installation prompt
          self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
            clients.forEach(client => client.postMessage({
              type: 'install-choice',
              outcome: choiceResult.outcome
            }));
          });
          installPromptEvent = null;
        });
      }
    }
  });
  