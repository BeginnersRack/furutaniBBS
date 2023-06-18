// import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  
//        ,  reauthenticateWithCredential as firebase_reauthenticateWithCredential ,EmailAuthProvider as firebase_EmailAuthProvider } from "./FirebaseConfig.js";
// import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
//        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
//        , signOut as firebase_signOut 
//        ,sendEmailVerification as firebase_sendEmailVerification 
//        ,updatePassword as firebase_updatePassword, updateProfile as firebase_updateProfile    } from "./FirebaseConfig.js";

// import { rtdatabase as firebaseRTDB_database ,ref as firebaseRTDB_ref, set as firebaseRTDB_set , update as firebaseRTDB_update ,push as firebaseRTDB_push ,onValue as firebaseRTDB_onValue,onDisconnect as firebaseRTDB_onDisconnect  ,serverTimestamp as firebaseRTDB_serverTimestamp  } from "./FirebaseConfig.js";// ----------

import { firestoredatabase , fsdb_collection, fsdb_doc ,fsdb_getDoc , fsdb_onSnapshot , fsdb_query, fsdb_where, fsdb_getDocs ,fsdb_orderBy, fsdb_limit} from "./FirebaseConfig.js";
import { fsdb_enableIndexedDbPersistence , fsdb_getDocFromCache } from "./FirebaseConfig.js";
import { fsdb_setDoc, fsdb_addDoc, fsdb_updateDoc ,fsdb_deleteDoc ,fsdb_Timestamp,fsdb_startAfter,fsdb_serverTimestamp ,fsdb_runTransaction } from "./FirebaseConfig.js";

import { putdataToIndexedDb , getdataFromIndexedDb ,getKeysFromIndexedDb , removedataFromIndexedDb ,transferDBPath } from "./myfunc_indexeddb.js";

import { getServerTimeFromRTDB } from "./myfunc_getlog.js";
import { myconsolelog ,createPromise_waitDeleteKey ,myTimestampToDate } from "./myfunc_common.js";



//*********** my variables ****************

const indexedDbName = "furutaniBBS";
const dataBlock_length=2;
const indexedDb_keyName_BlockAry ="BlockAry"; // {startval:0,lastmodified:(datetime)}の配列。startvalはDBのsort値
const firestoreDb_colName_system =""; // cf)"/sys/system"
const firestoreDb_keyName_system ="_system";

const listenerAry={};  // firestoreのＤＢに対する、各ブロックごとのListenerRemove用関数
// listenerAry[refPath]={startPosition:ListenerRemoveFunction}  および  {"additional":ListenerRemoveFunction}
const listenerArySingleDoc={}; // 文書1つ単位でのリスナ設置のRemove用関数

const maxSortIndexAry={};  //   firestoreＤＢの指定パスにおける、現時点での[sort]列値の最大値。
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



