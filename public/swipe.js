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
    console.log("right");
    getNextPost();
  } else if (deltaX < 0) {
    swipeContent.classList.add("swiped-left");
    console.log("left");
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
        <h3>${post.title}</h3>
        <img src="${post.image}" alt="${post.alt}">
        <p><strong>Breed:</strong> ${post.breed}</p>
        <p><strong>Personality:</strong> ${post.personality}</p>
        <p><strong>Size:</strong> ${post.size}</p>
        <p><strong>Fun Fact:</strong> ${post.funFact}</p>
        <a href="${post.link}">Read More</a>
      `;
      setCookie('currentIndex', currentIndex);
      currentIndex++;
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