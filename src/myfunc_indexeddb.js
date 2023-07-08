// import "./my_authentication.js";
import {getServerTimeFromRTDB} from "./myfunc_getlog.js";
import {myDateTimeFormat} from "./myfunc_common.js";
import { myconsolelog ,myTypeof} from "./myfunc_common.js";
// import { myObjectEqual} from "./myfunc_common.js";


const c_indexedDbVersion = 1;

//***********  ****************
if(1==2){ // 古いブラウザへの対応が必要な場合
    // 以下の行に、テストを行いたい実装の接頭辞を含めてください。
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // 関数内でない場合は、"var indexedDB = ..." を使用しないでください。
    // さらに、window.IDB* オブジェクトへの参照が必要でしょう:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; 
    // この行は、古いブラウザー向けにオブジェクトの定数が必要である場合に限り、必要になります。
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // (Mozilla はこれらのオブジェクトに接頭辞をつけていませんので、window.mozIDB* は不要です)
}



//*********** DB定義 ****************
let mySuppressNewVersionErr;
function myopenIndexedDb(dbname){
    
    return new Promise(function(resolve, reject){
        
        if(!indexeddbAvailable()){ reject(); }
        
        try{
            let request = window.indexedDB.open(dbname,c_indexedDbVersion);
            
            request.onblocked = (event) => {
              let mymsg="[Warning] indexedDBがバージョンアップしました。このサイトを開いている他のタブをすべて閉じてください";
              mymsg = mymsg+" : "+event.oldVersion + " ⇒ " +event.newVersion;
              myconsolelog(mymsg);
              alert(mymsg);
              reject(request);
            };
            request.addEventListener("upgradeneeded",function(event){ // successやerrorよりも前に発生
                let idb=request.result; // request.result がIDBDatabaseオブジェクト
                
                //  sample:
                //  try{idb.deleteObjectStore("hoge");}
                //  if(event.newVersion<5)let store01 = idb.createObjectStore("hoge",{keyPath:data1.field1 ,autoIncrement:true});
                //  store01.createIndex("sortIndex","sort",{unique:false,multiEntry:false});
                
                switch(dbname){
                 case "furutaniBBS":
                    switch(event.oldVersion){
                     default:
                     case 0:
                        let storeMR = idb.createObjectStore("MeetingRooms",{keyPath:null ,autoIncrement:false});
                        
                        let store01 = idb.createObjectStore("BulletinBoardList/BBS01/threadList",{keyPath:null ,autoIncrement:false});
                        store01.createIndex("sortIndex",['sortIndex','sort'],{unique:false,multiEntry:false});
                        //let store01D= idb.createObjectStore("BulletinBoardList/BBS01/threadDetails",{keyPath:null ,autoIncrement:false});
                        //store01D.createIndex("postIndex","['threadId_post','postid']",{unique:false,multiEntry:false});
                        //store01D.createIndex("voteIndex","['threadId_vote','ownerid']",{unique:false,multiEntry:false});
                        
                        
                        let store02 = idb.createObjectStore("BulletinBoardList/BBS02/threadList",{keyPath:null ,autoIncrement:false});
                        store02.createIndex("sortIndex",['sortIndex','sort'],{unique:false,multiEntry:false});
                        
                        
                        let store03 = idb.createObjectStore("BulletinBoardList/BBS03/threadList",{keyPath:null ,autoIncrement:false});
                        store03.createIndex("sortIndex",['sortIndex','sort'],{unique:false,multiEntry:false});
                        
                        
                     
                    }
                  break;
                 default:
                     myconsolelog(`[Error] indexedDBのDB名が未知です：${dbname}`);
                }
                myconsolelog("[Info] indexedDBをバージョンアップしました");
            });
            
            request.addEventListener("error",function(event){ //失敗したとき
                myconsolelog(`[ERROR] Indexed DB : ${event.target.error.code}:${event.target.error.name}:${event.target.error.message}`);
                reject(request);
            });
            

            request.addEventListener("success",function(event){ // request.result がIDBDatabaseオブジェクト
                const db = event.target.result; // === request.result
                let dbver=db.version;
                //myconsolelog(`[Info] open indexedDB:${db.name}(version ${db.version})`);
                db.onversionchange = (event) => {
                   if( event.newVersion || (!mySuppressNewVersionErr) || ((new Date())>mySuppressNewVersionErr ) ){
                      db.close();
                   
                      const mymsg="[Warning] 新しいバージョンのページが使用可能になりました。再読み込みしてください! "+(event.oldVersion ? event.oldVersion : "?")+"→"+(event.newVersion ? event.newVersion : "?");
                      console.log(mymsg);
                      let flg=1;
                      if(mySuppressNewVersionErr){
                          let chk = myTypeof(mySuppressNewVersionErr)
                          if((chk=="[object Date]")||(chk=="[object Number]")){
                              if( mySuppressNewVersionErr > (new Date()) ){
                                  flg=0;
                              }
                          }
                      }
                      if(flg){  
                              mySuppressNewVersionErr= new Date();
                              mySuppressNewVersionErr= mySuppressNewVersionErr.setMinutes(mySuppressNewVersionErr.getMinutes() + 1); //1分間 留保
                              
                              if(confirm(mymsg)){
                                  location.reload();
                              }
                      }
                      //reject();
                   }
                };
                resolve(request);
                
            });
        } catch(err) {
            myconsolelog(`[error] Can not open IndexedDb[${dbname}] : ${error.code}:${error.message}`);
            reject(err);
        }
    });
    
}







