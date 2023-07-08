// import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  
//        ,  reauthenticateWithCredential as firebase_reauthenticateWithCredential ,EmailAuthProvider as firebase_EmailAuthProvider } from "./FirebaseConfig.js";
// import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
//        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
//        , signOut as firebase_signOut 
//        ,sendEmailVerification as firebase_sendEmailVerification 
//        ,updatePassword as firebase_updatePassword, updateProfile as firebase_updateProfile    } from "./FirebaseConfig.js";

// import { rtdatabase as firebaseRTDB_database ,ref as firebaseRTDB_ref, set as firebaseRTDB_set , update as firebaseRTDB_update ,push as firebaseRTDB_push ,onValue as firebaseRTDB_onValue,onDisconnect as firebaseRTDB_onDisconnect  ,serverTimestamp as firebaseRTDB_serverTimestamp  } from "./FirebaseConfig.js";// ----------

import { firestoredatabase , fsdb_collection, fsdb_doc ,fsdb_getDoc , fsdb_onSnapshot , fsdb_query, fsdb_where, fsdb_getDocs ,fsdb_orderBy, fsdb_limit} from "./FirebaseConfig.js";
import { fsdb_enableIndexedDbPersistence , fsdb_getDocFromCache ,fsdb_getCountFromServer} from "./FirebaseConfig.js";
import { fsdb_setDoc, fsdb_addDoc, fsdb_updateDoc ,fsdb_deleteDoc ,fsdb_Timestamp,fsdb_serverTimestamp ,fsdb_runTransaction } from "./FirebaseConfig.js";
import { fsdb_startAt,fsdb_startAfter, fsdb_endBefore  } from "./FirebaseConfig.js";

import { putdataToIndexedDb , getdataFromIndexedDb ,getKeysFromIndexedDb , removedataFromIndexedDb ,transferDBPath } from "./myfunc_indexeddb.js";

import { getServerTimeFromRTDB } from "./myfunc_getlog.js";
import { myconsolelog ,createPromise_waitDeleteKey ,myTimestampToDate,myDateTimeFormat } from "./myfunc_common.js";



//*********** my variables ****************

const indexedDbName = "furutaniBBS";
const dataBlock_length=2;
const indexedDb_keyName_BlockAry ="BlockAry"; // {lastCheckTime:(datetime)}
const firestoreDb_colName_system =""; // cf)"/sys/system"
const firestoreDb_keyName_system ="_system";

const listenerAry={};  // firestoreのＤＢに対する、各ブロックごとのListenerRemove用関数 ★★
// listenerAry[refPath]={startPosition:ListenerRemoveFunction}  および  {"additional":ListenerRemoveFunction}
const listenerArySingleDoc={}; // 文書1つ単位でのリスナ設置のRemove用関数

const maxSortIndexAry={};  //   firestoreＤＢの指定パスにおける、現時点での[sort]列値の最大値。★★
// maxSortIndexAry[refPath]=number;

const getDataBlock_wait={};


//*********** main ****************


async function getDataFromFirestoreDb_singleDoc(refCollectionPath,docPrimaryKey , enforceFlg=false){
    //enforceFlg : indexDBを使わすfireStoreからデータを取得（リスナーも再設定しなおす）
    if(!refCollectionPath){ return null;}
    if(!docPrimaryKey){ return null;}
    
    myconsolelog(`[Info] required a firestore data(single) : ${docPrimaryKey}`);
    
    let refPath = refCollectionPath+"/"+docPrimaryKey;
    
    let idxDoc;
    let storedIndexeddbTime=0;
    if(!enforceFlg){
        //--- indexedDBから取得
        await createPromise_waitDeleteKey( getDataBlock_wait , refPath ,false ).catch((rejectinfo)=>{
            myconsolelog("[Warning] waitPromise-timeout : "+rejectinfo); }); // もし他のwaitが継続中なら、完了まで待機する
        
        idxDoc = await getdataFromIndexedDb_fs(indexedDbName,refCollectionPath, docPrimaryKey );
        if(idxDoc){if(idxDoc.storeTimeToIndexeddb){
            storedIndexeddbTime = idxDoc.storeTimeToIndexeddb;
        }}
    }
    
    // --- 既存リスナーを確認
    if(listenerArySingleDoc[refPath]){
        if(typeof (listenerArySingleDoc[refPath])=="function"){
            if(!enforceFlg){
                if(idxDoc){
                    return idxDoc; // indexedDBから取得したデータを返して終了
                }
            }
            
            // --- 既存リスナーを削除
            listenerArySingleDoc[refPath]();
            listenerArySingleDoc[refPath]=null;
            myconsolelog("[Info] fireStore singleDocリスナーを削除: "+refPath);
            
        }
    }
    
    // --- forestoreから Doc取得
    let waitPromise0 = createPromise_waitDeleteKey( getDataBlock_wait , refPath ).catch((rejectinfo)=>{
            myconsolelog("[Warning] waitPromise-timeout : "+rejectinfo); });  //indexedDBへのデータ登録完了を待機
    
    myconsolelog(`[Info] firestore SERVER access occured(singleDoc). ${refCollectionPath} ${docPrimaryKey}`);
    
    const tgtRefxx = fsdb_doc(firestoredatabase , refCollectionPath , docPrimaryKey);
    const docSnap = await fsdb_getDoc(tgtRefxx);
    if (!docSnap.exists()) {
        myconsolelog("[Error] fireStore singleDoc 指定の文書が取得できません : "+refPath);
        return false;
    }
    let tgtdoc = docSnap.data();
    
    
    // --- リスナーを設定する
    
    const tgtRef = fsdb_doc(firestoredatabase , refCollectionPath , docPrimaryKey);
    
    listenerArySingleDoc[refPath] = fsdb_onSnapshot(tgtRef,async function(Snapshot){
        let localshotflg = Snapshot.metadata.hasPendingWrites
        if( localshotflg ){
            myconsolelog("[Info] onSnapshot listener (hasPendingWrites) occured. : "+refPath);
        }else{
            myconsolelog("[event] onSnapshot listener (server) occured(single). : "+refPath);
            let newdoc = Snapshot.data();
            
            //--- indexedDBに退避
            
            let nowtime = new Date(getServerTimeFromRTDB());
            newdoc.storeTimeToIndexeddb=nowtime;
            await putdataToIndexedDb_fs(indexedDbName, refCollectionPath ,docPrimaryKey, newdoc , 1);
            
            delete getDataBlock_wait[refPath]; // indexedDBへのデータ登録処理の完了を通知する
            checkListenerListener(refCollectionPath,Snapshot);
        }
    });
    
    await waitPromise0.catch((rejectinfo)=>{ 
        myconsolelog("[Warning] waitPromise-timeout : "+rejectinfo); }); // indexedDBへのデータ登録処理完了を待機
    let newidxDoc = await getdataFromIndexedDb_fs(indexedDbName,refCollectionPath, docPrimaryKey );
    return newidxDoc;
}



