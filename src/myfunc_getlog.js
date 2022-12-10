// import {  firebaseAuth, onAuthStateChanged as firebase_onAuthStateChanged  
//        ,  reauthenticateWithCredential as firebase_reauthenticateWithCredential ,EmailAuthProvider as firebase_EmailAuthProvider } from "./FirebaseConfig.js";
// import {  createUserWithEmailAndPassword as firebase_createUserWithEmailAndPassword
//        , signInWithEmailAndPassword as firebase_signInWithEmailAndPassword
//        , signOut as firebase_signOut 
//        ,sendEmailVerification as firebase_sendEmailVerification 
//        ,updatePassword as firebase_updatePassword, updateProfile as firebase_updateProfile    } from "./FirebaseConfig.js";

// import { rtdatabase as firebaseRTDB_database ,ref as firebaseRTDB_ref, set as firebaseRTDB_set , update as firebaseRTDB_update ,push as firebaseRTDB_push ,onValue as firebaseRTDB_onValue,onDisconnect as firebaseRTDB_onDisconnect  ,serverTimestamp as firebaseRTDB_serverTimestamp  } from "./FirebaseConfig.js";

import { myconsolelog } from "./myfunc_common.js";


import {  firebaseAuth
         , rtdatabase as firebaseRTDB_database ,rtdb_ref as firebaseRTDB_ref ,rtdb_serverTimestamp as firebaseRTDB_serverTimestamp
         , rtdb_push as firebaseRTDB_push, rtdb_set as firebaseRTDB_set,rtdb_get as firebaseRTDB_get, rtdb_update as firebaseRTDB_update
         , rtdb_onValue as firebaseRTDB_onValue
         , rtdb_onDisconnect as firebaseRTDB_onDisconnect
         , rtdb_query as firebaseRTDB_query , rtdb_orderByChild as firebaseRTDB_orderByChild ,rtdb_orderByKey as firebaseRTDB_orderByKey
         , rtdb_equalTo as firebaseRTDB_equalTo ,rtdb_limitToLast as firebaseRTDB_limitToLast
         , rtdb_startAt as firebaseRTDB_startAt , rtdb_endAt as firebaseRTDB_endAt
        } from "./FirebaseConfig.js";

import { getMySessionNumber,updateSessonIdList ,getSessionID ,getSessonIdList} from "./myfunc_storage.js";

const c_naviInfo = navigator.appCodeName +"_"+ navigator.appName +"_"+ navigator.appVersion +"_"+ navigator.platform +"_"+ navigator.userAgent;

const flg_disableRecordLog = document.getElementById("disableRecordLog");

//*********** my functions ****************



// ===== アクセスログ保存 ======
function getUserForLog(myuser){
        let ans=myuser;
        let accessuserid = "";
        if(myuser){ accessuserid = (myuser.uid ? myuser.uid :""); }
        if(accessuserid==""){
            if(firebaseAuth){if(firebaseAuth.currentUser){if(firebaseAuth.currentUser.uid){
                ans = firebaseAuth.currentUser;
            }}}
        }
        return ans;
}
function getUseridForLog(myuser0){
        let myuser = getUserForLog(myuser0);
        let accessuserid = "";
        if(myuser){ accessuserid = (myuser.uid ? myuser.uid :""); }
        if(accessuserid==""){accessuserid = "(unknown)";}
        return accessuserid;
}
function getUsercodeForLog(myuser0){
        let myuser = getUserForLog(myuser0);
        let usercode= "";
        if(myuser){ usercode = (myuser.email ? myuser.email :""); }
        if(usercode==""){usercode = "(unknown)";}
        return usercode;
}
function getUsernameForLog(myuser0){
        let myuser = getUserForLog(myuser0);
        let username= "";
        if(myuser){ username = (myuser.displayName ? myuser.displayName :""); 
            if(!username) { let email=myuser.email; if(email){
                let pos=email.indexOf('@');
                if(pos>0){ username = email.slice(0,pos);
                } else {   username = email; }
            }}
        }
        if(username==""){username = "(unknown)";}
        return username;
}
let logConnectionDisconnectEvent;
function logConnectionDisconnectEventCancel(){
    if(logConnectionDisconnectEvent){
        logConnectionDisconnectEvent.cancel().then( ()=>{ 
                  myconsolelog(`[INFO]通信切断時のイベントを解除しました。`);
        });
        
        logConnectionDisconnectEvent=null;
    }
}
// ------ アクセスLog情報保存-----
//   connectionLogFlg >> 0:接続者情報は更新しない  1,2:新規接続で更新  -1:切断で更新  -2:切断を中断
async function createAccessLogData(myuser , strLogMsg0 , connectionLogFlg=0 ,sessionCount=0){
    let strLogMsg = strLogMsg0;
    let snum=getMySessionNumber();
    if(snum) strLogMsg += "("+snum+")";

    if(flg_disableRecordLog){  myconsolelog(`[Log] ${strLogMsg0}`); return; }
    
    const updates = {};  // 書き込みデータの格納用  keyが保存先のDBパス
    
    // 先に、接続者情報の更新が必要なら対応する
    let connectionLogPath=""; // 通信切断時イベントのための接続者情報パス (空なら、通信切断時のイベント設定を行わない)
    if(connectionLogFlg){  //  最新接続者情報の登録
        const clogpath=createAryConnectionLogDatas_path(myuser);
        if(connectionLogFlg>0){
            let createConnLogFlg=1;
            let snapshot=await getRTDBdatas_promise("once",clogpath);
            
            if(connectionLogFlg==2){    //前回の接続から、リロード等で継続接続されている場合の特殊処理
                if(snapshot){let ssv=snapshot.val();if(ssv){
                    if(ssv.logoff){
                        let sts=getServerTimeFromRTDB();
                        let sabun = sts-ssv.logoff;
                        if((sabun<10000)&&(sabun>-10000)){ //前回Logoffより10秒以内の再接続なら・・・
                            createConnLogFlg=0;  // 新しい接続者情報は生成しない
                            updates[clogpath+'logoff']=0;  // 前回情報の切断を無効化する
                            //if(!sessionCount) sessionCount= Object.keys(getSessonIdList(-1)).length;
                            //if(sessionCount<=1){
                              connectionLogPath=clogpath; // 通信切断時のイベントを設定する
                            //}
                            myconsolelog(`[INFO]接続切断(ブラウザリロード等)から復帰しました。${sabun}ms.`);
                            strLogMsg += `⇒前回接続を継続(${sabun}ms)。`;
                        }
                    }else{
                        if(ssv.timestamp){
                            let sts=getServerTimeFromRTDB();
                            let sabun =  Math.floor( (sts-ssv.timestamp)/1000/60 );
                            if((sabun<300)&&(sabun>-10)){ //前回Loginより300分以内の再接続なら・・・
                                createConnLogFlg=0;  // 新しい接続者情報は生成しない
                                //if(!sessionCount) sessionCount= Object.keys(getSessonIdList(-1)).length;
                                //if(sessionCount<=1){
                                  connectionLogPath=clogpath; // 通信切断時のイベントを設定する
                                //}
                                myconsolelog(`[INFO]接続未切断状態から再接続しました。${sabun}min.`);
                                strLogMsg += `⇒前回接続(未切断)を継続(${sabun}min)。`;
                            }
                        }
                    }
                }}
            }
            
            if(createConnLogFlg){ // 特殊処理無し→通常処理として 接続者情報を生成する
                connectionLogPath=clogpath;
                const conlog = createAryConnectionLogDatas(myuser,snapshot);
                if(conlog){
                    for (let key in conlog){ // Object.assign(updates,conlog);
                        updates[key] = conlog[key];
                        if(connectionLogPath=="") connectionLogPath = key;
                    }
                }
            }
        } else {
            //const clogpath=createAryConnectionLogDatas_path(myuser);
            //const logConnectionsOutRef = firebaseRTDB_ref(firebaseRTDB_database , clogpath+'logoff');
            if(connectionLogFlg==-2){   // 切断取消
                updates[clogpath+'logoff']=0;
                updateSessonIdList(null);
                connectionLogPath=clogpath; // 通信切断時のイベントを再設定する
            }else{      //  切断処理
                const objList = updateSessonIdList(null,getSessionID()); // 自分のIDを削除
                let signoutFlg=0;
                if(typeof objList =="object"){if(Object.keys(objList).length==0){
                    signoutFlg=1;
                }}
                if(signoutFlg){
                    //logConnectionDisconnectEventCancel();
                    //updates[clogpath+'logoff']=firebaseRTDB_serverTimestamp(); 
                    
                    localStorage.setItem('sessionidcounter',0);
                    //localStorage.clear(); // localstorageを全消去
                    
                }else{ //まだ開かれている他のタブor窓がある
                    logConnectionDisconnectEventCancel();
                }
                
            }
        }
    }
    
    //※この関数内のここより下では myconsolelog() は使用禁止。
    //     myconsolelog()内で、createAccessLogData(getUserForLog() , msg ,0)を使用しているため
    
    // アクセスLog情報の生成
    const aclog = createAryAccessLogDatas(myuser , strLogMsg);
    Object.assign(updates,aclog);  // updatesに追加
    
    
    // DB更新の実行
    firebaseRTDB_update( firebaseRTDB_ref(firebaseRTDB_database) , updates ).then(() => {
          
          console.log('データベースにLog保存：' + (Object.keys(updates))[0] );
          
          if(connectionLogFlg){if(([1,2,-2]).includes(connectionLogFlg)){if(connectionLogPath!=""){
              //if(1==2){
                //if(Object.keys(getSessonIdList(-1)).length==1){ // ブラウザの残窓があと1つである場合
                      const logConnectionsOutRef = firebaseRTDB_ref(firebaseRTDB_database , connectionLogPath+'logoff');
                      logConnectionDisconnectEvent = firebaseRTDB_onDisconnect(logConnectionsOutRef);
                      logConnectionDisconnectEvent.set(firebaseRTDB_serverTimestamp()).then( ()=>{ 
                          myconsolelog(`[INFO]通信切断時のイベントを設定しました：${connectionLogPath}`);
                      });
                //}
              //}
          }}}
          
          if(window.flg_RTDBwritten){window.flg_RTDBwritten=0;} //beforeunloadイベント対策用(処理終了通知)
    })
    .catch((error) => {
              console.log(`[ERROR]データベースへの接続に失敗しました：${error.code}:${error.message} [${updates[(Object.keys(updates))[0]].logmessage}]`);
    });

}

function createAryAccessLogDatas_path(myuser){
    let uid;
    if(typeof myuser=="string"){
        uid=myuser;
    }else{
        uid = getUseridForLog(myuser);
    }
    if(uid!="")uid+="/";
    return ('logs/'+uid);
}
function createAryAccessLogDatas(myuser , strLogMsg){
    let usercd=getUsercodeForLog(myuser);

    // *** アクセスLog情報のDBパス
    const dbpath = createAryAccessLogDatas_path(); // = 'logs/'+uid+'/'
    const logsRef = firebaseRTDB_ref(firebaseRTDB_database , dbpath);
    const newPostLogRef = firebaseRTDB_push(logsRef); // 一意のID（newPostLogRef.key）を生成   時間と参照先を含むユニークキー
    const path= dbpath + newPostLogRef.key;
    
    // *** アクセスLog情報のフォーマット定義
    let propAry={     usercode: usercd
                     ,timestamp: firebaseRTDB_serverTimestamp()
                     ,logmessage: strLogMsg
                     ,navigator: c_naviInfo
    };
    // ----
    let ans={};
    ans[path]= propAry;
    
    return ans;
}
function createAryConnectionLogDatas_path(myuser){
    let uid;
    if(typeof myuser=="string"){
        uid=myuser;
    }else{
        uid = getUseridForLog(myuser);
    }
    if(uid!="")uid+="/";
    return 'connections/'+uid;    //  上書き
}
function createAryConnectionLogDatas(myuser,snapshot=null){
    const snapshotVal = ((snapshot)?( snapshot.val() ): null );
    
    
    // *** 接続者情報のDBパス
    const path=createAryConnectionLogDatas_path(myuser);
    
    // *** 接続者情報のフォーマット定義
    let propAry={       usercode: getUsercodeForLog(myuser)
                       ,username: getUsernameForLog(myuser)
                       ,navigator: c_naviInfo
                       ,timestamp: firebaseRTDB_serverTimestamp()
                       ,logoff:0   //  切断時に追記される
                    // ,postRefKey: newPostConRef.key
                       ,lasttimestamp: ((snapshotVal)?( snapshotVal['timestamp'] ):0)
                       ,lastlogoff:    ((snapshotVal)?( snapshotVal['logoff'] ):0)
                       ,lastnavigator: ((snapshotVal)?( snapshotVal['navigator'] ):"")
                };
    // ---
    let ans={};
    ans[path]= propAry;
    
    return ans;
}



// ========================================
// 現時点アクセス者の取得
let ConnectionMembersList={};
function getConnectionMembersList(){
    return ConnectionMembersList;
}
function createConnectionMembersListData(elem){
    let data = {};
    //data['email']=elem.usercode; //Key値
    data['name']=elem.username;
    data['connect']=!(elem.logoff);
    data['logmode']=(elem.logmode ? elem.logmode:false);  // logmodeは、通常のConnectionLogDatasには定義されていない特殊プロパティ
    data['timestamp']=elem.timestamp;
    data['logoff']=elem.logoff;
    data['lasttimestamp']=elem.lasttimestamp;
    data['lastlogoff']=elem.lastlogoff;
    return data;
}
let ConnectionLogData_logmodeFlg = 0; // console.logへの出力をDBにも記録するかどうかのフラグ

function setConnectionMembersListListener(tgtHtmlElem){
    const dbpathBase = createAryConnectionLogDatas_path("");
    const myQuery = {orderByChild:"logoff",equalTo:0}; // {orderByChild:"timestamp",startAt:getServerTimeFromRTDB()-10000};
    
    ConnectionMembersList={};
    let myuser = getUserForLog();
    let myuserid = (myuser ? ( myuser.uid ? myuser.uid : "" ) : "");
    
    getRTDBdatas("get",dbpathBase    //  ***  初回の全件取得
         ,function(snapshot){  // 第3引数：onValueイベント処理(resolve)
            const dbdata = snapshot.val();
            if(dbdata){
                for(let key of Object.keys(dbdata)){
                        let elem = dbdata[key];
                        let data = createConnectionMembersListData(elem);
                        ConnectionMembersList[(elem.usercode ? elem.usercode : key)]=data;
                        if(key==myuserid){ConnectionLogData_logmodeFlg = data.logmode;}
                }
                //--------------
                getRTDBdatas_promise("on",dbpathBase   //  ***  初回以降はアクセス中の者のみ取得
                        ,function(snapshot){  // 第3引数：onValueイベント処理(resolve)
                            const dbdata = snapshot.val();
                            
                            if(dbdata){
                                for(let key of Object.keys(ConnectionMembersList)){
                                    ConnectionMembersList[key].connect = false;
                                }
                                
                                let cnt=0;
                                //cnt = Object.keys(dbdata).length;
                                for(let key of Object.keys(dbdata)){
                                    let elem = dbdata[key];
                                    let data = createConnectionMembersListData(elem);
                                    ConnectionMembersList[(elem.usercode ? elem.usercode : key)]=data;
                                    if(key==myuserid){ConnectionLogData_logmodeFlg = data.logmode;}
                                    cnt++;
                                }
                                
                                //for(let key of Object.keys(ConnectionMembersList)){
                                //    if(ConnectionMembersList[key].connect) cnt++;
                                //}
                                myconsolelog(`現アクセス者数が変更されました：${cnt}`);
                                
                                if(tgtHtmlElem){if(typeof (tgtHtmlElem.innerHTML)==="string"){
                                    tgtHtmlElem.innerHTML =  parseInt( cnt , 10);
                                }}
                                
                            }
                            
                        },function(error){    // 第4引数：onValueイベント処理(reject)
                            myconsolelog(`[ERROR]現アクセス者数の更新取得に失敗しました：${error.code}:${error.message}`);
                        },myQuery             //  第5引数：realtimeDBの検索条件
                ).then(function(snapshot){
                        myconsolelog(`現アクセス者数の監視を設定しました`);
                }).catch(function(error){
                        myconsolelog(`[ERROR]現アクセス者数監視の設定に失敗しました：${error.code}:${error.message}`);
                });
                //--------------
            }
            
        },function(error){    // 第4引数：onValueイベント処理(reject)
            myconsolelog(`[ERROR]アクセスLogデータの取得に失敗しました：${error.code}:${error.message}`);
        }
    );
    
}



// ========================================
// サーバ時刻(近似)の取得
let serverTimeOffsetFromRTDB = null;
function getServerTimeFromRTDB(enforce=false){
    let offsetInitFlg=enforce;
    if(!offsetInitFlg){
        if(!serverTimeOffsetFromRTDB){if(typeof serverTimeOffsetFromRTDB!="number"){
            offsetInitFlg=true;
        }}
    }
    if(offsetInitFlg){
        let stsoSnapshot=getRTDBdatas("once",'/.info/serverTimeOffset'   // Firebase定数 //
        , function(stsoSnapshot){
                
                if(stsoSnapshot){if(stsoSnapshot.exists()){
                    let stso = stsoSnapshot.val();
                    if(stso){if(typeof stso=="number"){
                        serverTimeOffsetFromRTDB = parseInt( stso , 10);
                        myconsolelog(`realtimeデータベースより サーバ時刻オフセットを取得：${stso}`);
                    }}
                }}
                
        });
        
    }
    let adjust = serverTimeOffsetFromRTDB ? serverTimeOffsetFromRTDB : 0;
    return ((new Date()).getTime()+adjust);

}