//---------- firestoreのpath⇒indexedDBのパス への変換処理 他 -----
function transferDBPath(fs_refPathAndKey){    // fs_refPathAndKey = [refColPath,refKey]
    //sample : fs_refPath = "BulletinBoardList/BBS01/threadList/(threadId)/vote"
    const dirAry = fs_refPathAndKey[0].split("/");
    
    let indxdb_refPath=fs_refPathAndKey[0];
    let indxdb_key=fs_refPathAndKey[1];
    let indxdb_IndxKey1="";
    let indxdb_IndxKey2="";
    
    switch (dirAry[0]) {
      case "BulletinBoardList":
        
        const fs_key = fs_refPathAndKey[1];
        if(dirAry.length<=2){
            myconsolelog(`[Error] transferDBPath for indexedDB : ${fs_refPathAndKey[0]} key=${fs_key}`);
            return fs_refPathAndKey;
        }
        if(dirAry[0]!="BulletinBoardList"){
            myconsolelog(`[Error] transferDBPath for indexedDB : ${fs_refPathAndKey[0]} key=${fs_key}`);
            return fs_refPathAndKey;
        }
        if(dirAry[2]!="threadList"){
            myconsolelog(`[Error] transferDBPath for indexedDB : ${fs_refPathAndKey[0]} key=${fs_key}`);
            return fs_refPathAndKey;
        }
        //--
        //if(dirAry.length==3){ return fs_refPathAndKey; } //  fs_refPath = "BulletinBoardList/BBS01/threadList";
        //if(dirAry.length==4){ return fs_refPathAndKey; } //  fs_refPath = "BulletinBoardList/BBS01/threadList/(id)";
        

        let threadid = dirAry[3];
        //if(dirAry.length!=5){
        //    myconsolelog(`[Error] transferDBPath for indexedDB : ${fs_refPathAndKey[0]} key=${fs_key}`);
        //    return fs_refPathAndKey;
        //}
        //switch (dirAry[4]) {
        //  case "discussion":
        //      return [ dirAry[0]+"/"+dirAry[1]+"/threadDetails" , threadid+"_"+fs_key ,threadid , "postIndex"];
        //    break;
        //  case "vote":
        //      return [ dirAry[0]+"/"+dirAry[1]+"/threadDetails" , threadid+"_vote_"+fs_key ,threadid, "voteIndex"];
        //    break;
        //  default:
        //    myconsolelog(`[Error] transferDBPath for indexedDB : ${fs_refPathAndKey[0]} key=${fs_key}`);
        //    return fs_refPathAndKey;
        //}
        
        indxdb_refPath=dirAry[0];
        for(let i=1;i<=2;i++){
           indxdb_refPath += "/"+dirAry[i]
        }
        indxdb_key="";
        indxdb_IndxKey1=null;
        indxdb_IndxKey2=null;
        if(dirAry.length<3){
            indxdb_key = fs_key;  
        }else{
            if(dirAry.length==3){
                indxdb_key = fs_key;
                if((fs_key=="")||(fs_key.length==20)){
                    indxdb_IndxKey1=dirAry[1]; //sortIndex = "BBS01"
                    indxdb_IndxKey2="sort"; //sort
                }
            }else{
                indxdb_key=dirAry[3];
                for(let i=4;i<dirAry.length;i++){
                   indxdb_key += "/"+dirAry[i]
                }
                if(fs_key) indxdb_key += "/"+fs_key;
                switch (dirAry[4]) {
                  case "contents":
                    if((fs_key=="")||(fs_key.length==20)){
                        indxdb_IndxKey1= "content_"+threadid; 
                        indxdb_IndxKey2="sort";
                    }
                    break;
                  case "discussion":
                    if((fs_key=="")||(fs_key.length==20)){
                        indxdb_IndxKey1= "post_"+threadid; //postIndex
                        indxdb_IndxKey2="sort"; //postid
                    }
                    break;
                  case "vote":  // fs_key はメールアドレス
                        indxdb_IndxKey1= "vote_"+threadid; //voteIndex
                        indxdb_IndxKey2="";
                    break;
                }
                
            }
        }
        break;
        
      case "MeetingRooms":
        indxdb_refPath=dirAry[0];
        if(dirAry.length<=1){indxdb_key="";}else{indxdb_key=dirAry[1];}
        for(let i=2;i<dirAry.length;i++){
           indxdb_key += "/"+dirAry[i];
        }
        if(fs_refPathAndKey[1]){ 
            if(indxdb_key)indxdb_key+="/";
            indxdb_key += fs_refPathAndKey[1];
        }
        indxdb_IndxKey1="";
        indxdb_IndxKey2="";
        break;
        
      case "test":
        indxdb_refPath=fs_refPathAndKey[0];
        indxdb_key=fs_refPathAndKey[1];
        indxdb_IndxKey1="";
        indxdb_IndxKey2="";
        break;
        
      default:
            myconsolelog(`[Error] transferDBPath for indexedDB : ${fs_refPathAndKey[0]} key=${fs_refPathAndKey[1]}`);
            return fs_refPathAndKey;
    }
    
    // 返値   0:ストア名、 1:キー値、  2:インデックス参照時のキー第1項の値   3:インデックス参照時のキー第2項の種別
    //     2:indexedDBでの"sortindex"インデックスにおける、複合キー第1項の値。（第2項は3:によって列名で指定する）
    //     3:通常は"sort"とする。indexedDBのsort列に格納する、firestore側の列の名前を指定する。
    return ([indxdb_refPath,indxdb_key , indxdb_IndxKey1,indxdb_IndxKey2 ]);
}