async function getDataFromFirestoreDb(refPath , startpos,datalength  ){
    if(!refPath){ return null;}
    
    let incrim=1;
    let posMin=0;
    let posMax=-1; // 全件取得指定
    let cntpos=-1; //スタート位置(startpos=0)の1つ前=-1
    
    myconsolelog(`[Info] required firestore data : ${refPath}`);

        if(datalength>=0){
            incrim=1;
            posMin=startpos;
            posMax=startpos+datalength-1;
            if(posMin<0){if(posMax>=0 || datalength==0 ){ posMax=-1; }}
            cntpos=-1;//スタート位置(startpos=0)の1つ前=-1
        } else {
            incrim=-1;
            posMax=startpos;
            posMin=posMax+datalength+1;
            if(posMax>=0){if(posMin<0){ posMin=0; }}
            cntpos=0;//スタート位置(startpos=-1)の1つ前=0
        }



    //---
    let ans={};

        let param3 = await getDataBlock(refPath); // param3 = [blocknum,startPosition,endPosition]
        if(!param3){
            myconsolelog("[Error] firestoreからデータを取得できませんでした :getDataBlock "+refPath);
            return ans;
        }
        

        let PandK=transferDBPath([refPath,""]); // firestoreのpath⇒indexedDBのパスへの変換:
        
        //let dataary = await getKeysFromIndexedDb_fs(indexedDbName,PandK,param3[1],param3[2] , (incrim==-1) );
        let dataary = await getKeysFromIndexedDb_fs(indexedDbName,PandK, 0 , 999999 , (incrim==-1) );
        if(!dataary){
            myconsolelog("[Error] indexedDBからKey値データを取得できません："+refPath);
        } else {
        
            let indexDbObjectStoreName = PandK[0];
            
            if(dataary.length>0){ // 取れるデータがある
                for(let keys of dataary){
                    cntpos+=incrim;
                    if((cntpos>=posMin)&&( datalength==0||(cntpos<=posMax) )){ //ソート順に従い目的位置のデータを抽出
                        ans[cntpos] = await getdataFromIndexedDb_fs(indexedDbName,indexDbObjectStoreName, keys[1] ); 
                        if(!ans[cntpos]){
                            myconsolelog("[Error] indexedDBからデータを取得できません："+refPath+" - "+keys[1]);
                        }else{
                            ans[cntpos].primaryKey=keys[1];
                        }
                    }
                }
            }
        
        }
    
    return ans;
}


//*********** my functions ****************