async function getDataFromFirestoreDb(refPath , startpos,datalength , blockModeFlg=true ){
    if(!refPath){ return null;}
    //if(!datalength){ return null;}
    
    let posMin;
    let posMax;
    let incrim=0;
    let cntBlock=0;
    let cntpos;
    if(blockModeFlg){
        if(datalength>=0){
            incrim=1;
            cntBlock=0;
            posMin=startpos;
            posMax=startpos+datalength-1;
            if(posMin<0){if(posMax>=0 || datalength==0 ){ posMax=-1; }}
            cntpos=-1;//スタート位置(startpos=0)の1つ前=-1
        } else {
            incrim=-1;
            cntBlock=-1;
            posMax=startpos;
            posMin=posMax+datalength+1;
            if(posMax>=0){if(posMin<0){ posMin=0; }}
            cntpos=0;//スタート位置(startpos=-1)の1つ前=0
        }
        
        myconsolelog(`[Info] required firestore data ( ${posMin} ～ ${posMax} ) : ${refPath}`);
        
        getMaxOfSortIndex(refPath); // maxSortIndexAry[]を更新
    }else{
        myconsolelog(`[Info] required firestore data (No BlockMode): ${refPath}`);
            incrim=1;
            cntBlock=0;
            posMin=0;
            posMax=-1;
            cntpos=-1;//スタート位置(startpos=0)の1つ前=-1
    }
    //---
    let ans={};
    
    let cntBlock_bk=null;
    let continueFlg=1;
    do{
        let param3 = await getDataBlock(refPath,cntBlock,blockModeFlg); // param3 = [blocknum,startPosition,endPosition]
        if(!param3){
            myconsolelog("[Error] firestoreからデータを取得できませんでした : "+cntBlock.toString()+" "+refPath);
            return ans;
        }
        
        if(cntBlock_bk==param3[0]){
            continueFlg=0;
        }else{
            let PandK=transferDBPath([refPath,""]); // firestoreのpath⇒indexedDBのパスへの変換:
            cntBlock=param3[0];
            let dataary = await getKeysFromIndexedDb_fs(indexedDbName,PandK,param3[1],param3[2] , (incrim==-1) ,blockModeFlg );
            if(!dataary){
                myconsolelog("[Error] indexedDBからKey値データを取得できません："+refPath);
                continueFlg=0;
            } else {
                //if(!blockModeFlg){ dataary = dataary.filter(item => (Array.isArray(item) && item[0]!=(PandK[1]+"/"+indexedDb_keyName_BlockAry)) ); }
                
                let indexDbObjectStoreName = PandK[0];
                
                if(dataary.length==0){
                    let maxIndx=maxSortIndexAry[refPath]; // let maxIndx=await getMaxOfSortIndex(refPath); //
                    if(maxIndx<param3[2]){ // let endPosition=param3[2]
                        continueFlg=0;
                    }
                }else{
                    for(let keys of dataary){
                        cntpos+=incrim;
                        if((cntpos>=posMin)&&(cntpos<=posMax)){    //   (cntpos<=posMax)||(posMax<0)
                            ans[cntpos] = await getdataFromIndexedDb_fs(indexedDbName,indexDbObjectStoreName, keys[1] ); 
                            if(!ans[cntpos]){
                                myconsolelog("[Error] indexedDBからデータを取得できません："+refPath+" - "+keys[1]);
                                //continueFlg=0; // no data?
                            }else{
                                ans[cntpos].primaryKey=keys[1];
                            }
                        }
                    }
                }
            }
            if(continueFlg){
                let needNextFlg = (incrim==1)?(cntpos<=posMax):(cntpos>=posMin);  //  (cntpos<=posMax)||(posMax<0)
                if(needNextFlg){
                    cntBlock_bk=cntBlock;
                    cntBlock+=incrim;
                    if(cntBlock<0)continueFlg=0;
                }else{
                    continueFlg=0;
                }
            }
        }
    } while (continueFlg);
    
    return ans;
}


//*********** my functions ****************

