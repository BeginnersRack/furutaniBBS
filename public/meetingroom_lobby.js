//-- Htmlファイルで定義されているもの
const HtmlElement_myTitleSpanId ="meetingroom_title";
const HtmlElement_mySystemMessage01SpanId ="SystemMessage01";

const HtmlElement_myLobbyInfosDivId ="lobby_Infos";
const HtmlElement_mySkywayStatusDivId ="skyway_status";



//-- 以下、JavaScript内で生成するもの
const HtmlElement_mybutton_entrance_BtnId ="button_entranceInto";


//---
const indexedDbName = "furutaniBBS";
const comment_MaxDatasize = 100;

const storeName="MeetingRooms";

//---
const pageconfig={};
   // pageconfig.roomCode    :(URLパラメータより)Roomコード
   // pageconfig.SkyWayKey
   // pageconfig.RoomList / participants

//---------------------------------------

async function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    let urlOptionsAry = window.parent.getUrloptions(window.location.search);
    pageconfig.roomCode = urlOptionsAry["r"];
    
    let tgtElem;
    const nowtime = new Date();
    //----
    const mySystemIndicatorFunc = mySystemIndicatorFunc_create(); //閉包関数
    mySystemIndicatorFunc("nowloading",1,"Now loading...");
    

    //--------- フットプリントの生成 ------
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint01","home");
    
    tgtElem = document.getElementById(HtmlElement_myTitleSpanId);
    if(tgtElem){
        tgtElem.innerHTML = "会議室　ロビー";
    }
    
    //--------- skywayKeyの取得 ----
    let strdbpath ="";
    
    //strdbpath =storeName+"/locale01/MeetingRoomList";
    pageconfig.SkyWayKey = await window.parent.fb_getDataFromFirestoreDb_singleDoc(storeName, "SkyWayKey" ).catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb_singleDoc : "+ "SkyWayKey " + reject);
    });
    
    if(!pageconfig.SkyWayKey){
        mySystemIndicatorFunc("nowloading",false);
        tgtElem = document.getElementById(HtmlElement_mySkywayStatusDivId);
        if(tgtElem){
            tgtElem.innerHTML = "＜＜閉鎖中＞＞";
        }
        return 0;
    }
    
    
    //--------- 設定データの取得 と ロビー表示 ----

    function updateRoominfosR(Snapshot){
        if(winobj_chat) { mypostWinMessage(winobj_chat,"roomlist",pageconfig.RoomList); }
        dispRoomsInfo();
    }
    function updateRoominfosM(Snapshot){
        if(winobj_chat) { mypostWinMessage(winobj_chat,"participant",pageconfig.participants); }
        dispRoomsInfo();
    }
    let p1=createRoomDataAryListener( updateRoominfosR );    // pageconfig.RoomList
    let p2=createRoomMemberAryListener( updateRoominfosM );  // pageconfig.participants
    
    await Promise.all([p1,p2]);
    dispRoomsInfo();
    
    // ------------------------------
    tgtElem = document.getElementById(HtmlElement_mySkywayStatusDivId);
    if(tgtElem){
        tgtElem.innerHTML = "";
        let dispContents="";
        
        dispContents +=`<input type="button" id="`+HtmlElement_mybutton_entrance_BtnId+`" value="入場する" onclick="openchatwin()">`;
        
        
        //----------
        tgtElem.insertAdjacentHTML('beforeend', dispContents);
    }
    
    
    
    //---------表示処理の終了----
    mySystemIndicatorFunc("nowloading",false);
    
    // -----メンテ処理-----
    if(1==1){
        //---
        let keyarrayM = Object.keys(pageconfig.participants).map((k)=>({ key: k, value: pageconfig.participants[k] }));
        let keyarrayM2=keyarrayM.filter(elm => elm.value && (!elm.value.modified_sys || ((nowtime-elm.value.modified_sys)/(60*60*1000))>2 ) );
        if(keyarrayM2.length>0){
            for(let elm of keyarrayM2){
                    try{ window.parent.fb_deleteDataOnFirestore(storeName,elm.value.primaryKey); } catch{}
            }
        }
        
        // ---
        let keyarrayR = Object.keys(pageconfig.RoomList).map((k)=>({ key: k, value: pageconfig.RoomList[k] }));
        let keyarrayR2=keyarrayR.filter(elm => elm.value && (elm.value.expirationdate && elm.value.expirationdate<nowtime ) );
        if(keyarrayR2.length>0){
            for(let elm of keyarrayR2){
                let keyarrayM3=keyarrayM.filter(m => m.value && m.value.roomid && m.value.roomid==elm.key );
                if(keyarrayM2.length==0){
                    try{ window.parent.fb_deleteDataOnFirestore(storeName,elm.value.primaryKey); } catch{}
                }
            }
        }

    }
    // ---------
    if(1==1){  myTest(); }
};
function mySystemIndicatorFunc_create(key="",flg=false,msg=""){
    let timerIdAry={};
    let timerId = timerIdAry[key];
    
    //const msgElem = await getElementByIdPromise(HtmlElement_mySystemMessage01SpanId);
    const msgElem = document.getElementById(HtmlElement_mySystemMessage01SpanId);
    
    function indicatorIncriment(){
        if(msgElem){ 
            msgElem.innerHTML = msgElem.innerHTML +"."; 
        }
    }
    //---------
    return function(key,flg=false,msg=""){
        if(flg){
            if(msgElem){ msgElem.innerHTML=msg; }
            timerIdAry[key] = setInterval(indicatorIncriment, 1000);
        }else{
            if(timerIdAry[key]){
                clearInterval(timerIdAry[key]);
            }
            delete timerIdAry[key];
            if(msgElem){ msgElem.innerHTML=""; }
        }
    }
}




function dispRoomsInfo(){
    const nowtime = new Date();
        if(!pageconfig.participants || !pageconfig.RoomList){
            return;
        }
        let tgtElem = document.getElementById(HtmlElement_myLobbyInfosDivId);
        if(!tgtElem){return;}
        
        tgtElem.innerHTML = "";
        let dispContents="";
        //----------
        function listmembername(roomid){
            ans=""
            for (let key in pageconfig.participants){
                let mem = pageconfig.participants[key];
                if((!roomid && !mem.roomid) || (roomid && roomid==mem.roomid)){
                    ans += mem.membername+", ";
                }
            }
            return ans;
        }
        dispContents += "本日の催事";
        dispContents += "<table><tr><th>会議室</th><th>情報</th><th></th></tr>";
        dispContents += "<tr><td>ロビー</td><td></td><td>";
        dispContents += "入室者：" + listmembername(null);
        dispContents += "</td></tr>";
        
        let keyarray = Object.keys(pageconfig.RoomList).map((k)=>({ key: k, value: pageconfig.RoomList[k] }));
        let keyarray2=keyarray.filter(elm => elm.value && (!elm.value.expirationdate || elm.value.expirationdate>=nowtime ) );
        keyarray2.sort( function compareFn(a, b){ 
                if(a.value.roomsort==b.value.roomsort){return 0}else{
                  if(a.value.roomsort==null && b.value.roomsort==null){return 0}else{
                    if(a.value.roomsort==null){return 1;}else{if(b.value.roomsort==null){return -1;}else{
                          return ( (a.value.roomsort > b.value.roomsort) ? 1 : -1)  
                } } }}
            });
        for (let elm of keyarray2){
            let room = elm.value;
            dispContents += "<tr><td>"+ room.roomname +"</td><td>"+ room.information +"</td><td>";
            dispContents += "入室者：" + listmembername(elm.key);
            dispContents += "</td></tr>";
        }
        dispContents += "</table>";
        //----------
        tgtElem.insertAdjacentHTML('beforeend', dispContents);
        //tgtElem.innerHTML = dispContents;
}
    
// =========================================================

async function createRoomDataAryListener(callbackFunc){
    let strdbpath = storeName+"/locale01/MeetingRoomList";
    window.parent.fb_setListenerListener(strdbpath,async function(Snapshot){
        if(pageconfig.RoomList){
            let myPromises = [];
            Snapshot.docChanges().forEach((change) => { 
                myPromises.push( new Promise((resolve, reject)=>{
                    const tgtdoc=change.doc; 
                    switch(change.type){
                      case "added":
                      case "modified":
                        pageconfig.RoomList[tgtdoc.id]= convert(tgtdoc);
                        break;
                      case "removed":
                        delete pageconfig.RoomList[tgtdoc.id];
                    }
                    resolve();
                }));
            });
            await Promise.all(myPromises);
            callbackFunc();
        }
    });
    function convert(tgtdoc){
        let aryelem={};
                        aryelem["primaryKey"] = getFieldValeFromSnapshotDoc(tgtdoc,"primaryKey");
                        aryelem["ownerid"] = getFieldValeFromSnapshotDoc(tgtdoc,"ownerid");
                        aryelem["ownername"] = getFieldValeFromSnapshotDoc(tgtdoc,"ownername");
                        aryelem["roomname"] = getFieldValeFromSnapshotDoc(tgtdoc,"roomname");
                        aryelem["roomsort"] = getFieldValeFromSnapshotDoc(tgtdoc,"roomsort");
                        let dtvl = getFieldValeFromSnapshotDoc(tgtdoc,"expirationdate");
                        if(dtvl){ aryelem["expirationdate"] = window.parent.myTimestampToDate(dtvl); }
                        aryelem["information"] = getFieldValeFromSnapshotDoc(tgtdoc,"information");
        return aryelem;
    }
    const ansdata = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,0,0,false).catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb(No-Block) : "+ strdbpath +" " + reject);
        return "NG";
    });
    let ans = {};
    for(let i in ansdata){ let elm = ansdata[i];
        const pkey = elm.primaryKey;
        const akey = pkey.split("/");
        const key = akey.length<1 ? pkey : akey[akey.length-1];
        ans[key]=convert(elm);
    }
    pageconfig.RoomList = ans;
    return 0;
}
async function createRoomMemberAryListener(callbackFunc){
    let strdbpath = storeName+"/locale01/MeetingMembers";
    window.parent.fb_setListenerListener(strdbpath,async function(Snapshot){
        if(pageconfig.participants){
            let myPromises = [];
            Snapshot.docChanges().forEach((change) => { 
                myPromises.push( new Promise((resolve, reject)=>{
                    const tgtdoc=change.doc; 
                    switch(change.type){
                      case "added":
                      case "modified":
                        pageconfig.participants[tgtdoc.id]=convert(tgtdoc);
                        break;
                      case "removed":
                        delete pageconfig.participants[tgtdoc.id];
                    }
                    resolve();
                }));
            });
            await Promise.all(myPromises);
            callbackFunc(Snapshot);
        }
    });
    function convert(tgtdoc){
        let aryelem={};
                        let dtvl = getFieldValeFromSnapshotDoc(tgtdoc,"modified_sys");
                        if(dtvl){ aryelem["modified_sys"] = window.parent.myTimestampToDate(dtvl); }
                        aryelem["memberkey"] = getFieldValeFromSnapshotDoc(tgtdoc,"memberkey");
                        aryelem["roomid"] = getFieldValeFromSnapshotDoc(tgtdoc,"roomid");
                        aryelem["enterflg"] = getFieldValeFromSnapshotDoc(tgtdoc,"enterflg");
                        aryelem["membername"] = getFieldValeFromSnapshotDoc(tgtdoc,"membername");
        return aryelem;
    }
    const ansdata = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,0,0,false).catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb(No-Block) : "+ strdbpath +" " + reject);
        return "NG";
    });
    let ans = {};
    for(let i in ansdata){ let elm = ansdata[i];
        const pkey = elm.primaryKey;
        const akey = pkey.split("/");
        const key = akey.length<1 ? pkey : akey[akey.length-1];
        ans[key]=convert(elm);
    }
    pageconfig.participants = ans;
    return 0;
}
function getFieldValeFromSnapshotDoc(ssdoc,fieldname){
    if(!ssdoc)return null;
    if(ssdoc[fieldname]!=null) return ssdoc[fieldname];
    
    let ssdoc2;
    try{
        ssdoc2 = ssdoc.data();
        if(ssdoc2[fieldname]!=null) return ssdoc2[fieldname];
    } catch {}
    
    let fary;
    try{
        fary = ssdoc._document.data.value.mapValue.fields;
        if(fary[fieldname]){ return fary[fieldname]; }
    }catch{}
    
    return null;
}

