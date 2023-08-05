const htmlElementId_whiteboard_sw = "my-whiteboard_sw";

let chat_config={};

window.addEventListener('load', function(){setTimeout(myonload,10) } );
async function myonload(){
    console.log(`[Info] now waiting to get PeerId. [chat.js]`)
    chat_config.PeerId= await getMyPeerId();
    if(!chat_config.PeerId) return;
    
    set_whiteboard_sw();
    //setTimeout( displayWhiteBoard ,5000 );
    
}

async function getMyPeerId(){
    return new Promise((resolve, reject) => {
        function getMyPeerId_chk(cnt=0){
            let mpId = window.webRTC_getMyPeerId();
            if(mpId){
                console.log(`[Info] get PeerId "${mpId}" (${cnt})`)
                resolve(mpId);
                return cnt;
            }else{
                if(cnt>10){
                    console.log(`[Error] cannot get PeerId.`);
                    reject();
                }else{
                    setTimeout( function(){ getMyPeerId_chk(cnt+1); } ,500 );
                }
            }
        }
        let flg=getMyPeerId_chk();
    });
}


// ===== WebRTC処理 ======

//window.webRTC_getMyPeerId();
//window.webRTC_getAllConnections();
//window.webRTC_SendDataFromOutModule(strSendto,strDataType,senddata);
window.webRTC_recieveDataByOutModule = webRTC_recieveDataByOutModule;
// webRTC_recieveDataByOutModule(fromID,strDataType,data)  :  返値＝0 で正常処理

function webRTC_SendData2All( strDataType , dataObj){
    window.webRTC_SendDataFromOutModule("all",strDataType , dataObj);
}

function webRTC_recieveDataByOutModule(fromID,strDataType,dataObj){  //  返値＝0 で正常処理
    let ans=1;
    const onekey = strDataType;
    switch(onekey){
                  default:
                    break;
                    
                  case "tabletopObjectInfo":
                    console.log(`[Info] got webRTC-Data [${onekey}] from [${fromID}] : `+ dataObj.data.visibility );
                    mousepointer:{
                      //const dataContent = {from:fromID , data:dataObj.data };
                      mypostWinMessageToAllChannel("tabletopObjectInfo", dataObj );
                    }
                    ans=0;
                    break;
                    
                  case "setTableImage":
                    console.log(`[Info] got webRTC-Data [${onekey}] from [${fromID}] ` );
                    setTableImage:{
                      //const dataContent = {from:fromID , data:dataObj };
                      mypostWinMessageToAllChannel("setTableImage", dataObj );
                    }
                    ans=0;
                    break;
                    
                  case "requestTableImageId":
                    console.log(`[Info] got webRTC-Data [${onekey}] from [${fromID}] ` );
                    requestTableImageId:{
                      const keyword = "requestTableImageId";
                      if(!requestImageAry[keyword])requestImageAry[keyword]=[];
                      requestImageAry[keyword].push(fromID);  // 返信先を登録
                      
                      const allwins = winobj_imageboard_channelPort;
                      const ks = Object.keys(allwins);
                      if(ks.length>0){  // どれかを1つ選ぶ
                          let i=0; //rnd?
                          mypostWinMessageChannel(winobj_imageboard_channelPort[ks[i]] , "requestTableImageId" ,"");
                      }
                    }
                    ans=0;
                    break;
                  case "requestedTableImageId":
                    console.log(`[Info] got webRTC-Data [${onekey}] from [${fromID}] : `+ dataObj );
                    requestedTableImageId:{
                      //const dataContent = {from:fromID , data:dataObj };
                      mypostWinMessageToAllChannel("requestedTableImageId", dataObj );
                    }
                    ans=0;
                    break;
                    
                  case "requestImage":     //  event.data[onekey] = {to:strSenderId,id:imageIdentifier}
                    console.log(`[Info] got webRTC-Data [${onekey}] from [${fromID}] ` );
                    requestImage:{
                      //const requestTo = dataObj.to;
                      //const requestToWin = Object.keys(userids).filter( (key) => {return userids[key] == requestTo});
                      const imageIdentifier = dataObj.id;
                      if(!requestImageAry[imageIdentifier])requestImageAry[imageIdentifier]=[];
                      requestImageAry[imageIdentifier].push(fromID);  // 返信先を登録
                      const allwins = winobj_imageboard_channelPort;
                      const ks = Object.keys(allwins);
                      if(ks.length>0){
                          let i=0;
                          mypostWinMessageChannel(winobj_imageboard_channelPort[ks[i]] , "requestImage" ,imageIdentifier);
                      }
                    }
                    ans=0;
                    break;
                    
                  case "requestedImage":    // event.data[onekey] = {id:imageIdentifier,blob:imgFileObj.context.blob}; }
                    console.log(`[Info] got webRTC-Data [${onekey}] from [${fromID}] ` );
                    requestedImage:{
                      //const dataContent = {from:fromID , data:dataObj };
                      mypostWinMessageToAllChannel("requestedImage", dataObj );
                    }
                    ans=0;
                    break;
    }
    return ans;
}


//=============
let winobj_imageboard={};  // 配列にしているが、実際には1つしか使っていない
let winobj_imageboard_channelPort={};

function set_whiteboard_sw(){
   const tgtElem = document.getElementById(htmlElementId_whiteboard_sw);
   if(!tgtElem) { console.log(`No HtmlElement "${htmlElementId_whiteboard_sw}".`); return;}
   
   tgtElem.addEventListener("click", displayWhiteBoard );
   tgtElem.textContent="OHP表示";
   
}
function displayWhiteBoard(tgtWinId="whiteboard01"){
        let flg=1;
        if(winobj_imageboard[tgtWinId]){if(winobj_imageboard[tgtWinId].closed!=null){if(!winobj_imageboard[tgtWinId].closed){
            flg=0;
            console.log("[Error] chat-win : already exist?" );
            winobj_imageboard[tgtWinId].focus();
        }}}
        if(flg){
            winobj_imageboard[tgtWinId] = window.open("chat_imageboard.html", tgtWinId, "scrollbars=yes");
            createWinMessageChannel();
            setTimeout(function(){check_winChildOpen(tgtWinId);},5000);
        }

       const tgtElem = document.getElementById(htmlElementId_whiteboard_sw);
       if(tgtElem) {
           tgtElem.value="OHP表示中";
       }
}



const requestImageAry={};