//async function getDataBlock(refPath,requestSortIndexBlockNum0=-1 , blockModeFlg=true ){}  ★
async function getDataBlock( refPath ){ 

    //let blocknum; ★
    //let startPosition;
    //let endPosition;
    
    
    
        let additionalFlg=true;
        if(listenerAry){if(listenerAry[refPath]){
            additionalFlg = (typeof (listenerAry[refPath].removefunc)!="function");
        }}
        if(additionalFlg){ // additional(新ブロック)リスナの設定がまだされていない⇒初期化から実施する
            let flg=await init_getDataFromFirestore(refPath); 
            if(!flg){ return null; }
            
            // remakeAdditionalListener(refPath);
        }
        
    
    // -------------------------------------------
    let BlockListenerRemove = null;
    if(listenerAry[refPath]){
        BlockListenerRemove =listenerAry[refPath].removefunc;
    }
    if(typeof BlockListenerRemove=="function"){ // firestoreの変更をリッスン中。indexdbからデータ取得するべし。
        myconsolelog(`[Info] block [${refPath}] already stored by indexedDB.`);
        return (1);
    }
    
    // ---------------------------------------------
    //firestoreから取得する。
    
    let waitPromise = createPromise_waitDeleteKey( getDataBlock_wait , refPath,true,10 ).catch((rejectinfo)=>{
            myconsolelog("[Warning] waitPromise-timeout : "+rejectinfo); 
    }); //indexedDBへのデータ登録完了待機フラグを設置
    
    myconsolelog(`[Info] firestore SERVER access occured(block). ${refPath} `);
    
    //if(!listenerAry[refPath]) listenerAry[refPath]={}; // getDataFromFireStore_Block()関数内で listenerAry[refPath][startPosition] を設定する
    //getDataFromFireStore_Block(refPath,startPosition,endPosition); // 旧setDataBlockListener  ★
    
    
    remakeAdditionalListener(refPath);
    
    await waitPromise.catch(function(strinfo){ // getDataFromFireStore_Block()関数内でgetDataBlock_waitがクリアされるのを待機
        myconsolelog(`[Warning] indexedDBへの更新待機がtimeoutしました : ${strinfo}`);
    });
    
    // -----
    return (2);
}



async function init_getDataFromFirestore(refPath){   //  indexedDBのBlockAry文書を準備
    
    myconsolelog(`[Info] called : init_getDataFromFirestore()   ${refPath} `);
    
    await getServerTimeFromRTDB(false,true); // 時計のオフセット値(serverTimeOffsetFromRTDB)を初期化
    
    
    //--
    let BlockListenerRemove = null;
    if(listenerAry[refPath]){
        BlockListenerRemove =listenerAry[refPath].removefunc;
    }
    if(typeof BlockListenerRemove=="function"){ 
        let strvl = (listenerAry[refPath].datetime ? myDateTimeFormat(listenerAry[refPath].datetime) : "???");
        myconsolelog("[Warning] fireStore取得処理の新規データリスナー(additional)は、すでに設定されています : "+strvl+"～ "+refPath);
        return null
    }
    
    // -------
    let sepTime;
    let cngflg=0; // BlockAry更新Flg
    let limitsortAry= await getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry); //(dbname,storeName,key)
    if(!limitsortAry){
        limitsortAry={};     //  {lastCheckTime:(datetime)}
        cngflg=1;
    }else{
        sepTime = limitsortAry.lastCheckTime;
    }
    if(!sepTime){
        sepTime=0;
    }
    
    
    
    // =======================================
    let storedDataTimeIndexDb=new Date(0);
    const timetblAry=[];
    
    let PandK=transferDBPath([refPath,""]); // firestoreのpath⇒indexedDBのパスへの変換:
    let dataary = await getKeysFromIndexedDb_fs(indexedDbName,PandK, 0 , 999999 );
    if(!dataary){
        myconsolelog("[Error] indexedDBからKey値データを取得できません："+refPath);
    } else {
        let indexDbObjectStoreName = PandK[0];
        if(dataary.length>0){ // データがある
            for(let keys of dataary){  // keys[] : keys[0]=Indexキー([コード,Sort値]) , keys[1]=キー値
                const onedt = await getdataFromIndexedDb_fs(indexedDbName,indexDbObjectStoreName, keys[1] ); 
                let test = onedt.modified_sys;
                if(onedt.modified_sys){
                    const dttime = myTimestampToDate(onedt.modified_sys);
                    if(dttime > storedDataTimeIndexDb){
                        storedDataTimeIndexDb = dttime;
                    }
                    timetblAry.push( {key:keys[1],time:dttime} );
                }
            }
        }
        
    }
    
    // IndexedDBのストアデータ（storedDataTimeIndexDb以前）に、FireStoreとの差異が見つかれば更新する
    const basetime =  new Date(0);
    let ttlcnt=updateStoredIndexedDBData(  refPath , basetime , storedDataTimeIndexDb , timetblAry );
    
    limitsortAry.lastCheckTime = storedDataTimeIndexDb;
    cngflg=1;
    
    
    
    // =======================================

    
    // remakeAdditionalListener(refPath);
    
    if(cngflg){ // limitsortAry を indexedDBに保存
        await putdataToIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry , limitsortAry,true); 
    }
    
    return true;
}
function countInAry(ary,start,end){
    let ans=0;
    for (let i = 0; i < ary.length; i++){
        let dt=ary[i];
        if(dt.time){dt = dt.time;}
        if(dt>=start){if(dt<end){
            ans++;
        }}
    }
    return ans;
}

async function getCountOfDataOnFS(refPath ,starttime,endtime){
    
    // let starttime = (new Date(0));
    
    // ------ クエリ条件を作成 ------- 
    let queryWhereAry=[];
    queryWhereAry[0] = fsdb_orderBy("modified_sys","asc"); 
    queryWhereAry.push( fsdb_startAt(fsdb_Timestamp.fromDate( starttime )) ); 
    queryWhereAry.push( fsdb_endBefore(fsdb_Timestamp.fromDate( endtime )) ); 
    
    const tgtRef = fsdb_collection(firestoredatabase , refPath);
    let tgtquery = fsdb_query(tgtRef, ...queryWhereAry );
    
    //-----
    let ans;
    
    const qhCount = await fsdb_getCountFromServer(tgtquery);
    if(qhCount){
        const obj = qhCount.data();
        if(obj){
            ans = obj.count;
        }
    }
    
    return ans;
}
async function updateStoredIndexedDBData( refPath ,starttime , endtime ,countIndxAry){
    let ttlcnt = 0;
    const limitcnt=2; // 同時処理件数
    
    let fs_cnt = await getCountOfDataOnFS(refPath ,starttime , endtime ); // starttime <= x < endtime
    let idx_cnt = countInAry(countIndxAry,starttime , endtime);
    if(fs_cnt!=idx_cnt){ // IndexedDBのデータの更新が必要
        let flg=0;
        if(fs_cnt==0){
            flg=1;//削除
        }else{
            if(idx_cnt==0){
                flg=2;//取得
            }else{
                if((fs_cnt<=limitcnt)||(idx_cnt<=limitcnt)){
                    flg=3;//削除+取得
                }
            }
        }
        
        if(flg==0){
            const midtime = new Date( (starttime.getTime()+endtime.getTime())/2 );
            ttlcnt += await updateStoredIndexedDBData( refPath ,starttime , midtime ,countIndxAry);
            ttlcnt += await updateStoredIndexedDBData( refPath , midtime ,  endtime ,countIndxAry);
        }else{
           
            //IndexedDBから削除
            if((flg & 1)!=0){
                for(let i=0;i<countIndxAry.length;i++){
                    if(countIndxAry[i].time>=starttime){if(countIndxAry[i].time<endtime){
                        let delflg=1;
                        if(1==1){  //本当にFireStoreにはないのか確認
                            const tgtRef = fsdb_doc( firestoredatabase , refPath , countIndxAry[i].key );
                            const docSnap = await fsdb_getDoc(tgtRef);
                            if (docSnap.exists()) {
                                let tgtdoc = docSnap.data();
                                delflg=0;
                                myconsolelog("[Warning] Fix:Firestoreに文書があることを確認 : "+refPath+" "+ countIndxAry[i].key);
                                await putdataToIndexedDb_fs(indexedDbName,refPath, countIndxAry[i].key , tgtdoc ,true); 
                            }
                        }
                        if(delflg){
                            myconsolelog("[Warning] Fix:IndexedDBから文書を削除 : "+refPath+" "+ countIndxAry[i].key);
                            removedataFromIndexedDb_fs(indexedDbName,refPath, countIndxAry[i].key );
                        }
                        
                    }}
                }
                
            }
            //FireStoreからデータ取得
            if((flg & 2)!=0){
                ttlcnt = await restoreFromFBDBtoIndexedDB(refPath ,starttime , endtime);
            }
        }
    }
    return ttlcnt;
}

async function restoreFromFBDBtoIndexedDB(refPath ,starttime , endtime){
    // ------ 1回限り取得のクエリ条件を作成 -------
    let queryWhereAry=[];
    queryWhereAry[0] = fsdb_orderBy("modified_sys","asc");  // 範囲指定は1つの列しか対象にできない 
    queryWhereAry.push( fsdb_startAt(fsdb_Timestamp.fromDate( starttime )) ); 
    queryWhereAry.push( fsdb_endBefore(fsdb_Timestamp.fromDate( endtime )) ); 
    
    const tgtRef = fsdb_collection(firestoredatabase , refPath);
    let tgtquery = fsdb_query(tgtRef, ...queryWhereAry );
    
    //---
    myconsolelog(`[Info] fsdb-Request(Once)[${myDateTimeFormat(starttime)}～${myDateTimeFormat(endtime)}] : ${refPath}`);
    const querySnapshot = await fsdb_getDocs(tgtquery);
    let cnt = await fsdb_processSnapshot(querySnapshot);
    myconsolelog(`[Info] fsdb_onSnapshot(Once)→Stored(${cnt}) : ${refPath}`);
    
    //---
    checkListenerListener(refPath,querySnapshot);
    delete getDataBlock_wait[refPath+"_once"]; // 後続処理へのトリガ

    return cnt;
}


function fsdb_processSnapshot(querySnapshot){ // Firestoreから取得されたDocデータをIndexedDBに退避させる
    return new Promise( function(resolve,reject){
        
        let promiseAry = [];
        let existDocCnt=0;
        
        let refPath=""
        
        querySnapshot.docChanges().forEach((change) => {
            let tgtdoc=change.doc;
            let tgtpath = tgtdoc.ref.path;
            if( tgtdoc.metadata.hasPendingWrites ){
                myconsolelog("[Info] onSnapshot listener (hasPendingWrites) occured. : "+refPath);
            }else{
                let tgtparentPath = tgtpath.slice(0, 0-(tgtdoc.id.length)-1);
                myconsolelog("[event]firestore:detected["+change.type+"] : "+tgtpath);
                switch(change.type){
                    case "added":
                    case "modified":
                        promiseAry.push(
                            putdataToIndexedDb_fs(indexedDbName, tgtparentPath ,tgtdoc.id, tgtdoc.data(),1)
                        );
                        break;
                    case "removed":
                        promiseAry.push(
                            removedataFromIndexedDb_fs(indexedDbName, tgtparentPath ,  tgtdoc.id )
                        );
                        break;
                }
                if(!refPath)refPath=tgtparentPath;
                if(refPath!=tgtparentPath){
                    myconsolelog("[Warning]firestore-snapshot : found different path in same snapshot["+change.type+"] : "+tgtparentPath +"   "+ refPath);
                }
            }
        });
        if(promiseAry.length==0){
            resolve(0);
        }
        Promise.allSettled(promiseAry).then(async function(values){
            if(values.length>0){
                
                let nowServeTime= new Date( getServerTimeFromRTDB() );
                
                
                let limitsortAry= await getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry);
                if(!limitsortAry){
                    limitsortAry={};
                }
                
                let existDocFlg=0; // limitsortAryへの変更の有無
                let maxSortIndexFlg=0; // maxSortIndexAryへの変更の有無
                let lastModifiedTime=0;
                for(let res of values){
                    switch(res.status){
                        case "rejected":
                            let err = res.reason;
                            myconsolelog(`[Error] IndexedDB : try put : ${err.name} : ${err.message}`);
                            break;
                        case "fulfilled":
                            if(!res.value){break;}
                            
                            let docdata = res.value;
                            existDocCnt++;
                            
//                            let blocknum=null;
                            if(docdata){if(typeof docdata.sort == "number"){
//                                blocknum = ( docdata.sort/dataBlock_length )|0;
//                                let flg=true;
//                                do {
//                                    if(!limitsortAry[blocknum]){flg=false;
//                                    }else{
//                                        if(docdata.sort<limitsortAry[blocknum].startval){ blocknum--;
//                                        }else{
//                                            let nextstart=0;
//                                            if(limitsortAry[blocknum+1]){nextstart=limitsortAry[blocknum+1].startval;}
//                                            if(nextstart){
//                                                if(docdata.sort>=nextstart){blocknum++;
//                                                }else{flg=false;}
//                                            }else{ flg=false;
//                                            }
//                                        }
//                                    }
//                                } while(flg);

                                //--
                                if(typeof (maxSortIndexAry[refPath]) != "number"){
                                    maxSortIndexAry[refPath]=docdata.sort;
                                }
                                if(docdata.sort>maxSortIndexAry[refPath]){
                                    //maxSortIndexAry[refPath]=docdata.sort;
                                    //getMaxOfSortIndex(refPath,true); // maxSortIndexAry[refPath]を更新する
                                    maxSortIndexFlg=1;
                                }
                            }}
//                            if(!limitsortAry[blocknum]){
//                                limitsortAry[blocknum]={};
//                                limitsortAry[blocknum].startval = blocknum*dataBlock_length;
//                                existDocFlg++;
//                            }
                            
                            
                            let nowModTime = myTimestampToDate(docdata.modified_sys);
                            if(!nowModTime) nowModTime = nowServeTime;
                            let lastmod=0;
                            if(limitsortAry){
                                lastmod = limitsortAry.lastCheckTime;
                                if((!lastmod)||(nowModTime>lastmod)){
                                    limitsortAry.lastCheckTime = nowModTime;
                                    existDocFlg++;
                                }
                            }
                            break;
                    }
                }
                if(existDocFlg){ // limitsortAry を indexedDBに保存
                    await putdataToIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry , limitsortAry,true); 
                }
                if(maxSortIndexFlg){
                    getMaxOfSortIndex(refPath,true); // firestoreを検索して maxSortIndexAry[refPath]を更新する
                }
            }
            
            //delete getDataBlock_wait[refPath+"_"+startPosition.toString()];
            
        });
        
        resolve(existDocCnt);
    });
}