async function getDataBlock(refPath,requestSortIndexBlockNum0=-1 , blockModeFlg=true ){ 

    let blocknum;
    let startPosition;
    let endPosition;
    if(blockModeFlg){
        let additionalFlg=true;
        if(listenerAry){if(listenerAry[refPath]){additionalFlg = (typeof (listenerAry[refPath].additional)!="function");}}
        if(additionalFlg){ // additional(新ブロック)リスナの設定がまだされていない⇒初期化から実施する
            let flg=await init_getDataFromFirestore(refPath); 
            if(!flg){ return null; }
            
            remakeAdditionalListener(refPath);
        }
        
        // ブロック境界データの取得
        let limitsortAryPromise = getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry); //(dbname,storeName,key)
        
        let maxIndx=maxSortIndexAry[refPath]; // 現時点でのsort値の最大値を取得する
        if(typeof maxIndx != "number"){
                //let allLength=getDataCount(refPath);
                maxIndx = await getMaxOfSortIndex(refPath);
                if(typeof maxIndx =="number"){
                    maxSortIndexAry[refPath] = maxIndx;
                    myconsolelog("[Info] sort値の現時点最大値をfirestore(SERVER)から取得："+maxIndx.toString() );
                }else{
                    myconsolelog("[Error] sort値の現時点最大値をfirestoreから取得できませんでした : "+refPath);
                }
        }
        if(typeof maxIndx != "number"){ 
            myconsolelog("[Error] cannot get maxIndx or maxSortIndexAry");
            return null; 
        }
        let maxBlockNum = (((maxIndx)/dataBlock_length) | 0); 
        
        
        // blocknum = ((requestSortIndex/dataBlock_length) | 0); // 取得対象となるブロックの個数目。先頭が0個目。
        let requestSortIndexBlockNum=(requestSortIndexBlockNum0 | 0); //小数点以下切捨
        blocknum=requestSortIndexBlockNum;
        if(requestSortIndexBlockNum<0){ // 後ろから数える
            blocknum = requestSortIndexBlockNum+maxIndx+1;
            if(blocknum<0)blocknum=0;
        }
        if(blocknum>maxBlockNum)blocknum=maxBlockNum;
        
        startPosition = blocknum * dataBlock_length;
        endPosition = startPosition+dataBlock_length;
        
    //    for(let i=limitsortAry.length;i<=blocknum;i++){
    //        limitsortAry[i]={startval:i * dataBlock_length,lastmodified:0};
    //    }
        
        // --
        
        myconsolelog(`[Info] required firestore data : block ${blocknum} (sortIndex ${startPosition} ～ ${endPosition})`);
        
        // --
        let fixedFlg=false;
        let limitsortAry = await limitsortAryPromise; // ブロック境界データの取得
        if(limitsortAry){ if(limitsortAry[blocknum]){
            fixedFlg = limitsortAry[blocknum].fixed; // 実装なし
            if(limitsortAry[blocknum].lastmodified){
                 let blocklastModified = limitsortAry[blocknum].lastmodified;
            }
        }}
        if(fixedFlg){  // indexdbにデータあるならばそこから取得するべし。
            myconsolelog(`[Info] block ${blocknum} already Fixed by indexedDB.`);
            return ([blocknum,startPosition,endPosition]);
        }
        
    }else{
        startPosition=0;
        endPosition=null;
        blocknum =0;
    }
    
    // -------------------------------------------
    let BlockListenerRemove = null;
    if(listenerAry[refPath]){
        BlockListenerRemove =listenerAry[refPath][startPosition];
    }
    if(typeof BlockListenerRemove=="function"){ // firestoreの変更をリッスン中。indexdbからデータ取得するべし。
        myconsolelog(`[Info] block ${blocknum}(${startPosition}<= (sort) <${endPosition}) already stored by indexedDB.`);
        return ([blocknum,startPosition,endPosition]);
    }
    
    // ---------------------------------------------
    //firestoreから取得する。
    
    let waitPromise = createPromise_waitDeleteKey( getDataBlock_wait , refPath+"_"+startPosition.toString(),true,10 ).catch((rejectinfo)=>{
            myconsolelog("[Warning] waitPromise-timeout : "+rejectinfo); }); //indexedDBへのデータ登録完了待機フラグを設置
    myconsolelog(`[Info] firestore SERVER access occured(block). ${refPath} (${startPosition}～${endPosition})`);
    
    if(!listenerAry[refPath]) listenerAry[refPath]={}; // getDataFromFireStore_Block()関数内で listenerAry[refPath][startPosition] を設定する
    getDataFromFireStore_Block(refPath,startPosition,endPosition); // 旧setDataBlockListener
    
    await waitPromise.catch(function(strinfo){
        myconsolelog(`[Warning] indexedDBへの更新待機がtimeoutしました : ${strinfo}`);
    });
    
    // -----
    return ([blocknum,startPosition,endPosition]);
}



async function init_getDataFromFirestore(refPath){ 
    
    myconsolelog(`[Info] called : init_getDataFromFirestore()   ${refPath} `);
    
    await getServerTimeFromRTDB(false,true); // 時計のオフセット値(serverTimeOffsetFromRTDB)を初期化
    
    let maxIndx=maxSortIndexAry[refPath]; // 現時点でのsort値の最大値を取得する
    if(typeof maxIndx != "number"){
            maxIndx = await getMaxOfSortIndex(refPath);
            if(typeof maxIndx =="number"){
                maxSortIndexAry[refPath] = maxIndx;
                myconsolelog("[Info] sort値の現時点最大値をfirestoreから取得："+maxIndx.toString() );
            }else{
                myconsolelog("[Error] sort値の現時点最大値をfirestoreから取得できませんでした : "+refPath);
            }
    }
    if(typeof maxIndx != "number"){ 
            myconsolelog("[Error] cannot get maxIndx or maxSortIndexAry");
            return null; 
    }
    
    // 現時点での最後(最新)のブロックの、次のブロックを用意する。
    let blocknum = ((maxIndx/dataBlock_length) | 0)+1; // 対象となるブロックの個数目。先頭が0個目。
    let startPosition = blocknum * dataBlock_length;
    let endPosition = startPosition+dataBlock_length;
    
    
    //--
    let BlockListenerRemove = null;
    if(listenerAry[refPath]){
        BlockListenerRemove =listenerAry[refPath].additional;
    }
    if(typeof BlockListenerRemove=="function"){ 
        myconsolelog("[Warning] fireStore取得処理の新ブロックリスナー(additional)は、すでに設定されています : "+startPosition.toString()+" "+refPath);
        return null
    }
    
    // -------
    let pathary=refPath.split("/");
    
    let cngflg=0;
    let limitsortAry= await getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry); //(dbname,storeName,key)
     // {startval:0,lastmodified:(datetime)}の配列。
     // 各ブロックの境界値。Ary[0]は最初のブロックの最前値。lastmodifiedはこのブロックのデータの最後の確認日時を記録。
     // indexdbに保管し取得する。：
    if(!limitsortAry){
        limitsortAry=[];
      //limitsortAry[0]={startval:0,lastmodified:0,fixed=false};
        cngflg=1;
    }
//    let orgary={};
//    for(let i=limitsortAry.length-1;i>=0;i--){
//        orgary[i]=limitsortAry[i].fixed;
//    }
    // ---
//    if(pathary.length==3){  // [BulletinBoardList/BBS01/threadList]はFixさせない：常に最新を取得する
//        for(let i=orgary.length-1;i>=0;i--){
//            orgary[i]=false;
//        }
//    }else{
//        for(let i=blocknum-2;i>=0;i--){
//            orgary[i]=true;
//        }
//    }
    // ---
//    for(let i=limitsortAry.length-1;i>=0;i--){
//        if(orgary[i] != limitsortAry[i].fixed) cngflg=1;
//    }
    if(cngflg){
        await putdataToIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry , limitsortAry,true); // limitsortAry を indexedDBに保存
    }
    
    // ---------------------------------------------
    // 新ブロック発生時の処理(リスナー)を作成する。
    
    //    //listenerAry[refPath].additional = setDataBlockListener(refPath,startPosition,null);
    //await remakeAdditionalListener(refPath)
    
    //----------
    

    return true;
}