// ============================

// ----------firestore上の入室者メンバーデータを更新する
async function updateMyRoomMemberdata_exec( myPeerID=null,myRoomId=null,myEnterflg=null ){
    const storePath= storeName + "/locale01/MeetingMembers";
    const loginUser = window.parent.fb_getLoginUser();
    
    
    // ---
    let contentDoc={};
    let newflg=1;
    if(pageconfig.participants){if(pageconfig.participants[loginUser.email]){
        newflg=0;
        const fbdata = pageconfig.participants[loginUser.email];
        contentDoc["memberkey"] = fbdata.memberkey;
        contentDoc["roomid"] = fbdata.roomid;
        contentDoc["enterflg"] = fbdata.enterflg;
    }}
    if(newflg){
        contentDoc["roomid"] = "";
        contentDoc["enterflg"] = 0;
        contentDoc["memberkey"] = ""; //peerId
        
        contentDoc["membername"] = loginUser.displayName;
    }
    const strMode = (newflg ? "新規" : "更新");
    
    if(myPeerID!=null){ contentDoc["memberkey"] = ( myPeerID ? myPeerID : "" ); }
    if(myRoomId!=null){ contentDoc["roomid"] = ( myRoomId ? myRoomId : "" ); }
    if(myEnterflg!=null){ contentDoc["enterflg"] = ( myEnterflg ? myEnterflg : 0 ); }
    // ----------
    let flgOk=0;
    try {
        let try1p;
        if(newflg){
            try1p = window.parent.fb_addDataToFirestore(storePath , contentDoc , loginUser.email);
        }else{
            try1p = window.parent.fb_updateDataOnFirestore(storePath , loginUser.email , contentDoc ,true);
        }
        
        let try1 = await try1p;
        if(try1!==null){ flgOk=1; }
    } catch(e){
        let msg="データの"+strMode+"登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : "+msg );
        setTimeout( function(){throw e;} );
        alert(msg);
        return null;
    }
    
    if(!flgOk){
        let msg="データの"+strMode+"登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : " + msg );
        alert(msg);
    }else{
        window.parent.fb_myconsolelog("[info] update firestore RoomMember-data : " );
    }
}

//1時間毎以内に更新を行う
let timerId_checkContinued;
function checkContinued(peerid){
    const loginUser = window.parent.fb_getLoginUser();
    let chkPeerid="";
    if(winobj_chat){
        if(pageconfig.participants){if(pageconfig.participants[loginUser.email]){
            chkPeerid = pageconfig.participants[loginUser.email].memberkey;
        }}
    }
    if(chkPeerid){
        if(chkPeerid==peerid){ // 問題なし
            updateMyRoomMemberdata_exec(); // firestoreのデータの更新時刻を更新
            timerId_checkContinued = setTimeout( function(){ mypostWinMessage(winobj_chat,"check_peerid",""); } ,1000*60*30);
            window.parent.fb_myconsolelog("[Info] checked PeerId : "+peerid );
        }else{
            window.parent.fb_myconsolelog("[Warning] cannot check PeerId : lost chat-window." );
        }
    }
}





// ============================
window.addEventListener("beforeunload", function(event) {
    if(winobj_chat){
        event.preventDefault(); //ページ遷移警告の表示
        event.returnValue = ''; //ページ遷移警告の表示
    }
});
const terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
window.addEventListener(terminationEvent, function(event) {

    if(!winobj_chat){ return 0; }

    //--- 切断 --- 
    //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
    //    このため、ページ遷移警告の後に切断処理等をおこなうことはできない。
    //sendNewChatMessage("(退出)");
    //quitAllConnection();
    
    mypostWinMessage(winobj_chat,"quit","");//子windowへ通知
    
});