// 新規追加分の監視：新規追加があればリスナーは自動削除する
async function remakeAdditionalListener(refPath){
    if(listenerAry){
        if(listenerAry[refPath]){if(typeof (listenerAry[refPath].removefunc)=="function"){
            listenerAry[refPath].removefunc(); // リスナーを削除
            listenerAry[refPath].removefunc=null;
            myconsolelog("[Info] fireStore取得処理の新データリスナー(additional)を削除 : "+refPath);
        }}
    }else{
        listenerAry={};
    }
    
    if(!listenerAry[refPath])listenerAry[refPath]={};
    listenerAry[refPath].removefunc = await setAdditionalListener(refPath);
    
    if(listenerAry[refPath].removefunc){
        if(typeof (listenerAry[refPath].removefunc)=="function"){
            myconsolelog("[Info] fireStore取得処理の新データリスナー(additional)を設定 : "+refPath);
        }else{
            myconsolelog("[ERROR] fireStore取得処理の新データリスナー(additional)の設定が不正："+typeof (listenerAry[refPath].removefunc));
        }
    }
}
async function setAdditionalListener(refPath){ //返値は、リスナー解除関数
    
    // ---- 監視対象期限を調査
    let storedIndexeddbTime;
    let limitsortAry= await getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry); // limitsortAry = {lastCheckTime:(datetime)}
    if(limitsortAry){  if(limitsortAry.lastCheckTime){
            storedIndexeddbTime = limitsortAry.lastCheckTime;
    } }
    
    if(!storedIndexeddbTime){
        if(limitsortAry){
                myconsolelog(`[Warning] listener期限が${indexedDb_keyName_BlockAry}(IndexedDB)から取得できません : ${refPath}`);
        }else{
            myconsolelog(`[Warning] IndexedDBに ${indexedDb_keyName_BlockAry}が設定されていません : ${refPath}`);
        }
        // return null;
        
        //storedIndexeddbTime=getServerTimeFromRTDB()-100;
        storedIndexeddbTime=0;
    }
    
    myconsolelog(`[Info] Try set Additional-listener for fireStore data ${myDateTimeFormat(storedIndexeddbTime,2)} : ${refPath}`);
    
    
    
    // ------ リスナーのクエリ条件を作成 -------
    let queryWhereAry=[];
    queryWhereAry[0] = fsdb_orderBy("modified_sys","asc");  // 範囲指定は1つの列しか対象にできない 
    queryWhereAry.push( fsdb_startAfter(fsdb_Timestamp.fromDate(new Date(storedIndexeddbTime))) ); 
    //queryWhereAry.push( fsdb_where("modified_sys", ">", storedIndexeddbTime) );
    //    queryWhereAry.push( fsdb_orderBy("sort","asc") );
    //    queryWhereAry.push( fsdb_where("sort", ">=", startPosition) );
    
    const tgtRef = fsdb_collection(firestoredatabase , refPath);
    let tgtquery = fsdb_query(tgtRef, ...queryWhereAry );
    

    //ans=await getDataBlockFromFirestore(tgtquery);
    return fsdb_onSnapshot(tgtquery, async function(querySnapshot){
        
        myconsolelog(`[Info] fsdb_onSnapshot (AdditionalListener) : ${refPath}`);
        
        let cnt = await fsdb_processSnapshot(querySnapshot);
        
        if(cnt>(dataBlock_length)){ // 取得データ件数が制限値を超えるようなら、リスナを再作成する
            setTimeout( remakeAdditionalListener,100, refPath );
        }
        
        checkListenerListener(refPath,querySnapshot);
        
        delete getDataBlock_wait[refPath]; // 後続処理へのトリガ
        
    });
    
}


// -------- リスナーリスナー（firestoreからの通知によるindexedDBの更新があった場合に実行するcallback関数の設定）
let myListenerListenerAry={};
function setListenerListener(tgtPath,callbackFunc=""){
    delete myListenerListenerAry[tgtPath];
    if(typeof callbackFunc == "function"){
        myListenerListenerAry[tgtPath] = callbackFunc;
    }
}

function checkListenerListener(tgtpath,Snapshot){
    const callbackFunc = myListenerListenerAry[tgtpath];
    if(typeof callbackFunc == "function"){
        let flg=0;
        //Snapshot.docChanges().forEach((change) => { let tgtdoc=change.doc;
        for (const tgtdoc of Snapshot.docs){
            if( !tgtdoc.metadata.hasPendingWrites ){
                if( tgtpath == tgtdoc.ref.path)flg=1;
                if( tgtpath == tgtdoc.ref.parent.path)flg=1;
            }
        }
        if(flg){
            callbackFunc(Snapshot);
        }
    }
}



// --------




async function getMaxOfSortIndex_recalc(refPath){
    let ans=null;
    
    myconsolelog("[Info] try re-calc MaxOfSortIndex : "+refPath);
    
    try {
        const tgtRef = fsdb_collection(firestoredatabase , refPath);
        
        let tgtquery = fsdb_query(tgtRef, fsdb_orderBy("sort","desc"), fsdb_limit(1) );
        
        let querySnapshot = await fsdb_getDocs(tgtquery);
        querySnapshot.forEach(function(doc){
            ans = doc.data().sort;
        });
        myconsolelog(`[Info] fireStore : getMaxOfSortIndex=${ans} in ${refPath}`);
    } catch (e) {
        myconsolelog("Error at getting Max-sort-index document:"+ e);
    }
    
    return ans;
}

async function getMaxOfSortIndex(refCollectionPath ,forceFlg=false){

    const refPath=refCollectionPath + firestoreDb_colName_system;
    
    let sysval=0;
    let newval=0;
    
    let sysdoc = await getDataFromFirestoreDb_singleDoc(refPath , firestoreDb_keyName_system );
    if(sysdoc){
        if(sysdoc.sortIndex_Max){
            sysval = sysdoc.sortIndex_Max;
        }
    }else{
        sysdoc = await createSystemDoc(refCollectionPath);
        if(!sysdoc){
            myconsolelog("[Error] fireStore getMaxOfSortIndex取得に失敗 : "+refPath);
        }else{
            sysval = sysdoc.sortIndex_Max;
            newval=sysval; // createSystemDoc()内でgetMaxOfSortIndex_recalc()が実行されている
        }
    }
    
    //---
    if(forceFlg){if(!newval){
        newval = await getMaxOfSortIndex_recalc(refPath);
        if(!newval){
            myconsolelog("[Error] fireStore getMaxOfSortIndex取得に失敗 : "+refPath);
            newval=0;
        }
    }}
    //-------------------
    let maxval = newval;
    if(sysval>maxval)maxval=sysval;
    if((!maxSortIndexAry[refCollectionPath]) || (maxval>maxSortIndexAry[refCollectionPath])){
            maxSortIndexAry[refCollectionPath] = maxval;
    }
    
    // -----
    if(newval){if(maxval!=sysval){
        updateDataOnFirestore( refPath , firestoreDb_keyName_system , {sortIndex_Max:maxval} );
    }}
    
    
    
    return maxSortIndexAry[refCollectionPath];
}

