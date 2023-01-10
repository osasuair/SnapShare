function joinCourse(author, id) {
    xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==204)
			location.reload();
	}
    xhttp.open("PUT", `/feed/user/course?author=${author}&id=${id}`)
	xhttp.send();
}

function follow(user) {
    xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==204)
			location.reload();
	}
    xhttp.open("PUT", `/feed/user/follow?user=${user}`)
	xhttp.send();
}

function remFollower(user) {
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==204)
			location.reload();
	}
    xhttp.open("DELETE", `/feed/user/follower?user=${user}`)
	xhttp.send();
}

function delCourse(id) {
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==204)
            location.reload();
    }
    xhttp.open("DELETE", `/feed/user/course?id=${id}`)
    xhttp.send();
}

function switchArtist() {
    xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200)
			location.reload();
		else if(this.readyState==4 && this.status==203){
			window.location.replace("/feed/art/post");
		}
	}
    xhttp.open("PUT", `/feed/user/switchArtist`)
	xhttp.send();
}