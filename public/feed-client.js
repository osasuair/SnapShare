let skip = 0;
let max;
let artwork;
let allArtwork;
let owner = false;

// Execute a function when the user presses a key on the keyboard
document.getElementById("newReview").addEventListener("keyup", function(event) {
	// disables review if nothing is entered
	if (event) {
		if( this.value.trim().length> 0){
			document.getElementById("reviewButton").disabled = false;
		}
		else
			document.getElementById("reviewButton").disabled = true;
	}

	// If the user presses the "Enter" key on the keyboard
	if (event.key === "Enter") {
		if(this.value.length!=0) {
			// Cancel the default action, if needed
			event.preventDefault();
			// Trigger the button element with a click
			document.getElementById("reviewButton").click();
		}
	}
	
});

/* 
Call info getting functions when page is loaded
*/
function init(x){
	allArtwork= x
	getMaxSkips();
	getArtwork();
}

/* 
init function for single artwork page
*/
function initArt(anOwner) {
	owner = anOwner;
	artwork ={_id: location.href.split("/").pop()}
}

// Request to server for the total number of items, used for pagination
function getMaxSkips() {
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){		
			max = Number(this.responseText);
			if(max<=1) document.getElementById("down").disabled = true;
			max--;
		}
	}
    xhttp.open("GET", `/feed/art/skips?all=${allArtwork}`)
	xhttp.send();
}

/* 
Gets the Art element with specific skip value from db and draws page
 */
function getArtwork() {
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){		
			body = JSON.parse(this.responseText);
			artwork = body[0];
			likeInfo = body[1];
			owner = body[2].owner
			let d = new Date(artwork.time)

			// Modifying all the necessary elements based on the data from server
			document.getElementById("artistName").href = `/feed/user/artist/${artwork.artist}`;
			document.getElementById("artistName").innerText = artwork.artist;
			document.getElementById("img").src = artwork.image;
			document.getElementById("img").setAttribute("alt", artwork.name);
			document.getElementById("name").innerText = artwork.name
			document.getElementById("tags").innerHTML = `<p>Category: <a href="/feed/search/results?category=${artwork.category}"> ${artwork.category}</a>, 
			Era: <a href="/feed/search/results?era=${artwork.era}"> ${artwork.era}</a>, Year: ${artwork.year}</p>`
			document.getElementById("datePosted").innerText = `Date: ${d.toLocaleString('default', { month: 'long' })} ${d.getDate()}, ${d.getFullYear()}`;
			document.getElementById("description").innerText= artwork.description

			let reviews = document.getElementById("reviews");

			reviews.innerHTML = "";
			let i = 0;
			artwork.reviews.forEach(elm => {
				revHTML = `
						<div id="${elm[0]}-${i}"class="list-group-item bg-secondary text-white">
							<div class="row align-items-center">
								<div class="col">
									<p class="mb-0">${elm[0]} - ${elm[1]}</p>
								</div>`
				revHTML+= (elm[3]&&!owner) ? `
								<div class="col-auto">
									<button class="btn btn-danger" onclick="delReview(this, '${elm[2]}')" >Delete</button>
								</div>
							</div>
						</div>` : `</div></div>`
				reviews.innerHTML += revHTML
				i++;
			});
			updateReviewScroll(); // Scroll to bottom of Reviews

	
			document.getElementById("likeText").innerText = `Liked by ${likeInfo.numLikes}`
			if(owner){
				document.getElementById("newReview").disabled = true;
				document.getElementById("reviewButton").disabled = true;
				document.getElementById("like").disabled = true;
			} else {
				document.getElementById("newReview").disabled = false;
				document.getElementById("reviewButton").disabled = true;
				document.getElementById("like").disabled = false;
				document.getElementById("like").checked = likeInfo.liked;
			}
		}
		// No artwork available page
		else if (this.readyState==4) {
			document.getElementById("name").innerText = "No Artwork Available"
			document.getElementById("description").innerText= "See 'Explore' in Navigation for all Artworks"


			document.getElementById("newReview").disabled = true;
			document.getElementById("reviewButton").disabled = true;
			document.getElementById("like").disabled = true;
		}

	}
    xhttp.open("GET", `/feed/art?skip=${skip}&all=${allArtwork}`)
	xhttp.send();
}

/* Gets Artwork with more recent Date if Available */
function newer(){
	if (skip==1) {
		document.getElementById("up").disabled = true;
	} else if(skip == 0) {
		return;
	} else {
		document.getElementById("down").disabled = false;
	}
	skip--;
	getArtwork();
}

/* Gets Artwork with less recent Date if Available */
function older(){
	if (skip+1 >=max) {
		document.getElementById("down").disabled = true;
	} else if(skip == max) {
		return;
	} else {
		document.getElementById("up").disabled = false;
	}
	skip++;
	getArtwork();
}

function postRev() {
	if(!owner){
		let review = document.getElementById("newReview").value.trim();

		let body = {}
		body["rev"] = review
		body["artId"] = artwork._id;
		document.getElementById("reviewButton").disabled = true;

		if(review) {
			xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if(this.readyState==4 && this.status==200){		
					let response = JSON.parse(this.responseText);
					document.getElementById("reviews").innerHTML += `
					<div id="${response.username}-${response.n}" class="list-group-item bg-secondary text-white">
						<div class="row align-items-center">
							<div class="col">
								<p class="mb-0">${response.username} - ${review}</p>
							</div>
							<div class="col-auto">
								<button class="btn btn-danger" onclick="delReview(this, '${response.id}')" >Delete</button>
							</div>
						</div>
					</div>`;
					document.getElementById("newReview").value = "";
					updateReviewScroll();
				}
				if(this.readState==4 && this.status == 403)
					alert("Unauthorized")
			}
			xhttp.open("POST", `/feed/art/review`);
			xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.send(JSON.stringify(body));
		} else {
			alert("No review to post");
		}
	}
}

// Scroll to bottom of review scroll
function updateReviewScroll(){
    let review = document.getElementById("review");
    review.scrollTop = review.scrollHeight;
}

// Deletes review with the id and then updates html using the button element
function delReview(elm, id) {
	if(!owner){

		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState==4 && this.status==200){		
				elm.parentElement.parentElement.parentElement.remove();
			}
		}
		xhttp.open("DELETE", `/feed/art/review?id=${id}&artId=${artwork._id}`);
		xhttp.send();
	}
}


function like() {
	if(!owner){
		let body = {}
		body["artId"] = artwork._id;
		
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState==4 && this.status==200){	
				let body = JSON.parse(this.responseText);	
				document.getElementById("like").checked = body.like;
				document.getElementById("likeText").innerText = `Liked by ${body.numLikes}`
			}
			if(this.readState==4 && this.status == 403)
				alert("Unauthorized")
		}
		xhttp.open("PUT", `/feed/art/like`);
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(body));
	}
}

// Bootstrap: Enter press listener for input - https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp