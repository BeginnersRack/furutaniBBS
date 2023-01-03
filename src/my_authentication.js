import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  
        ,  reauthenticateWithCredential as firebase_reauthenticateWithCredential ,EmailAuthProvider as firebase_EmailAuthProvider } from "./FirebaseConfig.js";
import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
        , signOut as firebase_signOut 
        ,sendEmailVerification as firebase_sendEmailVerification 
        ,updatePassword as firebase_updatePassword, updateProfile as firebase_updateProfile    } from "./FirebaseConfig.js";
import { rtdatabase as firebaseRTDB_database ,rtdb_ref as firebaseRTDB_ref ,rtdb_onValue as firebaseRTDB_onValue } from "./FirebaseConfig.js";
import { createAccessLogData  } from "./myfunc_getlog.js";
import { getSessionID , setSessionID , getSessonIdList,getMySessionNumber } from "./myfunc_storage.js";
import { myUuidCreate } from "./my_uuid.js";
import { myconsolelog } from "./myfunc_common.js";


const HtmlElement_myAuthDivId ="my_auth";
const HtmlElement_myAuthDiv = document.getElementById(HtmlElement_myAuthDivId);


const str_signInButton = `<button class="btn btn-primary" type="submit"  onClick="fb_signIn()">サインイン<\/button>`;
const str_signOutButton = `<button class="btn btn-primary" type="submit"  onClick="fb_signOut()">サインアウト<\/button>`;
const str_signInAnonymousButton = `<button class="btn btn-primary" type="submit"  onClick="fb_signInAnonymous()">匿名<\/button>`;


const flg_disableRecordLog = document.getElementById("disableRecordLog");
   //DOM上にこれが設置されている場合はAccessLogを記録しない//管理者画面などであれば、DOM上に設置しておく



// *************** onload *****************

let flg_alreadySet_FBconnectedRefOnValueEvent=false;
//setListenerOnChangeConnectedStatus(firebaseAuth.currentUser);

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



