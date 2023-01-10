function delNotif(elm, id) {
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==204)
            elm.parentElement.parentElement.parentElement.remove();
    }
    xhttp.open("DELETE", `/feed/user/notif?id=${id}`)
    xhttp.send();
}