// Check if the user just logged in
const urlParams = new URLSearchParams(window.location.search);
const loginSuccessful = urlParams.get('loginSuccessful');

if (loginSuccessful) {
  // Show the notification
  const notificationDiv = document.getElementById('notification');
  notificationDiv.innerHTML = 'Login successful!';
  notificationDiv.classList.add('success-notification');
  
  // Remove the notification after a few seconds
  setTimeout(() => {
    notificationDiv.innerHTML = '🐾';
    notificationDiv.classList.remove('success-notification');
    notificationDiv.classList.add('remove-notification');
    window.history.replaceState(null, null, window.location.pathname);
  }, 3000);
  
}