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

const burgerButton = document.querySelector('.js-header__burger');
const navMenu = document.querySelector('.mobile-container__wrapper');

burgerButton.addEventListener('click', function() {
    navMenu.classList.toggle('mobile-container__wrapper-on');
    this.classList.toggle('js-header__burger_opened');
});

const fitlerButton = document.querySelector('.js-rooms__show-filters');
const closeFilterButton = document.querySelector('.filters-close')
const filterMenu = document.querySelector('.rooms-filter');

fitlerButton.addEventListener('click', function() {
    filterMenu.classList.toggle('rooms-filter__on');
});

closeFilterButton.addEventListener('click', function() {
    filterMenu.classList.remove('rooms-filter__on');
});
