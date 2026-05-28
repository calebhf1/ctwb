importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCaevKkc1bhZF8Yx3ICBdFSc4N-_yGyewU",
  authDomain: "ctwb-c31b8.firebaseapp.com",
  projectId: "ctwb-c31b8",
  storageBucket: "ctwb-c31b8.firebasestorage.app",
  messagingSenderId: "437908408097",
  appId: "1:437908408097:web:5cdf5197d407123d46a060",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/ctwb-icon.png",
  });
});