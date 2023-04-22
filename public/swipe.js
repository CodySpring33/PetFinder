var swipeContent = document.getElementById("swipe-content");
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
{/* <div class="container mt-5 grid-container">
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 1 -->
      <h4>Grid Item 1</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 2 -->
      <h4>Grid Item 2</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 3 -->
      <h4>Grid Item 3</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<!-- Add more rows for infinite scrolling -->
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <!-- Content for Grid Item 4 -->
    <div class="container-fluid bg-light p-4">
      <h4>Grid Item 4</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <!-- Content for Grid Item 5 -->
    <div class="container-fluid bg-light p-4">
      <h4>Grid Item 5</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <!-- Content for Grid Item 6 -->
    <div class="container-fluid bg-light p-4">
      <h4>Grid Item 6</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <!-- Content for Grid Item 7 -->
    <div class="container-fluid bg-light p-4">
      <h4>Grid Item 7</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <!-- Content for Grid Item 8 -->
    <div class="container-fluid bg-light p-4">
      <h4>Grid Item 8</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <!-- Content for Grid Item 8 -->
    <div class="container-fluid bg-light p-4">
      <h4>Grid Item 9</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 1 -->
      <h4>Grid Item 10</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 2 -->
      <h4>Grid Item 11</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 3 -->
      <h4>Grid Item 12</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 1 -->
      <h4>Grid Item 13</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 2 -->
      <h4>Grid Item 14</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 3 -->
      <h4>Grid Item 15</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 1 -->
      <h4>Grid Item 16</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 2 -->
      <h4>Grid Item 17</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 3 -->
      <h4>Grid Item 18</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 1 -->
      <h4>Grid Item 19</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 2 -->
      <h4>Grid Item 20</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 3 -->
      <h4>Grid Item 21</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div>
<div class="row mt-3">
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 1 -->
      <h4>Grid Item 22</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 2 -->
      <h4>Grid Item 23</h4>
      <p>Content goes here</p>
    </div>
  </div>
  <div class="col-sm-4 grid-item">
    <div class="container-fluid bg-light p-4">
      <!-- Content for Grid Item 3 -->
      <h4>Grid Item 24</h4>
      <p>Content goes here</p>
    </div>
  </div>
</div> */}