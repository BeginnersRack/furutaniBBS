// import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  
//        ,  reauthenticateWithCredential as firebase_reauthenticateWithCredential ,EmailAuthProvider as firebase_EmailAuthProvider } from "./FirebaseConfig.js";
// import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
//        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
//        , signOut as firebase_signOut 
//        ,sendEmailVerification as firebase_sendEmailVerification 
//        ,updatePassword as firebase_updatePassword, updateProfile as firebase_updateProfile    } from "./FirebaseConfig.js";

// import { rtdatabase as firebaseRTDB_database ,ref as firebaseRTDB_ref, set as firebaseRTDB_set , update as firebaseRTDB_update ,push as firebaseRTDB_push ,onValue as firebaseRTDB_onValue,onDisconnect as firebaseRTDB_onDisconnect  ,serverTimestamp as firebaseRTDB_serverTimestamp  } from "./FirebaseConfig.js";// ----------

import { firestoredatabase , fsdb_collection, fsdb_doc, fsdb_setDoc ,fsdb_getDoc , fsdb_onSnapshot , fsdb_query, fsdb_where, fsdb_getDocs ,fsdb_orderBy, fsdb_limit} from "./FirebaseConfig.js";
import { fsdb_enableIndexedDbPersistence , fsdb_getDocFromCache } from "./FirebaseConfig.js";

import { putdataToIndexedDb , getdataFromIndexedDb , removedataFromIndexedDb } from "./myfunc_indexeddb.js";

import { getServerTimeFromRTDB } from "./myfunc_getlog.js";
import { myconsolelog } from "./myfunc_common.js";


const indexedDbName = "furutaniBBS"
const datapack_length=2;

//*********** main ****************






//*********** my functions ****************

const listenerAry={};
// listenerAry[refPath]={startposition:ListenerRemoveFunction}
const maxSortIndexAry={};
// maxSortIndexAry[refPath]=number;

async function setDataPackListener(refPath,requestSortIndex0=-1){ 
    let requestSortIndex=(requestSortIndex0 | 0); //小数点以下切捨
    
    
    let limitsortAry= await getdataFromIndexedDb(indexedDbName,refPath,"packAry"); //(dbname,storeName,key)
     // {startval:0,lastmodified:(datetime)}の配列。
     // 各パックの境界値。Ary[0]は最初のパックの最前値。lastmodifiedはこのパックのデータの最後の確認日時を記録。
     // indexdbに保管し取得する。：未実装
    if(!limitsortAry){
        limitsortAry=[];
        limitsortAry[0]={startval:0,lastmodified:0};
    }
    
    if(requestSortIndex<0){
        let maxIndx=maxSortIndexAry[refPath];
        if(typeof maxIndx != "number"){
           //let allLength=getDataCount(refPath);
            maxIndx = await getMaxOfSortIndex(refPath);
            if(typeof maxIndx =="number"){
                maxSortIndexAry[refPath] = maxIndx;
            }
        }
        if(typeof maxIndx != "number"){ 
            myconsolelog("[Error] cannot get maxIndx or maxSortIndexAry");
            return null; 
        }
        
        requestSortIndex=maxIndx;
    }
    let packnum = ((requestSortIndex/datapack_length) | 0); // 取得対象となるパックの個数目。先頭が0個目。
    let startPosition = packnum * datapack_length;
    let endPosition = startPosition+datapack_length;
    
    for(let i=limitsortAry.length;i<=packnum;i++){
        limitsortAry[i]={startval:packnum * datapack_length,lastmodified:0};
    }
    
    //--
    let packListenerRemove = null;
    if(listenerAry[refPath]){
        packListenerRemove =listenerAry[refPath].startposition;
    }
    if(packListenerRemove){ // indexdbにデータあるならばそこから取得するべし。
        return ([startPosition,endPosition]);
    }
    
    // ---------------------------------------------
    //firestoreから取得する。
    
    const tgtRef = fsdb_collection(firestoredatabase , refPath);
    let tgtquery = fsdb_query(tgtRef, fsdb_orderBy("sort","asc"), fsdb_where("sort", ">=", startPosition), fsdb_where("sort", "<", endPosition));
    
    if(!listenerAry[refPath]){
        listenerAry[refPath] = {};
    }
    //ans=await getDataPackFromFirestore(tgtquery);
    listenerAry[refPath].startposition = fsdb_onSnapshot(tgtquery, function(querySnapshot){
        
        let promiseAry = [];
        
        querySnapshot.docChanges().forEach((change) => {
            let tgtdoc=change.doc;
            let tgtpath = tgtdoc.ref.path;
            let tgtparentPath = tgtpath.slice(0, 0-(tgtdoc.id.length)-1);
            myconsolelog("[event]firestore:"+change.type+":"+tgtpath);
            switch(change.type){
                case "added":
                case "modified":
                    promiseAry.push(
                        putdataToIndexedDb(indexedDbName, tgtparentPath ,tgtdoc.id, tgtdoc.data(),1)
                    );
                    break;
                case "removed":
                    promiseAry.push(
                        removedataFromIndexedDb(indexedDbName, tgtparentPath ,  tgtdoc.id )
                    );
                    break;
            }
        });
        Promise.allSettled(promiseAry).then(function(values){
            let lastModifiedTime=0;
            for(let res of values){
                switch(res.status){
                    case "fulfilled":
                        let docdata = res.value;
                        if(docdata.modified_sys) { if(lastModifiedTime<docdata.modified_sys)lastModifiedTime = docdata.modified_sys; }
                        break;
                    case "rejected":
                        let err = res.reason;
                        myconsolelog(`[Error] IndexedDB : try put : ${err.name} : ${err.message}`);
                        break;
                }
            }
            
            
            if(!lastModifiedTime){lastModifiedTime=getServerTimeFromRTDB();}
            //let limitsortAry= await getdataFromIndexedDb(indexedDbName,refPath,"packAry");
            limitsortAry[packnum].lastmodified = lastModifiedTime;
            putdataToIndexedDb(indexedDbName,refPath,"packAry" , limitsortAry,true); // limitsortAry を indexedDBに保存
            
        });
    });
    
    
    
    // -----
    //limitsortAry[packnum].lastmodified =getServerTimeFromRTDB();
    //putdataToIndexedDb(indexedDbName,refPath,"packAry" , limitsortAry,true); // limitsortAry を indexedDBに保存
    
    return ([startPosition,endPosition]);
}
async function getDataPackFromFirestore(tgtquery){
    let ans={};
    try {
        const querySnapshot = await fsdb_getDocs(tgtquery);
        querySnapshot.forEach((doc) => {
          let onedata={};
          //onedata[id]=doc.id;
          onedata["sort"]=doc.data().sort;
          onedata["title"]=doc.data().title;
          onedata["modified"]=doc.data().modified;
          
          ans[doc.id]=onedata;
        });
    } catch (e) {
        myconsolelog("[Error] cannot get documents : "+ e);
    }
    
    return ans;
}


