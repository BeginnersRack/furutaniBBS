// import "./my_authentication.js";
import {getServerTimeFromRTDB} from "./myfunc_getlog.js";
import {myDateTimeFormat} from "./myfunc_common.js";
import { myconsolelog , myObjectEqual} from "./myfunc_common.js";



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



//*********** my functions ****************

function putdataToIndexedDb(dbname,storeName,key,value,overwriteflg=0){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required put data to IndexedDB : ${storeName} ${key} in ${dbname}`);
        
        let orgdata = await getdataFromIndexedDb(dbname,storeName,key);
        if(myObjectEqual(orgdata,value)){
            reject(orgdata);
        }
        
        
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
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName);
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
            myconsolelog(`[error] Can not remove data from IndexedDb[${dbname}-${storeName}-${key}] : ${error.code}:${error.message}`);
            reject(err);
        }
    });
}
function getdataFromIndexedDb(dbname,storeName,key){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required get data from IndexedDB : ${storeName} ${key} in ${dbname}`);
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName);
        if(transaction===null){ //Error
            reject( null );
        }
        
        try{
            let objectStore=transaction.objectStore(storeName);
            
            let request = objectStore.get(key);
            request.onerror = function(event) {
                reject(event.target.error);
            };
            request.onsuccess = function(event) {
                resolve(request.result);
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
    
    let transaction=idb.transaction(storeName,rwmode);
    
    
    return transaction;
}

function myopenIndexedDb(dbname){
    
    return new Promise(function(resolve, reject){
        
        if(!indexeddbAvailable()){ reject(); }
        
        try{
            let request = window.indexedDB.open(dbname,c_indexedDbVersion);
            
            request.onblocked = (event) => {
              let mymsg="[Warning] indexedDBがバージョンアップしました。このサイトを開いている他のタブをすべて閉じてください";
              myconsolelog(mymsg);
              alert(mymsg);
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
                        let store01 = idb.createObjectStore("BulletinBoardList/BBS01/threadList",{keyPath:null ,autoIncrement:false});
                        store01.createIndex("sortIndex",['sortIndex','sort'],{unique:false,multiEntry:false});
                        //let store01D= idb.createObjectStore("BulletinBoardList/BBS01/threadDetails",{keyPath:null ,autoIncrement:false});
                        //store01D.createIndex("postIndex","['threadId_post','postid']",{unique:false,multiEntry:false});
                        //store01D.createIndex("voteIndex","['threadId_vote','ownerid']",{unique:false,multiEntry:false});
                     
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
                //myconsolelog(`[Info] open indexedDB:${db.name}(version ${db.version})`);
                db.onversionchange = (event) => {
                  db.close();
                  const mymsg="[Warning] 新しいバージョンのページが使用可能になりました。再読み込みしてください!"
                  console.log(mymsg);
                  alert(mymsg);
                };
                resolve(request);
                
            });
        } catch(err) {
            myconsolelog(`[error] Can not open IndexedDb[${dbname}] : ${error.code}:${error.message}`);
            reject(err);
        }
    });
    
}



function getKeysFromIndexedDb(dbname,storeName,indexName, sortindex_start ,sortindex_end , direction0=false ){
    return new Promise(async function(resolve, reject){
        
        myconsolelog(`[Info] required getKeys data from IndexedDB(${indexName}) : ${storeName} (${sortindex_start}-${sortindex_end}) in ${dbname}`);
        
        let strDirection="next";
        if(direction0) strDirection="prev";
        
        let transaction = await getTransactionOfIndexedDb(dbname,storeName);
        if(transaction===null){ //Error
            reject( null );
        }
        
        try{
            const objectStore=transaction.objectStore(storeName);
            const index = objectStore.index(indexName);
            const boundKeyRange = IDBKeyRange.bound(sortindex_start,sortindex_end , false, true);
            
            let ans = []; // 順番を保存したいので連想配列は不可
            
            index.openKeyCursor(boundKeyRange,strDirection).onsuccess = (event) => {
                const cursor = event.target.result;
                if (!cursor){
                    //myconsolelog("openCursor終了")
                    resolve(ans);
                } else {      // ( cursor.key  ,cursor.primaryKey) openCursorなら、cursor.value
                  
                  ans.push( [cursor.key , cursor.primaryKey] );
                  
                  cursor.continue();
                }
            };
            
            
        } catch(err) {
            myconsolelog(`[error] Can not get data from IndexedDb[${dbname}-${storeName}-${sortindex_start}～${sortindex_end}] : ${err.code}:${err.message}`);
            reject(err);
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
        DBOpenRequest.onsuccess = function(event) {
            
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
                        ans[storename] = objectStore.count;
                    }
                    resolve(ans);
                }
            }
            
        }
        
    });
}



//***********  Export ***************
export { putdataToIndexedDb , getdataFromIndexedDb,getKeysFromIndexedDb,removedataFromIndexedDb };

window.getdataFromIndexedDb = getdataFromIndexedDb;
window.indexedDB_countAll = indexedDB_countAll;
