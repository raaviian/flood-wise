self.addEventListener("push", function (event) {
  const data = event.data.json();
  const title = data.title;
  const options = {
    body: data.body,
    icon: "assets/fw-plain.png", // Path to your notification icon
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("http://localhost:3000") // URL to open when notification is clicked
  );
});