async function createSystemDoc(refPath){ // refPath はcollectionパスで指定
        
        //--- systemパラメータを取得
        let docdata={};
        let sortIndexMax = await getMaxOfSortIndex_recalc(refPath);
        if(!sortIndexMax) sortIndexMax=0;
        docdata.sortIndex_Max = sortIndexMax;
        
        
        addDataToFirestore( refPath + firestoreDb_colName_system , docdata , firestoreDb_keyName_system);
        
        return docdata;
}




async function createNewSortIndex(refPath){
    let NewSortIndex=-1;
    myconsolelog("[Info] try createNewSortIndex to firestore : "+refPath);
    
    const tgtRef = fsdb_doc(firestoredatabase , refPath+firestoreDb_colName_system,firestoreDb_keyName_system);
    try {
        NewSortIndex = await fsdb_runTransaction(firestoredatabase, async function(transaction){
            const sfDoc = await transaction.get(tgtRef);
            if (!sfDoc.exists()) {
                return Promise.reject(-1);
            }
            
            let oldIndex = sfDoc.data().sortIndex_Max;
            let newIndex = (oldIndex+1)|0;
            
            transaction.update(tgtRef, { sortIndex_Max: newIndex });
            return newIndex
        }).catch(async function(rejectParam){
            let docdata = await createSystemDoc(refPath);
            if(docdata){if(typeof docdata.sortIndex_Max =="number"){
                return docdata.sortIndex_Max;
            }}
            return rejectParam
        });
        if((!NewSortIndex)||(NewSortIndex<0)){
            NewSortIndex=0;
        }
        myconsolelog(`[Info] fireStore SortIndex update to ${NewSortIndex} : ${refPath}`);
    } catch (err) {
        myconsolelog(`[Error] fireStore SortIndex update : ${refPath} : ${err}`);
    }
    
    return NewSortIndex;
}




function putdataToIndexedDb_fs(iDbName, refColPath ,refKey, tgtdoc , overwritableFlg){
    let PandK=transferDBPath([refColPath,refKey]);
    if(PandK.length>=3){if(typeof PandK[2]=="string"){
        tgtdoc.sortIndex = PandK[2];
        if(PandK[3]){if(PandK[3]!="sort"){ tgtdoc.sort = tgtdoc[PandK[3]]; }}
        if( !tgtdoc.sort )  tgtdoc.sort=0;
    }}

    if(tgtdoc.modified){tgtdoc.modified = myTimestampToDate(tgtdoc.modified);}
    if(tgtdoc.modified_sys){tgtdoc.modified_sys = myTimestampToDate(tgtdoc.modified_sys);}
    if(tgtdoc.created){tgtdoc.created = myTimestampToDate(tgtdoc.created);}

    let retdoc=putdataToIndexedDb(iDbName, PandK[0] ,PandK[1], tgtdoc , overwritableFlg);
    //if(retdoc)retdoc.path=refColPath;
    return retdoc;
}
function getdataFromIndexedDb_fs(iDbName,refColPath,refKey){
    let PandK=transferDBPath([refColPath,refKey]);
    return getdataFromIndexedDb(iDbName,PandK[0],PandK[1]);
}
function removedataFromIndexedDb_fs(iDbName,refColPath,refKey){
    let PandK=transferDBPath([refColPath,refKey]);
    return removedataFromIndexedDb(iDbName,PandK[0],PandK[1]);
}
function getKeysFromIndexedDb_fs(iDbName,PandK,rangeStart,rangeEnd0,directionFlg , blockModeFlg=true ){
    let indxdb_IndxKey1 = PandK[2];
    if(indxdb_IndxKey1==null) indxdb_IndxKey1="";
    const rangeEnd = (null==rangeEnd0)?(rangeStart+0.01):(rangeEnd0?rangeEnd0:0);
    if(rangeStart>=rangeEnd){
        myconsolelog(`[Warning] abandon to execute 'getKeysFromIndexedDb': The key is not valid. ${rangeStart}～${(rangeEnd?rangeEnd:"?")}`);
        return([]);
    }
    if(blockModeFlg){
        return getKeysFromIndexedDb(iDbName,PandK[0],"sortIndex" ,[indxdb_IndxKey1,rangeStart],[indxdb_IndxKey1,rangeEnd],directionFlg);
    }else{
        return getKeysFromIndexedDb(iDbName,PandK[0],"" ,(PandK[1]+"/"),(PandK[1]+"0"),directionFlg , [PandK[1]+"/"+indexedDb_keyName_BlockAry] );  // "0"は"/"の次 
    }
}




//---------- 
    
