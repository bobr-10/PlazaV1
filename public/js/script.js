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


const rangeInput = document.querySelectorAll(".wrapper-double-filter__range-input input"),
priceInput = document.querySelectorAll(".wrapper-double-filter__price-input input"),
range = document.querySelector(".wrapper-double-filter__slider .progress");
let priceGap = 500;

priceInput.forEach(input =>{
    input.addEventListener("input", e =>{
        let minPrice = parseInt(priceInput[0].value),
        maxPrice = parseInt(priceInput[1].value);
        
        if((maxPrice - minPrice >= priceGap) && maxPrice <= rangeInput[1].max){
            if(e.target.className === "input-min"){
                rangeInput[0].value = minPrice;
                range.style.left = ((minPrice / rangeInput[0].max) * 100) + "%";
            }else{
                rangeInput[1].value = maxPrice;
                range.style.right = 100 - (maxPrice / rangeInput[1].max) * 100 + "%";
            }
        }
    });
});

priceInput[0].addEventListener("input", function(e) {
    let minPrice = parseInt(this.value);
    let maxPrice = parseInt(priceInput[1].value);
    if (minPrice >= maxPrice) {
        this.value = maxPrice - priceGap;
    }
});

priceInput[1].addEventListener("input", function(e) {
    let minPrice = parseInt(priceInput[0].value);
    let maxPrice = parseInt(this.value);
    if (maxPrice <= minPrice) {
        this.value = minPrice + priceGap;
    }
});

rangeInput.forEach(input =>{
    input.addEventListener("input", e =>{
        let minVal = parseInt(rangeInput[0].value),
        maxVal = parseInt(rangeInput[1].value);
        if((maxVal - minVal) < priceGap){
            if(e.target.className === "range-min"){
                rangeInput[0].value = maxVal - priceGap
            }else{
                rangeInput[1].value = minVal + priceGap;
            }
        }else{
            priceInput[0].value = minVal;
            priceInput[1].value = maxVal;
            range.style.left = ((minVal / rangeInput[0].max) * 100) + "%";
            range.style.right = 100 - (maxVal / rangeInput[1].max) * 100 + "%";
        }
    });
});