// 自分のWhiteBoardからの Windowメッセージの処理。データ形式：種別を示す文字列をキーにもつ連想配列。送信者はchannel.port1.myIdで判別できる。
function winMessageChannelAction(event){
    if( (window.location.origin.substring(0,7)!="file://" && window.location.origin!="null") && 
        ( event.origin &&((event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin) )  ){   
        console.log("[Error] got illegal Message from : "+ (event.source ? event.source.location.origin : "?") );
    }else{
        if (!(event.data instanceof Object) || (event.data instanceof Array)){
            console.log("[Error] got not-regular Message from : "+ event.target.myId );
        }else{
            Object.keys(event.data).forEach((onekey) => {
                //console.log("[Info] got window-Message ["+onekey+"] from : "+ event.target.myId+ (event.source ? event.source.name : "??") );
                switch(onekey){
                  default:
                    console.log("[Error] got unknown Message ["+onekey+"] from : "+ event.target.myId );
                    break;
                  case "log":
                    console.log("[Info] got Message : "+ event.data[onekey] );
                    break;
                  case "ping":
                    mypostWinMessageChannel(winobj_imageboard_channelPort[event.target.myId] , "ping2" ,"ok");
                    //console.log("[Info] got Ping ["+event.data[onekey]+"] from : "+ event.target.myId );
                    break;
                  case "ping2":
                    //console.log("[Info] got Ping2 ["+event.data[onekey]+"] ");
                    break;
                  case "start":
                    console.log("[Info] got MessageChannel-Start-Signal from ["+ event.target.myId +"] : "+ event.data[onekey] );
                    let dataContent = {userid:chat_config.PeerId };
                    mypostWinMessageChannel(winobj_imageboard_channelPort[event.target.myId] , "config" ,dataContent);
                    break;
                    
                  case "tabletopObjectInfo":
                    console.log(`[Info] got MessageChannel [${onekey}] from [${event.target.myId}] : `+ event.data[onekey].visibility );
                    mousepointer:{
                      const dataContent = {from:chat_config.PeerId , data:event.data[onekey] };
                      webRTC_SendData2All("tabletopObjectInfo", dataContent);  // webRTC経由で参加者全員へ送信
                      mypostWinMessageToAllChannel("tabletopObjectInfo", dataContent ); // 自分のwhiteBoardへも送信
                    }
                    break;
                    
                  case "setTableImage":
                    console.log(`[Info] got MessageChannel [${onekey}] from [${event.target.myId}] ` );
                    setTableImage:{
                      const dataContent = {from:chat_config.PeerId , data:event.data[onekey] };
                      webRTC_SendData2All("setTableImage", dataContent);
                      mypostWinMessageToAllChannel("setTableImage", dataContent );
                    }
                    break;
                    
                  case "requestTableImageId":
                    console.log(`[Info] got MessageChannel [${onekey}] from [${event.target.myId}] ` );
                    requestTableImageId:{
                      
                      webRTC_SendData2All("requestTableImageId", "" );
                      
                    }
                    break;
                  case "requestedTableImageId":
                    console.log(`[Info] got MessageChannel [${onekey}] from [${event.target.myId}] : `+ event.data[onekey] );
                    requestedTableImageId:{
                      const keyword = "requestTableImageId";
                      const sendto = requestImageAry[keyword];
                      requestImageAry[keyword]=[];
                      
                      const dataContent = {from:chat_config.PeerId , data:event.data[onekey] };
                      sendto.forEach( function(element, index, array){
                          // mypostWinMessageChannel(winobj_imageboard_channelPort[element] , "requestedTableImageId" ,dataContent);
                          window.webRTC_SendDataFromOutModule( element , "requestedTableImageId" , dataContent );
                      });
                    }
                    break;
                    
                  case "requestImage":     //  event.data[onekey] = {to:strSenderId,id:imageIdentifier}
                    console.log(`[Info] got MessageChannel [${onekey}] from [${event.target.myId}] ` );
                    requestImage:{
                      const requestTo = event.data[onekey].to;
                      const imageIdentifier = event.data[onekey].id;
                      
                      const dataContent = {id:imageIdentifier };
                      //mypostWinMessageChannel(winobj_imageboard_channelPort[requestToWin] , "requestImage" ,imageIdentifier);
                      window.webRTC_SendDataFromOutModule( requestTo , "requestImage" , dataContent);
                    }
                    break;
                    
                  case "requestedImage":    // event.data[onekey] = {id:imageIdentifier,blob:imgFileObj.context.blob}; }
                    console.log(`[Info] got MessageChannel [${onekey}] from [${event.target.myId}] ` );
                    requestedImage:{
                      const imageIdentifier = event.data[onekey].id;
                      const sendto = requestImageAry[imageIdentifier];
                      requestImageAry[imageIdentifier]=[];
                      
                      const dataContent = {from:chat_config.PeerId , data:event.data[onekey] };
                      sendto.forEach( function(element, index, array){
                          //mypostWinMessageChannel(winobj_imageboard_channelPort[element] , "requestedImage" ,dataContent);
                          window.webRTC_SendDataFromOutModule( element , "requestedImage" , dataContent );
                      });
                    }
                    break;
                    
                    
                }
            });
        }
    }
}

//-----------------------------------------------------
function check_winChildOpen(strId){
        let closeflg=1;
        let tgtwinobj;
        if(winobj_imageboard){ 
            tgtwinobj=winobj_imageboard[strId];
            if(tgtwinobj){ 
                if(tgtwinobj.closed!=null) {
                    if(!tgtwinobj.closed) closeflg=0; 
        }   }   }
        
        if(closeflg){
            console.log("[Info] chat-window Lost.");
            if(winobj_imageboard[strId]){
                delete winobj_imageboard[strId];
            }
            let tgtElem = document.getElementById(htmlElementId_whiteboard_sw);
            if(tgtElem){ 
                tgtElem.value="表示する";
            }
        }else{
            setTimeout(function(){check_winChildOpen(strId);},5000);
        }
}



function mypostWinMessageChannel(tgtPort0,key,data=""){
    const sendmsg = {};
    sendmsg[key]=data;
    
    let tgtport=null;
    if(tgtPort0){if(tgtPort0.postMessage){
        tgtport = tgtPort0;
    }}
    if(!tgtport){
        if(typeof tgtPort0=="string"){
            if(winobj_imageboard_channelPort){if(winobj_imageboard_channelPort[tgtPort0]){
                if(winobj_imageboard_channelPort[tgtPort0].postMessage){
                    tgtport = winobj_imageboard_channelPort[tgtPort0];
                }
            }}
        }
    }
    
    if(tgtport){
        tgtport.postMessage( sendmsg );
    }else{
        console.log("[Error] no winMessage channel Port : "+ tgtPort0 );
    }
}
function mypostWinMessageToAllChannel(key,data=""){
    if(!winobj_imageboard) return 0;
    if(!Object.keys(winobj_imageboard)) return 0;
    if(!Object.keys(winobj_imageboard).length) return 0;
    if(Object.keys(winobj_imageboard).length==0) return 0;
    
    let ans=0;
    for (let winId in winobj_imageboard){
        const tgtport = winobj_imageboard_channelPort[winId];
        if(tgtport){
            mypostWinMessageChannel(tgtport,key,data);
            ans++;
        }
    }
    return ans;
}
//----------- init MessageChannel --------
function createWinMessageChannel(deleteFlg=0){
    if(deleteFlg==0){
        window.addEventListener('message', WinMessageAction );
    }else{
        window.removeEventListener('message', WinMessageAction );
    }
}
function WinMessageAction(event){
        if( (window.location.origin!="file://" && window.location.origin!="null") && 
            ((event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin )){   
            console.log("[Error] got illegal Message from : "+ event.origin );
        }else{
            let flg=1;
            if(typeof (event.data) =="string"){
                let tgtId = event.data;
                if(winobj_imageboard){if(winobj_imageboard[tgtId]){
                    flg=0;
                    if(winobj_imageboard_channelPort[tgtId]){
                        winobj_imageboard_channelPort[tgtId].removeEventListener("message",  winMessageChannelAction  );
                    }
                    let channel=new MessageChannel();
                    channel.port1.myId=tgtId;
                    channel.port2.myId=tgtId;
                    mypostWinMessage(event.source,"channel", channel.port2 );
                    winobj_imageboard_channelPort[tgtId] = channel.port1;
                    channel.port1.addEventListener("message",  winMessageChannelAction  );
                    channel.port1.start();
                    console.log("[Info] send Message-Channel to ["+tgtId+"] : "+ event.origin );
                    createWinMessageChannel(1); // Winメッセージを閉じる:以後はメッセージチャンネルで通信する
                    
                }}
            }
            if(flg){
                switch(event.data){
            //      case "request channel":
            //          break;
                    default:
                        console.log("[Error] got unknown Message ["+event.data+"] from : "+ event.origin );
                }
            }
        }
}

function mypostWinMessage(tgtwin,data="",dataObj=null){
    let origin = window.location.origin;
    if(origin=="file://" || origin=="null") origin="*";
    
    if(tgtwin){if(tgtwin.postMessage){
        if(!dataObj) { tgtwin.postMessage( data , origin );
        }else { tgtwin.postMessage( data , origin , [dataObj] );
        }
    }}
}


// ===== test ======
function test(){
   let connary = window.webRTC_getAllConnections();
   let dmy=0;
}
function createTestBtn(){
    const bodytag = document.body;
    let strElem =`<input id="button_test001" type="button" value="test" onclick="test()">`;
    
    bodytag.insertAdjacentHTML("beforeend",strElem);
}
//setTimeout( createTestBtn ,3000 );