// ========================================
// ===== RealTimeDatabaseのデータ取得 ======
//       mode    on  :データ取得＋変更時のコールバックListening付き。offでListeningは停止する
//               once:データ取得のみ(Listeningなし)。on+offと同義
//               get :データ取得のみ.キャッシュを使用しない
function getRTDBdatas(mode,dbpath,callback,cancelCallback0=null,queryObj=null){
    
    let cancelCallback=null;
    if(typeof cancelCallback0=="function"){
        cancelCallback = cancelCallback0;
    }else{
        cancelCallback =function(){};
    }
    //------
    let DBDatasRef = firebaseRTDB_ref(firebaseRTDB_database , dbpath );
    if(queryObj){
        const cntmx=3;
        const keylist = Object.keys(queryObj);
        let cnt=0;
        let objary=[];
        for(let i=0;i<keylist.length;i++){
            switch(keylist[i]){
              case "orderByChild":
                  objary[cnt]=firebaseRTDB_orderByChild(queryObj[keylist[i]]);
                  cnt++;
                  break;
              case "orderByKey":
                  objary[cnt]=firebaseRTDB_orderByKey();
                  cnt++;
                  break;
              case "equalTo":
                  objary[cnt]=firebaseRTDB_equalTo(queryObj[keylist[i]]); // 直前にorderByChildなどで対象を指定
                  cnt++;
                  break;
              case "limitToLast":
                  objary[cnt]=firebaseRTDB_limitToLast(queryObj[keylist[i]]); // 直前にorderByChildなどでソート順を指定
                  cnt++;
                  break;
              case "startAt":
                  objary[cnt]=firebaseRTDB_startAt(queryObj[keylist[i]]); // 直前にorderByChildなどでソート順を指定
                  cnt++;
                  break;
              case "endAt":
                  objary[cnt]=firebaseRTDB_endAt(queryObj[keylist[i]]); // 直前にorderByChildなどでソート順を指定
                  cnt++;
                  break;

            }
            if(cnt>=cntmx){break;}
        }
        
        //switch(cnt){
        //  case 1:
        //    DBDatasRef = firebaseRTDB_query(DBDatasRef,objary[0]);
        //    break;
        //  case 2:
        //    DBDatasRef = firebaseRTDB_query(DBDatasRef,objary[0],objary[1]);
        //    break;
        //  case 3:
        //    DBDatasRef = firebaseRTDB_query(DBDatasRef,objary[0],objary[1],objary[2]);
        //    break;
        //}
        
        DBDatasRef = firebaseRTDB_query(DBDatasRef,...objary);
        
    }
    
    let onlyOnceFlg=false;
    switch (mode){
      case "get":
          firebaseRTDB_get(DBDatasRef).then( function(snapshot){
              callback(snapshot);
          }).catch((error) => {
              cancelCallback(error);
          });
      break;
      case "once":
          onlyOnceFlg=true;
      case "on":
          //DBDatasRef.off();
          //console.log("*"+mode+" "+ (DBDatasRef._path.pieces_).join(",") );
          firebaseRTDB_onValue(DBDatasRef, function(snapshot){
              callback(snapshot);
          },function(error){
              //DBDatasRef.off();
              cancelCallback(error);
          },{ onlyOnce: onlyOnceFlg });
      break;
      default:
    }
}


async function getRTDBdatas_promise(mode,dbpath,callback=null,cancelCallback=null,queryObj=null){
    let ans;
    await new Promise( function(resolve, reject){
        getRTDBdatas(mode,dbpath
            ,function(snapshot){ans=snapshot;if(callback){callback(snapshot);}resolve(snapshot);}
            ,function(error){if(cancelCallback){cancelCallback(error);}reject(error);}
            ,queryObj
        );
    });
    return ans;
}




//***********  Export ***************
export { createAccessLogData ,getRTDBdatas ,getServerTimeFromRTDB ,ConnectionLogData_logmodeFlg};
window.fb_createAryAccessLogDatas_path = createAryAccessLogDatas_path;
window.fb_createAccessLogData = createAccessLogData;
window.fb_createAryConnectionLogDatas_path = createAryConnectionLogDatas_path;
window.fb_getRTDBdatas = getRTDBdatas;
window.fb_getRTDBdatas_promise = getRTDBdatas_promise;
window.fb_getServerTimeFromRTDB = getServerTimeFromRTDB;
window.fb_setConnectionMembersListListener = setConnectionMembersListListener;
window.fb_getConnectionMembersList=getConnectionMembersList;