async function getDataFromFireStore_Block(refPath,startPosition,endPosition0=0 ){ //返値：なし
    let blockModeFlg=true;
    let endPosition=0;
    if(typeof endPosition0 == "number"){ 
        endPosition = endPosition0;
        if(endPosition==0) endPosition = startPosition + dataBlock_length;
    }else{ // endPosition0 にNullが指定されていた場合はBlock処理しない
        blockModeFlg=false;
    }
    
    let storedIndexeddbTime;
    let storedIndexeddbFixed;
    if(blockModeFlg){
          // ブロック境界データの取得
        let limitsortAry= await getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry); //(dbname,storeName,key)
          // {startval:0,lastmodified:(datetime)}の配列。
          // 各ブロックの境界値。Ary[0]は最初のブロックの最前値。lastmodifiedはこのブロックのデータの最後の確認日時を記録。
          // indexdbに保管し取得する。
        if(limitsortAry){
            let blocknum=-1;
            for (let i of Object.keys(limitsortAry)){
                if(limitsortAry[i].startval==startPosition) {
                    blocknum=i;
                    storedIndexeddbTime=limitsortAry[i].lastmodified;
                    storedIndexeddbFixed = limitsortAry[i].fixed; //現時点では未定義。
                    //storedIndexeddbFixed = true;
                    break;
                }
            }
        }
    }
    if(!storedIndexeddbTime){storedIndexeddbTime=0;}
    
    if(storedIndexeddbFixed){
        myconsolelog(`[Info] canceled getting fireStore data from SERVER : Fixed`
                +` (${startPosition}-${endPosition?endPosition:""}) : ${refPath}`);
        delete getDataBlock_wait[refPath+"_"+startPosition.toString()];
        return null;
    }
    
    
    
    myconsolelog(`[Info] now getting BlockData from fireStore(SERVER) : `
                +`sortIndex (${startPosition}-${endPosition?endPosition:""}) : ${myDateTimeFormat(storedIndexeddbTime,4)} : ${refPath}`);
    
    
    
    // ------ クエリの条件を作成 -------
    let queryWhereAry=[];
    //queryWhereAry[0] = fsdb_orderBy("sort","asc");
    if(blockModeFlg){
        queryWhereAry.push( fsdb_orderBy("sort","asc") );
        queryWhereAry.push( fsdb_where("sort", ">=", startPosition) );
        if(endPosition){ queryWhereAry.push( fsdb_where("sort", "<", endPosition) ); }
    }
    //if(storedIndexeddbTime){ queryWhereAry.push( fsdb_where("modified_sys", ">", storedIndexeddbTime) ); } // 範囲指定は1つの列しか対象にできない
    
    const tgtRef = fsdb_collection(firestoredatabase , refPath);
    let tgtquery = fsdb_query(tgtRef, ...queryWhereAry );
    
    
    // ------- クエリ実行 ------
    
    //ans=await getDataBlockFromFirestore(tgtquery);
    try {
        //myconsolelog(`[Info] request fsdb_onSnapshot Block(${startPosition}～) : ${refPath}`);
        
        //const querySnapshot = await fsdb_getDocs(tgtquery);
        listenerAry[refPath][startPosition] = fsdb_onSnapshot( tgtquery , async function(Snapshot){ // リスナ設定
            let localshotflg = Snapshot.metadata.hasPendingWrites;
            if( localshotflg ){
                myconsolelog("[Info] onSnapshot listener (hasPendingWrites) occured. : "+refPath+"("+(startPosition.toString())+")");
            }else{
                let cnt = await fsdb_processSnapshot(Snapshot); // IndexedDBに退避     
                myconsolelog("[event] onSnapshot listener (server) occured(Block). : "+refPath+"("+(startPosition.toString())+") count="+(cnt?cnt.toString():"") );
                delete getDataBlock_wait[refPath+"_"+startPosition.toString()]; // 後続処理へのトリガ
                checkListenerListener(refPath,Snapshot);
            }
        });
        myconsolelog(`[Info] requested fsdb_onSnapshot Block(${startPosition}～) : ${refPath}`);
    } catch (e) {
        myconsolelog("[Error] cannot get documents : "+ e);
    }
    
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
                            
                            let blocknum=null;
                            if(docdata){if(typeof docdata.sort == "number"){
                                blocknum = ( docdata.sort/dataBlock_length )|0;
                                let flg=true;
                                do {
                                    if(!limitsortAry[blocknum]){flg=false;
                                    }else{
                                        if(docdata.sort<limitsortAry[blocknum].startval){ blocknum--;
                                        }else{
                                            let nextstart=0;
                                            if(limitsortAry[blocknum+1]){nextstart=limitsortAry[blocknum+1].startval;}
                                            if(nextstart){
                                                if(docdata.sort>=nextstart){blocknum++;
                                                }else{flg=false;}
                                            }else{ flg=false;
                                            }
                                        }
                                    }
                                } while(flg);
                                //--
                                if(typeof (maxSortIndexAry[refPath]) != "number"){
                                    maxSortIndexAry[refPath]=docdata.sort;
                                }
                                if(docdata.sort>maxSortIndexAry[refPath]){
                                    //maxSortIndexAry[refPath]=docdata.sort;
                                    getMaxOfSortIndex(refPath,true); // maxSortIndexAry[refPath]を更新する
                                }
                            }}
                            if(!limitsortAry[blocknum]){
                                limitsortAry[blocknum]={};
                                limitsortAry[blocknum].startval = blocknum*dataBlock_length;
                                existDocFlg++;
                            }
                            
                            
                            let nowModTime = myTimestampToDate(docdata.modified_sys);
                            if(!nowModTime) nowModTime = nowServeTime;
                            let lastmod=0;
                            if(limitsortAry[blocknum]){
                                lastmod = limitsortAry[blocknum].lastmodified;
                                let modsys = myTimestampToDate(docdata.modified_sys);
                                if((!lastmod)||(modsys>lastmod)){
                                    limitsortAry[blocknum].lastmodified = modsys;
                                    existDocFlg++;
                                }
                            }
                            break;
                    }
                }
                if(existDocFlg){ // limitsortAry を indexedDBに保存
                    await putdataToIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry , limitsortAry,true); 
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
        if(listenerAry[refPath]){if(typeof (listenerAry[refPath].additional)=="function"){
            listenerAry[refPath].additional(); // endPosition無しのリスナーを削除
            listenerAry[refPath].additional=null;
            myconsolelog("[Info] fireStore取得処理の新ブロックリスナー(additional)を削除");
        }}
    }else{
        listenerAry={};
    }
    if(!listenerAry[refPath])listenerAry[refPath]={};
    
    
    listenerAry[refPath].additional = await setAdditionalListener(refPath);
    
    if(listenerAry[refPath].additional){
        if(typeof (listenerAry[refPath].additional)=="function"){
            myconsolelog("[Info] fireStore取得処理の新ブロックリスナー(additional)を設定");
        }else{
            myconsolelog("[ERROR] fireStore取得処理の新ブロックリスナー(additional)の設定が不正："+typeof (listenerAry[refPath].additional));
        }
    }
}
async function setAdditionalListener(refPath){ //返値は、リスナー解除関数
    
    // ---- 監視対象期限を調査
    let storedIndexeddbTime;
    let limitsortAry= await getdataFromIndexedDb_fs(indexedDbName,refPath,indexedDb_keyName_BlockAry); //(dbname,storeName,key)
        //   limitsortAry[0]={startdate:0, enddate:startDate, obtaintime:0 };
    if(limitsortAry){
        for (let i of Object.keys(limitsortAry)){
            if(limitsortAry[i].obtaintime) {
                if((!storedIndexeddbTime)||(limitsortAry[i].obtaintime>storedIndexeddbTime)) {
                    storedIndexeddbTime = limitsortAry[i].obtaintime;
                }
            }
        }
    }
    
    if(!storedIndexeddbTime){
        if(limitsortAry){
            if(limitsortAry.length==0){
                myconsolelog(`[Info] IndexedDBの ${indexedDb_keyName_BlockAry}設定が空です : ${refPath}`);
            }else{
                myconsolelog(`[Warning] listener期限が${indexedDb_keyName_BlockAry}(IndexedDB)から設定できません : ${refPath}`);
            }
        }else{
            myconsolelog(`[Warning] IndexedDBに ${indexedDb_keyName_BlockAry}が設定されていません : ${refPath}`);
        }
        // return null;
        storedIndexeddbTime=getServerTimeFromRTDB()-100;
    }
    
    
    myconsolelog(`[Info] Try set Additional-listener for fireStore data ${myDateTimeFormat(storedIndexeddbTime,3)}(${storedIndexeddbTime.toString()}) : ${refPath}`);
    
    
    // ------ リスナーの条件を作成 -------
    let queryWhereAry=[];
    queryWhereAry[0] = fsdb_orderBy("modified_sys","asc");
    //queryWhereAry.push( fsdb_where("modified_sys", ">", storedIndexeddbTime) );
    queryWhereAry.push( fsdb_startAfter(fsdb_Timestamp.fromDate(new Date(storedIndexeddbTime))) );
    
    const tgtRef = fsdb_collection(firestoredatabase , refPath);
    let tgtquery = fsdb_query(tgtRef, ...queryWhereAry );
    

    //ans=await getDataBlockFromFirestore(tgtquery);
    return fsdb_onSnapshot(tgtquery, async function(querySnapshot){
        
        myconsolelog(`[Info] fsdb_onSnapshot (AdditionalListener) : ${refPath}`);
        
        let cnt = await fsdb_processSnapshot(querySnapshot);
        
        if(cnt>(dataBlock_length+10)){ // 取得データ件数がブロック長を超えるようなら、リスナを再作成する
            setTimeout( remakeAdditionalListener,0, refPath );
        }
        
        checkListenerListener(refPath,querySnapshot);
    });
    
}