//*********** my functions ****************

function putdataToIndexedDb(dbname,storeName,key,value,overwriteflg=0){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required put data to IndexedDB : ${storeName} ${key} in ${dbname}`);
        
        let orgdata = await getdataFromIndexedDb(dbname,storeName,key);
//      if(myObjectEqual(orgdata,value)){
//            reject(orgdata);
//      }
        
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName,1);
        if(transaction===null){ //Error
            reject( null );
        }
        
        try{
            let objectStore=transaction.objectStore(storeName);
            
            let request
            if(overwriteflg){
                if(key){
                    request = objectStore.put(value,key);
                }else{
                    request = objectStore.put(value);
                }
            }else{
                if(key){
                    request = objectStore.add(value,key);
                }else{
                    request = objectStore.add(value);
                }
            }
            request.onerror = function(event) {
                reject(event.target.error);
            };
            request.onsuccess = function(event) {
                resolve(value); // request.result でidを返す
            };
        } catch(err) {
            myconsolelog(`[error] Can not get data from IndexedDb[${dbname}-${storeName}-${key}] :${err.message}`);
            reject(err);
        }
    });
}
function removedataFromIndexedDb(dbname,storeName,key){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required remove data from IndexedDB : ${storeName} ${key} in ${dbname}`);
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName , true);
        if(transaction===null){ //Error
            reject( null );
        }
        
        try{
            let objectStore=transaction.objectStore(storeName);
            
            let request = objectStore.delete(key);
            request.onerror = function(event) {
                reject(event.target.error);
            };
            request.onsuccess = function(event) {
                resolve(request.result);
            };
        } catch(err) {
            myconsolelog(`[error] Can not remove data from IndexedDb[${dbname}-${storeName}-${key}] : ${err.code}:${err.message}`);
            reject(err);
        }
    });
}
function getdataFromIndexedDb(dbname,storeName0,key0){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required get data from IndexedDB : ${storeName0} ${key0} in ${dbname}`);
        
        let storeName,key;
        const PandK=transferDBPath([storeName0,key0]);
        if(PandK[0]==storeName0){
            storeName=storeName0;
            key=key0;
        }else{
            storeName=PandK[0];
            key=PandK[1];
            myconsolelog(`[Info] transfer Path for IndexedDB : ${storeName} ${key} in ${dbname}`);
        }
        
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName);
        if(transaction===null){ //Error
            myconsolelog(`[Error] cannot open Transaction : ${storeName} in ${dbname}`);
            reject( null );
        }
        if(transaction==0){
            myconsolelog(`[Error] cannot open Transaction :no store "${storeName}" in ${dbname}`);
            reject( null );
        }
        try{
            let objectStore=transaction.objectStore(storeName);
            
            let request = objectStore.get(key);
            request.onerror = function(event) {
                reject(event.target.error);
            };
            request.onsuccess = function(event) {
                resolve(request.result); //  (event.target = request)
            };
        } catch(err) {
            myconsolelog(`[error] Can not get data from IndexedDb[${dbname}-${storeName}-${key}] : ${err.code}:${err.message}`);
            reject(err);
        }
    });
}
async function getTransactionOfIndexedDb(dbname,storeName,writableFlg=0){
    let request = await myopenIndexedDb(dbname).catch(function(err){
        return null;
    });
    
    let idb=request.result; // request.result がIDBDatabaseオブジェクト
    
    let rwmode="readonly";
    if(writableFlg) rwmode="readwrite";
    
    let transaction;
    try{
       transaction=idb.transaction(storeName,rwmode);
    }catch (error) {
       myconsolelog("[Info] try to get transaction : "+storeName);
       myconsolelog("[Error] " + error.name+ "(db version "+request.result.version+") : "+error.message);
       if(error.code==8){ // "NotFoundError" storeがない？
           if(confirm("indexedDBが破損しています。一旦削除して良いですか？")){
               const dbdelete = await new Promise((resolve, reject) => {
                   let delreq = window.indexedDB.deleteDatabase(dbname);
                   delreq.onsuccess = function(event){
                       myconsolelog("[Info] IndexedDB["+dbname+"] was deleted.");
                       resolve(1);
                   }
                   delreq.onerror = function(err){
                       myconsolelog("[Error] IndexedDB["+dbname+"] couldnot be deleted. : "+ err);
                       reject(0);
                   }
               });
               if(dbdelete){
                   return await getTransactionOfIndexedDb(dbname,storeName,writableFlg);
               }
           }else{
               myconsolelog("[Info] Canceled Re-create IndexedDB.");
               return 0;
           }
       }
    }
    if(transaction){
        transaction.onerror = event => {
            myconsolelog("[Error] " + transaction.error);
        }
    }
    
    return transaction;
}



function getKeysFromIndexedDb(dbname,storeName,indexName, sortindex_start ,sortindex_end , direction0=false ,exceptkey=[]){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required getKeys data from IndexedDB(${indexName}) : ${storeName} (${sortindex_start}-${sortindex_end}) in ${dbname}`);
        
        let strDirection="next";
        if(direction0) strDirection="prev";
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName);
        if(transaction===null){ //Error
            reject( null );
        }
        
        function chk_validKey(tgt){
            if(null == tgt){return "";}
            if(typeof tgt=="number") { return tgt.toString(); }
            if(typeof tgt=="string") { return tgt; }
            if(Array.isArray(tgt)){
                for (const elem of tgt) {
                   if(null==elem){return "";}
                }
                return ("["+(tgt.toString())+"]");
            }
        }
        const chk_startval = chk_validKey(sortindex_start);
        const chk_endval = (null==sortindex_end)?"null":chk_validKey(sortindex_end);
        if( !chk_startval || !chk_endval ){
            let abortmsg=`IndexedDb[${dbname}-${storeName}-${(chk_startval?chk_startval:"??")}～${(chk_endval?chk_endval:"??")}]`;
            myconsolelog(`[Warning] abandon to execute 'bound' on 'IDBKeyRange': The key is not valid. ${abortmsg}`);
            resolve([]);
        }else{
            try{
                const objectStore=transaction.objectStore(storeName);
                const index = (indexName) ? objectStore.index(indexName) : objectStore;
                const boundKeyRange = (null==sortindex_end) ? IDBKeyRange.lowerBound(sortindex_start) : IDBKeyRange.bound(sortindex_start,sortindex_end , false, true);
                
                
                let ans = []; // 順番を保存したいので連想配列は不可
                
                index.openKeyCursor(boundKeyRange,strDirection).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (!cursor){
                        //myconsolelog("openCursor終了")
                        resolve(ans);
                    } else {      // ( cursor.key  ,cursor.primaryKey) openCursorなら、cursor.value
                      
                      if(indexName || !exceptkey.includes(cursor.key) ){
                          ans.push( [cursor.key , cursor.primaryKey] );
                      }
                      
                      cursor.continue();
                    }
                };
                
                
            } catch(err) {
                myconsolelog(`[error] Can not get data from IndexedDb[${dbname}-${storeName}-${sortindex_start}～${sortindex_end}] : ${err.code}:${err.message}`);
                reject(err);
            }
        }
    });
}



//*********** my functions ****************

function indexeddbAvailable() {
    return (!!(window.indexedDB));
}

function indexedDB_deleteAll(dbname ,forceflg=false){
    let exeflg=0;
    if(!forceflg){
        exeflg=confirm(`indexedデータベース[${dbname}]を削除します。\n宜しいですか？`)
    }
    //------------
    let DBDeleteRequest = window.indexedDB.deleteDatabase(dbname);
    DBDeleteRequest.onerror = function(event) {
      console.log(`[Error] indexedデータベース[${dbname}]の削除中にエラーが発生しました。`);
    };
    DBDeleteRequest.onsuccess = function(event) {
      console.log(`[Info] indexedデータベース[${dbname}]が正常に削除されました。`);
    };
}
function indexedDB_countAll(dbname="furutaniBBS"){
    return new Promise(async function(resolve, reject){
        
        let DBOpenRequest = window.indexedDB.open(dbname);
        DBOpenRequest.onerror = function(event) {
            reject(`indexedDB[${dbname}]を開けません。`);
        };
        DBOpenRequest.onsuccess = async function(event) {
            
            let ans={};
            let idxdb = DBOpenRequest.result;
            if(!idxdb.objectStoreNames){
                reject(`indexedDB[${dbname}]からストアを取得できません。`);
            }else{
                if(idxdb.objectStoreNames.length==0){
                    reject(`indexedDB[${dbname}]にはストアがありません。`);
                }else{
                    let transaction = idxdb.transaction(idxdb.objectStoreNames, "readonly" );
                    for (let storename of idxdb.objectStoreNames){
                        let objectStore = transaction.objectStore(storename);
                        let countRequest = objectStore.count();
                        ans[storename] = await new Promise(function(resolve, reject){
                            countRequest.onsuccess = function() {
                                resolve(countRequest.result);
                            }
                        })
                    }
                    resolve(ans);
                }
            }
            
        }
        
    });
}



//***********  Export ***************
export { putdataToIndexedDb , getdataFromIndexedDb,getKeysFromIndexedDb,removedataFromIndexedDb ,transferDBPath };

window.getdataFromIndexedDb = getdataFromIndexedDb;
window.indexedDB_countAll = indexedDB_countAll;
