let pass = document.querySelector("#pat_pass");
let conpass = document.querySelector("#pat_cpass");
let btn = document.querySelector("#btnsub");
let div = document.querySelector("#forwrong");

function work() {
    btn.addEventListener("click", function (event) {
        if (pass.value === conpass.value) {
            btn.type = 'submit';
            div.innerHTML = ""; // Clear error message if passwords match
        } else {
            event.preventDefault(); // Prevent form submission
            div.innerHTML = "Password and confirm password not matching";
        }
    });
}

work();