// -------- リスナーリスナー（firestoreからの通知によるindexedDBの更新の監視）
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
        myconsolelog(`[Info] fireStore : getDataCount=${ans} ${q_fieldname} ${q_condition} ${q_value} in ${refPath}`);
    } catch (e) {
        myconsolelog("Error getting count document:"+ e);
    }
    
    return ans;
}




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
            newval=sysval;
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
            NewSortIndex = rejectParam;
            let docdata = await createSystemDoc(refPath);
            if(docdata){if(typeof docdata.sortIndex_Max =="number"){
                NewSortIndex = docdata.sortIndex_Max;
            }}
        });
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
        return getKeysFromIndexedDb(iDbName,PandK[0],"" ,(PandK[1]+"/"),(PandK[1]+"0"),directionFlg , PandK[1]+"/"+indexedDb_keyName_BlockAry );  // "0"は"/"の次 
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
    // ---送信用オブジェクト（単純な連想配列オブジェクトであることが必要)
    //let tgtdata={}; for (const [key, value] of Object.entries(orgdata)) { tgtdata[key] = value; }
    //let tgtdata = Object.assign({}, orgdata);
    let tgtdata = { ...orgdata };
    
    // ---
    tgtdata.modified_sys = fsdb_serverTimestamp();
    tgtdata.modified = fsdb_serverTimestamp();
    tgtdata.created = fsdb_serverTimestamp();
    
    try {
        if(docId){
            const docRef = fsdb_doc( firestoredatabase , refPath , docId );
            const ref01 = await fsdb_setDoc( docRef , tgtdata );
            return docRef;
        }else{
            const tgtColRef = fsdb_collection(firestoredatabase , refPath);
            return await fsdb_addDoc(tgtColRef, tgtdata ); // docrefを返す
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
    myconsolelog("[Info] try delete to firestore : "+refPath+" "+dockey);
    
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

async function getDataBlockFromFirestore(tgtquery){
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
