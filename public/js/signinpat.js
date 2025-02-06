let pass = document.querySelector("#pat_pass");
let conpass = document.querySelector("#pat_cpass");
let btn = document.querySelector("#btnsub");
let div = document.querySelector("#forwrong");


function work(){
    btn.addEventListener("click",function(){
        if(pass == conpass)
        {
            btn.type = "submit";
        }else{
<<<<<<< HEAD
            btn.type = "submit";
=======
            div.innerHTML = "Password and confirm password not matching";
>>>>>>> d7955b0 (5 feb)
        }
    });
}


work();