async function getDataCount(refPath,q_fieldname="",q_condition="",q_value=""){
    let ans=0;
    
    try {
        const tgtRef = fsdb_collection(firestoredatabase , refPath);

        if(q_fieldname){
            const q = fsdb_query( tgtRef , fsdb_where(q_fieldname, q_condition, q_value));
            const snapshot = await getCountFromServer(q);
        }else{
            const snapshot = await getCountFromServer(tgtRef);
        }
        ans = snapshot.data().count;
    } catch (e) {
        myconsolelog("Error getting count document:"+ e);
    }
    
    return ans;
}
async function getMaxOfSortIndex(refPath){
    let ans=null;
    
    try {
        const tgtRef = fsdb_collection(firestoredatabase , refPath);
        
        let tgtquery = fsdb_query(tgtRef, fsdb_orderBy("sort","desc"), fsdb_limit(1) );
        
        let querySnapshot = await fsdb_getDocs(tgtquery);
        //if (querySnapshot.exists()) {
        querySnapshot.forEach(function(doc){
            ans = doc.data().sort;
        });
    } catch (e) {
        myconsolelog("Error at getting Max-sort-index document:"+ e);
    }
    
    return ans;
}






// ------ for test -----------
async function mytest01(){

    //const boardsRef = fsdb_collection(firestoredatabase , "BulletinBoardList");
    const docRef = fsdb_doc(firestoredatabase, "BulletinBoardList", "BBS01");

    let docSnap;
    try { // キャッシュ使用には、configでenableIndexedDbPersistence()宣言が必要
        docSnap = await fsdb_getDocFromCache(docRef);
        console.log("Cached document data:", docSnap.data());
    } catch (e) {
        console.log("Error getting cached document:", e);
    }
    try {
        docSnap = await fsdb_getDoc(docRef);
        console.log("get document data:", docSnap.data());
    } catch (e) {
        console.log("Error getting document:", e);
    }
    
    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
    
}

let test_unsubscribe;
function mytest02(){
    const boardsRef = fsdb_collection(firestoredatabase , "BulletinBoardList/BBS01/threadList");
    const q = fsdb_query( boardsRef , fsdb_where("sort", "!=", "CA"));
    test_unsubscribe = fsdb_onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        let myinfo="("+change.oldIndex+"->"+change.newIndex+")";
        if (change.type === "added") {
            console.log("New data: ", change.doc.data()+" "+myinfo);
        }
        if (change.type === "modified") {
            console.log("Modified data: ", change.doc.data()+" "+myinfo);
        }
        if (change.type === "removed") {
            console.log("Removed data: ", change.doc.data()+" "+myinfo);
        }
        
        //test_unsubscribe();
      });
    });

}

function mytest(mycase){
    switch(mycase){
      case 1:
        mytest01();
        break;
      case 2:
        mytest02();
        break;
      case 3:
        (async function(){
            let myPromise = setDataPackListener("BulletinBoardList/BBS01/threadList",-1.2);
            let posAry = await myPromise; 
            let i=0;
        })();
        break;
      default:
        alert("?");
    }
}

//***********  Export ***************
window.fb_fs_mytest_firestore = mytest;
// export { mytest01 };
