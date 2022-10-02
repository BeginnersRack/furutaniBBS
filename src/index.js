import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  } from "./FirebaseConfig.js";
import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
        , signOut as firebase_signOut 
        ,sendEmailVerification as firebase_sendEmailVerification     } from "./FirebaseConfig.js";




const HtmlElement_myAuthDivId ="my_auth";
const HtmlElement_myAuthDiv = document.getElementById(HtmlElement_myAuthDivId);


const str_signInButton = `<button class="btn btn-primary" type="submit"  onClick="fb_signIn()">サインイン<\/button>`;
const str_signOutButton = `<button class="btn btn-primary" type="submit"  onClick="fb_signOut()">サインアウト<\/button>`;
const str_signInAnonymousButton = `<button class="btn btn-primary" type="submit"  onClick="fb_signInAnonymous()">匿名<\/button>`;



//*********** my functions ****************

let loginUser = {};
function updateLoginUser(user){
  if (user) {
      loginUser.uid = user.uid;
      loginUser.displayName = user.displayName;
      loginUser.email = user.email;
      loginUser.emailVerified = user.emailVerified;
      loginUser.isAnonymous = user.isAnonymous;
  } else {
      loginUser.uid=0;
      loginUser.displayName="";
      loginUser.email = "";
      loginUser.emailVerified = false;
      loginUser.isAnonymous = false;
  }
}



firebase_onAuthStateChanged(firebaseAuth ,(user) => {
   if(HtmlElement_myAuthDiv){
      if (user) {
          console.log('ログインしています');
          updateLoginUser(user);
          
          let signOutMessage = `
              <p>Hello, ${loginUser.displayName}!<\/p>
              ${str_signOutButton}
          `;
          
          if(user.isAnonymous){
              signOutMessage += '（匿名）';
          }
          if(user.emailVerified){
              signOutMessage += '（メール確認済み）';
              signOutMessage += ` <button class="btn btn-primary" type="submit"  onClick="signUp_sendEmailVerification()">(Re)<\/button>`;

          }else{
              signOutMessage += ` 
                  <button class="btn btn-primary" type="submit"  onClick="signUp_sendEmailVerification()">メール確認<\/button>
              `;
          }
          
          HtmlElement_myAuthDiv.innerHTML =  signOutMessage;
          
          
      } else {
          console.log('ログインしていません！');
          updateLoginUser(0);

          const signInMessage = `
                ${str_signInButton} 
            `;

          HtmlElement_myAuthDiv.innerHTML =  signInMessage;


      }
   }
});

// ***** Auth functions *****



// 新規ユーザー登録
function createNewUser(email, password){
  if(HtmlElement_myAuthDiv){
    firebase_createUserWithEmailAndPassword(firebaseAuth, email, password).then((userCredential) => {
        // Signed in
        updateLoginUser(userCredential.user);
        // ...
    }).catch((error) => {
        console.log(`[error] Can not Sign-In! (${error.code}:${error.message})`);
    });
    
    
  }
}
//サインイン
function signIn(phase){
  if(HtmlElement_myAuthDiv){
    
    let el_userid = document.getElementById("signin_email");
    let el_userpass = document.getElementById("signin_password");
    
    switch (phase) {
      default:
          const jscode01 = `let tgtEl=document.getElementsByName('signin_q1');
            if(tgtEl){if(tgtEl.length){let checkedVal='';
            for(let i=tgtEl.length-1;i>=0;i--){if(tgtEl.item(i).checked){checkedVal=tgtEl.item(i).value}};
            let execflg=1;if(checkedVal=='new'){execflg=2};
            fb_signIn(execflg);  }}
          `;
          const signInMessage = `
              <p>デフォルト<br><input type="radio" name="signin_q1" value="exist" checked> パスワード入力
                               <input type="radio" name="signin_q1" value="new"> 新規作成
              </p>
  <label style={{ display: "block" }}>email</label> <input id="signin_email" type="email"></input>
  <label style={{ display: "block" }}>    password(Password should be at least 6 characters) </label>
    <input id="signin_password" type="password"></input>
  <label style={{ display: "block" }}>confirm</label>
  <button type="submit" onClick="${ jscode01 }">
  送信</button>
          `;
          
          HtmlElement_myAuthDiv.innerHTML =  signInMessage;
      break;
      case 1:
          
          if(el_userid){if(el_userpass){
              let email = el_userid.value;
              let password=el_userpass.value;
              
              firebase_signInWithEmailAndPassword(firebaseAuth, email, password).then((userCredential) => {
                 // Signed in
                 updateLoginUser(userCredential.user);
                 
              }).catch((error) => {
                console.log(`[error] Can not Sign-In! (${error.code}:${error.message})`);
                let msg="認証に失敗しました。\n 5回連続で失敗するとロックされます。";
                alert(msg);
              });
          
          }}
          
      break;
      case 2:
          
          if(el_userid){if(el_userpass){
              let email = el_userid.value;
              let password=el_userpass.value;
              
              createNewUser(email, password);
              
          }}
          
      break;
    }
    
    // end
  }
}

//  メール認証
function signUp_sendEmailVerification(){

    firebase_sendEmailVerification(firebaseAuth.currentUser).then(() => {
        // Email verification sent.
        
        alert("メールを送信しました。")
        
    }).catch((error) => {
        console.log(`[error] Can not Sign-In! (${error.code}:${error.message})`);
        let msg="認証に失敗しました。???"
        alert(msg);
    });

}

// reauthenticateWithCredential




//***********  Export ***************

window.fb_signIn = signIn;

window.fb_signOut = function() {
    firebase_signOut(firebaseAuth).then(() => {
      // Sign-out successful.
    }).catch((error) => {    // An error happened.
      console.log(`[error] Cannot Sign-out! (${error.code}:${error.message})`);
    });
}
window.fb_getLoginUser = function(){
    return loginUser;
}

window.signUp_sendEmailVerification = signUp_sendEmailVerification;
