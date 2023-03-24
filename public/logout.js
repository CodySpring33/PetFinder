const logoutLink = document.getElementById('logout-link');
logoutLink.addEventListener('click', function(event) {
  event.preventDefault(); // Prevent the default behavior of the link
  // Perform a POST request to the /logout route using Fetch API
  fetch('/logout', { method: 'POST' })
    .then(response => {
      if (response.status === 200) {
        console.log('Logout successful');
        window.location.href = '/';
      } else {
        console.error(response.statusText);
        alert('Logout failed. Please try again.');
      }
    })
    .catch(error => {
      console.error(error);
      alert('Logout failed. Please try again.');
    });
});
