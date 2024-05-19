function checkNumValue(input) {
    let min = parseFloat(input.getAttribute('min'));
    let max = parseFloat(input.getAttribute('max'));

    let value = input.value;



    if (isNaN(value)) {
        input.value = min;
    }
    else if (value > max) {
        input.value = max;
    }
}

document.querySelector('input[name="numBeds"]').addEventListener('input', function() {
    this.value = this.value.replace(/[^\d]/g, '');
});

const burgerButton = document.querySelector('.js-header__burger');
const navMenu = document.querySelector('.mobile-container__wrapper');

burgerButton.addEventListener('click', function() {
    navMenu.classList.toggle('mobile-container__wrapper-on');
    this.classList.toggle('js-header__burger_opened');
});