// ============================
let winobj_chat;
function openchatwin(){
    if(winobj_chat){
        console.log("[Error] chat-win : already exist?" );
        winobj_chat.focus();
    }else{
        winobj_chat = window.open("chat.html", "chatWin", "scrollbars=yes");
        window.addEventListener('message', chatwin_messageAction );
        setTimeout(check_winChatOpen,5000);
    }
    let tgtElem = document.getElementById(HtmlElement_mybutton_entrance_BtnId);
    if(tgtElem){ tgtElem.value="入場中";
    }
}
let timerIdForWinMessage;
function check_winChatOpen(){
    timerIdForWinMessage=null;
    let flg=0;
    if(winobj_chat){
        if(!winobj_chat.closed) flg=1;
    }
    if(flg){
       timerIdForWinMessage = setTimeout(check_winChatOpen,5000);
    }else{
        console.log("[Warning] chat-window Lost.");
        check_winChatclosed();
    }
}
function check_winChatclosed(msg=""){
    const loginUser = window.parent.fb_getLoginUser();
    if(timerIdForWinMessage){ clearTimeout(timerIdForWinMessage); }
    window.removeEventListener('message', chatwin_messageAction );
    winobj_chat = null;
    if(pageconfig.participants){if(pageconfig.participants[loginUser.email]){
        window.parent.fb_deleteDataOnFirestore(storeName + "/locale01/MeetingMembers" , loginUser.email );
        delete pageconfig.participants[loginUser.email];
    }}
    if(timerId_checkContinued){
        clearTimeout(timerId_checkContinued);
    }
    if(msg){
        console.log("[Info] chat-window close. "+msg );
    }
    let tgtElem = document.getElementById(HtmlElement_mybutton_entrance_BtnId);
    if(tgtElem){ tgtElem.value="入場する";
    }
    dispRoomsInfo();
}
function chatwin_messageAction(event){
    if( (event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin ){   
        console.log("[Error] got illegal Message from : "+ event.source.location.origin );
    }else{
        if (!(event.data instanceof Object) || (event.data instanceof Array)){
            console.log("[Error] got not-regular Message from : "+ event.origin );
        }else{
            Object.keys(event.data).forEach((onekey) => {
                switch(onekey){
                  case "quit":
                    check_winChatclosed("child closing.");
                    break;
                  case "log":
                    console.log("[Info] got Message : "+ event.data[onekey] );
                    break;
                  case "skywaykey":
                    let rep= (pageconfig.SkyWayKey ? pageconfig.SkyWayKey.SkyWayKey : null);
                    mypostWinMessage(event.source,"skywaykey",rep);
                    console.log("[Info] reply Message [skyWayKey] : "+ rep.toString() );
                    break;
                  case "push_peerid":
                    console.log("[Info] got Message : peerId = "+ event.data[onekey] );
                    updateMyRoomMemberdata_exec( event.data[onekey] );
                    if(!timerId_checkContinued){ setTimeout( function(){checkContinued(event.data[onekey]);},10000); }
                    break;
                  case "check_peerid":
                    console.log("[Info] got Message : peerId = "+ event.data[onekey] );
                    checkContinued(event.data[onekey]);
                    break;
                  
                  default:
                    console.log("[Error] got unknown Message ["+onekey+"] from : "+ event.origin );
                }
            });
        }
    }
}
function mypostWinMessage(tgtwin,key,data=""){
    const sendmsg = {};
    sendmsg[key]=data;
    
    if(tgtwin){if(tgtwin.postMessage){
        tgtwin.postMessage( sendmsg , window.location.origin );
    }}
}


// ------------------------------------
// ---------- 以下、テスト用 ----------
function myTest(){
    const loginUser = window.parent.fb_getLoginUser();
    tgtElem = document.getElementById("forTest");
    if(tgtElem){
        let msg="";
        tgtElem.innerHTML = msg;
    }
}


//***********  Export ***************

