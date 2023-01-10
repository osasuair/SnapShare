function validate() {
    'use strict'
  
    const form = document.getElementById('form');
  
    form.addEventListener('submit', event => {
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    }
    form.classList.add('was-validated');
    }, false);
}
validate();

// Form Validation - https://getbootstrap.com/docs/5.2/forms/validation/