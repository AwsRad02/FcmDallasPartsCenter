import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { firebaseConfig } from "./firebaseconfig.js"; // relative pathconst app = initializeApp(firebaseConfig);
const app=initializeApp(firebaseConfig);
const auth = getAuth(app);

document.querySelector("form").addEventListener("submit",function(e){
    e.preventDefault();


const email = document.querySelector("input[type='email']").value;
const pass= document.querySelector("input[type='password']").value;

signInWithEmailAndPassword(auth,email,pass)
    .then((userCredential)=>{
        alert("login Successful");
    })
    .catch((error) => {
      alert("❌ Error: " + error.message);
      console.error(error);
    });
});
  
