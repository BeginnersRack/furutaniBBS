// import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  
//        ,  reauthenticateWithCredential as firebase_reauthenticateWithCredential ,EmailAuthProvider as firebase_EmailAuthProvider } from "./FirebaseConfig.js";
// import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
//        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
//        , signOut as firebase_signOut 
//        ,sendEmailVerification as firebase_sendEmailVerification 
//        ,updatePassword as firebase_updatePassword, updateProfile as firebase_updateProfile    } from "./FirebaseConfig.js";

// import { rtdatabase as firebaseRTDB_database ,ref as firebaseRTDB_ref, set as firebaseRTDB_set , update as firebaseRTDB_update ,push as firebaseRTDB_push ,onValue as firebaseRTDB_onValue,onDisconnect as firebaseRTDB_onDisconnect  ,serverTimestamp as firebaseRTDB_serverTimestamp  } from "./FirebaseConfig.js";
// import "./myfunc_common.js";
import { myconsolelog } from "./myfunc_common.js";





//*********** my functions ****************









//***********  Export ***************
window.fb_getLoginUser = function(){
    return loginUser;
}

export { updatePassword, updateProfile  ,sendEmailVerification   };
