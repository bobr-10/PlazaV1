function checkNumValue(input) {
    let min = parseFloat(input.getAttribute('min'));
    let max = parseFloat(input.getAttribute('max'));

    let value = input.value;

    if (value < min) {
        input.value = min;
    }
    else if (value > max) {
        input.value = max;
    }
}

const burgerButton = document.querySelector('.js-header__burger');
const navMenu = document.querySelector('.mobile-container__wrapper');

burgerButton.addEventListener('click', function() {
    navMenu.classList.toggle('mobile-container__wrapper-on');
    this.classList.toggle('js-header__burger_opened');
});