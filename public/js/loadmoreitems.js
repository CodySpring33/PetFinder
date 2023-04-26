const myDiv = document.getElementById('my-grid');
var firstLoad = 1;

window.addEventListener("load", (event) => {
  addItems();
});

function addItems(glolastID) {
  let fetchString;
  if (firstLoad) {
    fetchString = '/additems';
    firstLoad = 0;
  }
  else {
    fetchString = `/additems?last_id=${glolastID}`;
  }

  fetch(fetchString, {
    method: 'GET',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP status " + response.status);
      }
      return response.json();
    })
    .then(posts => {
      if (posts.data != null) {
        let newitems = posts.data;
        let lastID = posts.last_id

        document.getElementById('my-container').setAttribute("data-lastID", lastID);

        let html = '';
        for (let i = 0; i < newitems.length; i += 3) {
          html += '<div class="row mt-3">';
          for (let j = i; j < i + 3 && j < newitems.length; j++) {
            html += '<div class="col-sm-4 grid-item">' +
              '<div class="container-fluid bg-light p-4">' +
              '<!-- Content for Grid Item ' + (j + 1) + ' -->' +
              '<h4>' + newitems[j].name + '</h4>' +
              '<p>' + newitems[j].description + '</p>' +
              '</div>' +
              '</div>';
          }
          html += '</div>';
        }
        var myContainer = document.getElementById('my-container');
        myContainer.insertAdjacentHTML('beforeend', html);
      }
    })
    .catch(error => {
      console.error(error);
    });
}
myDiv.addEventListener("scroll", function () {
  var offsetHeightPlusScrolltop = myDiv.offsetHeight + myDiv.scrollTop
  var scrollHeight = myDiv.scrollHeight
  var bottom = offsetHeightPlusScrolltop >= scrollHeight
  var glolastID = document.getElementById('my-container').getAttribute('data-lastID');

  if (bottom && glolastID !== null) {
    addItems(glolastID);
  }
});

