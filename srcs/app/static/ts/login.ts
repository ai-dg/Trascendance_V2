let loginbtn: HTMLElement = document.getElementById("logbtn") as HTMLElement
let registerbtn: HTMLElement = document.getElementById("registerbtn") as HTMLElement


let loginfields: HTMLElement = document.getElementById("loginfields") as HTMLElement
let signupfields: HTMLElement = document.getElementById("signupfields") as HTMLElement


loginbtn.addEventListener('click', ()=>{
    loginfields.classList.remove("visually-hidden");
    signupfields.classList.add("visually-hidden");
})


registerbtn.addEventListener('click', ()=>{
    signupfields.classList.remove("visually-hidden");
    loginfields.classList.add("visually-hidden");
})