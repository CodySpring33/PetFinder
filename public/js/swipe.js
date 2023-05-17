var swipeContent = document.getElementsByClassName("swipe-card")[0];
var startX, endX;
let currentIndex = getCookie('currentIndex');





swipeContent.addEventListener("mousedown", function(event) {
  startX = event.clientX;
});

swipeContent.addEventListener("mouseup", function(event) {
  endX = event.clientX;
  var deltaX = endX - startX;

  if (deltaX > 0) {
    swipeContent.classList.add("swiped-right");
    //cant get http only cookie TODO fix
    var postID = getCookie('postID')
    fetch('/liked', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({postID}),
    })
      .then(response => {
        if (response.ok) {
          console.log('POST request successful');
          // Handle the successful response here
        } else {
          console.log('POST request failed');
          // Handle the failed response here
        }
      })
      .catch(error => {
        console.error('An error occurred during the POST request:', error);
        // Handle the error here
      });
      getNextPost();
  } else if (deltaX < 0) {
    swipeContent.classList.add("swiped-left");
    
    getNextPost();
  }

  // Remove the swipe classes after the transition is complete
  setTimeout(function() {
    swipeContent.classList.remove("swiped-left", "swiped-right");
  }, 300);
});

function getNextPost() {
  fetch(`/posts?index=${currentIndex}`, {
    method: 'GET',
  })
  .then(response => response.json())
  .then(post => {
    // Update the HTML with the next post
    if(post.message == "No posts left")
    {
      const latestPost = document.getElementById('latest-post');
      latestPost.innerHTML = `
      <h3>${post.message}</h3>`;
      setCookie('currentIndex', currentIndex);
    }
    else{
      const latestPost = document.getElementById('latest-post');
      latestPost.innerHTML = `
        <h3>${post.name}</h3>
        <img src="${post.imageURL}" class="card-img-top" alt="${post.name}">
        <p><strong>Breed:</strong> ${post.breed}</p>
        <p><strong>Coat:</strong> ${post.coat}</p>
        <p><strong>Color:</strong> ${post.color}</p>
        <p><strong>Location:</strong> ${post.location}</p>
        <p><strong>Physical</strong>: ${post.physical}</p>
        <p><strong>Health</strong>: ${post.health}  </p>
        <p><strong>Fee:</strong> ${post.fee}</p>
        <p><strong>Description:</strong> ${post.description}</p>
      `;
      setCookie('currentIndex', currentIndex);
      setCookie('postID', post._id);
      currentIndex++;
      const image = document.querySelector('.image');
      image.addEventListener('dragstart', (event) => {
        event.preventDefault(); // Prevent the default dragging behavior
      });
    }
  }).catch(error => console.error(error));
}

// Call getNextPost() to get the first post
getNextPost();

function setCookie(name, value) {
  document.cookie = name + '=' + value + '; path=/';
}

function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split('=');
    if (parts[0] === name) {
      return parts[1];
    }
  }
  return 0;
}