firebase_onAuthStateChanged(firebaseAuth ,(user) => {  //認証状態が変化したときに呼び出される
   myconsolelog(`[event] firebase_onAuthStateChanged ignition.`);

   setListenerOnChangeConnectedStatus(user);

   if(HtmlElement_myAuthDiv){
      if (user) {
          console.log('ログインしています');
          updateLoginUser(user);
          
          let signOutMessage = "<p>";
          
          signOutMessage += '<span id="accountHello">';
          signOutMessage += `Hello, ${loginUser.displayName}! `;
          //signOutMessage += ` ${str_signOutButton} `;
          
          if(user.isAnonymous){
              signOutMessage += '（匿名）';
          }
          if(user.emailVerified){
            //  signOutMessage += '（メール確認済み）';
            //  signOutMessage += ` <button class="btn btn-primary" type="submit"  onClick="signUp_sendEmailVerification()">(Re)<\/button>`;

          }else{
            //  signOutMessage += "<button class="btn btn-primary" type="submit"  onClick="signUp_sendEmailVerification()">メール確認<\/button>";
              signOutMessage += "（メール未確認）";
          }
          signOutMessage += '</span>';
          
          signOutMessage += "</p>";
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
   
   if(window.fb_onAuthStateChanged_callback){
       if (typeof window.fb_onAuthStateChanged_callback === 'function') {
           window.fb_onAuthStateChanged_callback();
       }
   }
});

// ***** Auth functions *****




// 接続(online化)時 処理 (アクセスログ保存)
function setListenerOnChangeConnectedStatus(user){ 
    
    if(flg_alreadySet_FBconnectedRefOnValueEvent){
          myconsolelog(`[Info] called:setListenerOnChangeConnectedStatus() : already set.`);
    }else{
        if (!user) {
          myconsolelog(`[Info] called:setListenerOnChangeConnectedStatus() : no user defined.`);
        }else{
          myconsolelog(`[Info] called:setListenerOnChangeConnectedStatus() user=${ (user.uid)?user.uid:' ?' }`);
          const connectedRef = firebaseRTDB_ref(firebaseRTDB_database , '.info/connected');  // Firebase定数 //
          firebaseRTDB_onValue(connectedRef, (snap) => { //接続状態が変化したときに呼び出される
            if (snap.val() === true) {
              myconsolelog(`[event] firebase[info/connected]Flg changed.`);
              // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
              
              
              let ssidCreateFlg=0;
              let ssid = getSessionID(1); //sessionStorageのデータを取得
              if(!ssid){
                  ssid=myUuidCreate();
                  setSessionID(ssid);
                  ssidCreateFlg=1; //New!!
              }
              
              let sessionList = getSessonIdList(1); //localStorageから取得：自分のIDが無ければ登録する。但し返値は登録前のデータを返す
              
              let logmsg="";
              let connectionLogFlg=0;
              if(sessionList[ssid]){ 
                  if(ssidCreateFlg){ // 別ウインドウで新規に開かれたか
                      connectionLogFlg=0; // 接続者情報は更新しない
                      logmsg="sepalate-connect.";
                  }else{ // ブラウザのリロードがされたか
                      connectionLogFlg=2; // 同時に 最新接続者情報も更新する(短時間更新であれば前回の情報を引き継ぐ)
                      logmsg="re-connect.";
                  }
              }else{ // 自分はLocalStorageには未登録だった
                  //getSessonIdList(0); // localStorageのSessonIdListを更新
                  if(ssidCreateFlg){ // 完全に新規のアクセス開始か
                      connectionLogFlg=1; // 同時に 最新接続者情報も更新する
                      logmsg="connect.";
                  }else{  // データエラー localStorageのデータ破損か   長時間アクセス更新なしでtimeout扱い？
                      connectionLogFlg=1; // 同時に 最新接続者情報も更新する
                      logmsg="[INFO] データ不正：セッション継続なのにLocalStorageにデータが有りません。";
                  }
              }
              
              const myuser = firebaseAuth.currentUser;
              if(myuser) { 
                  if(flg_disableRecordLog){ myconsolelog(`[Log] ${logmsg}` ,-1); 
                  }else{
                          createAccessLogData(myuser , logmsg , connectionLogFlg ); 
              }   }
              
              
              

              
            }
          });
        }
    }
    
}




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
//    phase  0:パスワード入力要求  1:パスワード認証チェック   2:新規ユーザー作成
function signIn(phase  ,  email0="",password0=""){

    let email = "";
    let password="";
    if((email0)&&(password0)){
        email = email0;
        password=password0;
    }else{
        let el_userid = document.getElementById("signin_email");
        if(el_userid)   email = el_userid.value;
        let el_userpass = document.getElementById("signin_password");
        if(el_userpass) password=el_userpass.value;
    }
    
    
    switch (phase) {
      default:
          if(HtmlElement_myAuthDiv){
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
          }
      break;
      case 1:
          
          if(email){if(password){
              
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
          
          if(email){if(password){
              
              createNewUser(email, password);
              
          }}
          
      break;
    }
    
    // end

}

//サインアウト
function signOut(){
    createAccessLogData(null , "signOut." , -1); // 同時に 最新接続者情報も更新する
    firebase_signOut(firebaseAuth).then(() => {
          console.log(`[Info] Sign-out.`); // Sign-out successful.
          //createAccessLogData(null , "signOut." , -1); // サインアウト後は権限がない
          
          changeIframeTarget_main("");
          
    }).catch((error) => {    // An error happened.
          console.log(`[error] Cannot Sign-out! (${error.code}:${error.message})`);
          createAccessLogData(null , "Error! cannot signOut" , -2);
    });
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

//---- アカウントの再認証 ----
// reauthenticateWithCredential
function signUp_reauthenticateWithCredential(callback){
    const user = firebaseAuth.currentUser;
    
    let myPassword = window.prompt("今のパスワードを入力してください", "");
    
    const credential = firebase_EmailAuthProvider.credential( user.email , myPassword );
    
    firebase_reauthenticateWithCredential(user, credential).then(() => {
          // User re-authenticated.
          console.log("re-authentication succeed");
          
          if(callback){
              callback(credential);
          }
          
    }).catch((error) => { // An error ocurred
          console.log(`[error] Can not reauthenticate! (${error.code}:${error.message})`);
          alert("エラーが発生しました。");
    });
}

// パスワード更新（再認証のcallbackとして使用を想定）
function changeAuthPassword_cb(credential){

    let newPassword = window.prompt("新しいパスワードを入力してください", "");
    
    firebase_updatePassword(credential.user, newPassword).then(() => {
          createAccessLogData(null,'changed password.');
    }).catch((error) => { // An error ocurred
          console.log(`[error] Can not change-AuthPassword! (${error.code}:${error.message})`);
          alert("エラーが発生しました。");
    });
}
function changeAuthPassword(){
    signUp_reauthenticateWithCredential(changeAuthPassword_cb);
}



//　updateProfile
function changeAuthUserName(){
    const user = firebaseAuth.currentUser;
    const oldname = user.displayName;
    
    let newname = window.prompt("新しいユーザー名を入力してください", oldname);
    
    newname = escapeHtml(newname);
    
    let userProfile={displayName: newname, photoURL: ""};
    
    firebase_updateProfile(user, userProfile).then(() => {
          createAccessLogData(null,'change UserDisplayName : ['+oldname+']→['+newname+']');
          updateLoginUser(user);
          if(changeIframeTarget_main){if(str_IframeTarget_main_name){
              changeIframeTarget_main(str_IframeTarget_main_name);
          }}
    }).catch((error) => { // An error ocurred
          console.log(`[error] Can not change-AuthPassword! (${error.code}:${error.message})`);
          alert("エラーが発生しました。");
    });
}



//***********  Export ***************
window.fb_getLoginUser = function(myflg=0){
    if(myflg){ updateLoginUser(firebaseAuth.currentUser); }
    return loginUser;
}
window.fb_getcurrentUser = function(){
    return firebaseAuth.currentUser;
}

window.fb_signIn = signIn;
window.fb_signOut = signOut;

window.signUp_sendEmailVerification = signUp_sendEmailVerification;
window.signUp_changeAuthUserName = changeAuthUserName;
window.signUp_changeAuthPassword = changeAuthPassword;