async function addDataToFirestore(refPath , orgdata , docId=""){ 
        // 以下のField値はここで定義：｛modified_sys,modified,created｝+ (docId=""の場合)｛ownerids,sort｝
        // docIdが文字列である場合は、作成するDocのIDに適用する。文字列でないor""であれば、IDは自動生成する
        // docId=""の場合、orgdata に{ownerids,sort}が無い場合は自動作成する。（不要な場合はdocID=null等にすること）
    //const pathAry = refPath.split('/');
    //const splitpath = pathAry.slice(0,pathAry.length-1).join("/");
    //const pathflg = pathAry.length %2; // (pathflg?"odd":"even")
    
    myconsolelog("[Info] try add to firestore : "+refPath);
    

    //---
    if(docId==""){
        if(!orgdata.sort){
            orgdata.sort = await createNewSortIndex(refPath);
        }
        if(!orgdata.ownerids){
            const loginUser = window.parent.fb_getLoginUser();
            orgdata.ownerids = [loginUser.email.toString()];
        }
    }
    if(orgdata.ownerids){
        orgdata.ownerids = [ ...(orgdata.ownerids) ];
    }

    orgdata.modified_sys = fsdb_serverTimestamp();
    orgdata.modified = fsdb_serverTimestamp();
    orgdata.created = fsdb_serverTimestamp();
    
    // ---送信用オブジェクト（単純な連想配列オブジェクトであることが必要)
    //let tgtdata={}; for (const [key, value] of Object.entries(orgdata)) { tgtdata[key] = value; }
    //let tgtdata = Object.assign({}, orgdata);
    
    // ---
    
    let tgtdata = { ...orgdata };
    
    try {
        if(docId){
            const docRef = fsdb_doc( firestoredatabase , refPath , docId );
            const ref01 = await fsdb_setDoc( docRef , tgtdata );
            return docRef;
        }else{
            const tgtColRef = fsdb_collection(firestoredatabase , refPath);
            const docRef= await fsdb_addDoc(tgtColRef, tgtdata ); // docrefを返す
            return docRef;
        }
    } catch (e) {
        myconsolelog("[Error] cannot add documents : "+ e);
        setTimeout( function(){throw e;} );
        return null;
    }
}
async function updateDataOnFirestore(refPath ,dockey , orgdata ,modifiedTimeFlg=true){
    myconsolelog("[Info] try update to firestore : "+refPath+" "+dockey);
    
    // ---送信用オブジェクト（単純な連想配列オブジェクトであることが必要）
    let submitAry = {};
    for (let key in orgdata) {
        if(Array.isArray(orgdata[key])){ // array は custom object では firestoreに登録できない。 pure JavaScript objects である必要がある。
            submitAry[key] = [ ...(orgdata[key]) ];
        }else{
            submitAry[key] = orgdata[key];
        }
    }
    // --- 更新日時の設定
    submitAry.modified_sys = fsdb_serverTimestamp();
    if(modifiedTimeFlg){
        submitAry.modified = fsdb_serverTimestamp();
    }
    //--- 送信
    const tgtRef = fsdb_doc(firestoredatabase , refPath,dockey);
    try {
        const updoc_prm=fsdb_updateDoc(tgtRef, submitAry );
        const updtflg = await updoc_prm;
        return (updtflg ? updtflg : "ok");
    } catch (e) {
        myconsolelog("[Error] cannot update documents : "+ e);
        setTimeout( function(){throw e;} );
        return null;
    }
}


async function deleteDataOnFirestore(refPath ,dockey){
    myconsolelog("[Info] try to send Information for delete firestore-data : "+refPath+" "+dockey);
    
    await updateDataOnFirestore(refPath ,dockey , {sort:"delete"} );
    deleteDataOnFirestore_sub(refPath ,dockey);
}
async function deleteDataOnFirestore_sub(refPath ,dockey){
    myconsolelog("[Info] try to delete on firestore : "+refPath+" "+dockey);
    
    const tgtRef = fsdb_doc(firestoredatabase , refPath,dockey);
    try {
        return fsdb_deleteDoc(tgtRef);
    } catch (e) {
        myconsolelog("[Error] cannot delete documents : "+ e);
        setTimeout( function(){throw e;} );
        return null;
    }
}


// --- 以下、廃止--------


//=============================================
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
            let myPromise = setDataBlockListener("BulletinBoardList/BBS01/threadList",-1.2);
            let posAry = await myPromise; 
            let i=0;
        })();
        break;
      
      case "waitFunc":
        return createPromise_waitDeleteKey;
        break;
      default:
        alert("?");
    }
}

//***********  Export ***************
window.fb_getDataFromFirestoreDb = getDataFromFirestoreDb;
window.fb_getDataFromFirestoreDb_singleDoc =getDataFromFirestoreDb_singleDoc;
window.fb_addDataToFirestore = addDataToFirestore;
window.fb_updateDataOnFirestore = updateDataOnFirestore;
window.fb_deleteDataOnFirestore = deleteDataOnFirestore;
window.fb_getMaxOfSortIndex = getMaxOfSortIndex;
window.fb_setListenerListener = setListenerListener;
//---
window.fb_fs_mytest_firestore = mytest;
// export { mytest01 };
