function init() {
    (() => {
    'use strict'
  
    const form = document.getElementById('form');
  
    form.addEventListener('submit', event => {
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    }

    form.classList.add('was-validated');
    }, false);
  })();
}

function delPost(name) {
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){		
			location.reload();
		}
	}
	xhttp.open("DELETE", `/feed/art/post/${name}`);
	xhttp.send();
}

// Form Validation - https://getbootstrap.com/docs/5.2/forms/validation/