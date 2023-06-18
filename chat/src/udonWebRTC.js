import { c_DataContainer } from "./myClasses.js";
import { domAppendOrRemoveforPeer ,audioContextCtrls } from "./udonChatHTML_VideoStreamElement.js";
import { getCookie , setCookie } from "./myfunc_cookie.js";
import { recieveNewChatMessage,sendNewChatMessage } from "./udonTextMessageChat.js";
import { addNewDataToChatMessageLog } from "./udonChatMessageLog.js";
import { mediaRecorder ,recreateAudioOutputStream } from "./udonRecordVoice.js";
import { msgpack_encode,msgpack_decode } from "./myfunc_MessagePack.js";

import { G }  from "./myGlobalParams.js";
import { Ghtml ,   c_audioContext}  from "./udonChatHTML_elements.js";

import {forceOnElemStream_SW} from "./udonMediaStream.js"; // 循環参照に注意
//let forceOnElemStream_SW;
//import("./udonChatHTML.js").then((module)=>{
//          forceOnElemStream_SW = module.forceOnElemStream_SW;
//});


export { startMultiparty ,htmlElemInit_WebRTC ,deletePeerFromCallList , deletePeerFromDataList ,quitAllConnection , sendStreamToPeer ,webRTC_SendData2All ,connectedDatasModifyFlg}

import { getReplyWinMessage,mypostWinMessage ,parentWindowDatas} from "./myfunc_windowMessage.js";
export { changeParticipant }


// ===================================================
let connectedDatasModifyFlg=0;




// ===================================================
function htmlElemInit_WebRTC(){
   // elemAddNewPeer_SW = document.getElementById("my-addNewPeer");
   if(Ghtml.elemAddNewPeer_SW){
     Ghtml.elemAddNewPeer_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         let tgtpeerid;
         if(Ghtml.elemText_AddNewPeerID){
             tgtpeerid = Ghtml.elemText_AddNewPeerID.value;
             if(tgtpeerid){
               if(tgtpeerid!=""){
                   addNewPeer(tgtpeerid);
               }
             }
             Ghtml.elemText_AddNewPeerID.value ="";
         }
         e.target.removeAttribute("disabled");
     });
   }
}




// ===================================================

function startMultiparty(swkey){
  
  // SkyWayのシグナリングサーバーへ接続する
  G.SkyWayPeer = getSkywayPeerInstance(swkey);
  
  if(G.SkyWayPeer){
    // シグナリングサーバへの接続が確立したときに、このopenイベントが呼ばれる
    G.SkyWayPeer.on('open', function(){
      // 自分のIDを表示する
      // - 自分のIDはpeerオブジェクトのidプロパティに存在する
      // - 相手はこのIDを指定することで、通話を開始することができる
      const mypeerId = (G.SkyWayPeer.id).toString()
      Ghtml.elemText_myPeerId.value = mypeerId;
      
      mypostWinMessage("push_peerid",mypeerId);
    });
    

    // 相手からデータ通信の接続要求イベントが来た場合、このconnectionイベントが呼ばれる
    // - 渡されるconnectionオブジェクトを操作することで、データ通信が可能
    G.SkyWayPeer.on('connection', function(dataConnection){
            createNewPeerSettingData(dataConnection)
    });

    // 相手からビデオ通話がかかってきた場合、このcallイベントが呼ばれる
    // - 渡されるcallオブジェクトを操作することで、ビデオ映像を送受信できる
    G.SkyWayPeer.on('call', function(callConnection){
            createNewPeerSettingCall(callConnection);
    });

    G.SkyWayPeer.on("close", () => {
      let i=0;
    });
  }
  
  
  
  // 接続の初期化(ON)
  // toggleElemStream_SW();
  
}


// 新しい接続先に此方から接続に行った場合。 利用者の操作からの処理である場合 actionFlg=1
function addNewPeer(newPeerID,actionFlg=1){
  if(G.SkyWayPeer){
    forceOnElemStream_SW();
    
    // 相手と通話を開始して、自分のストリームを渡す
    sendStreamToPeer(newPeerID);
    
    // 相手へのデータ通信接続を開始する
    connectDataToPeer(newPeerID,actionFlg);
    
  }
}
function sendStreamToPeer(newPeerID){
    // 相手と通話を開始して、自分のストリームを渡す
    let call = G.SkyWayPeer.call(newPeerID, G.localStream);
    if(call){
        //call.on("open", function() {
            // 相手のストリームが渡された場合のイベントを設置する
            createNewPeerSettingCall(call);
        //})
    }
}
function connectDataToPeer(newPeerID,actionFlg=0){
    // 相手へのデータ通信接続を開始する
    let conn = G.SkyWayPeer.connect(newPeerID);

    if(conn){
            createNewPeerSettingData(conn,1,actionFlg);
            // 相手のIDを表示する
            // - 相手のIDはconnectionオブジェクトのidプロパティに存在する
            //$("#peer-id").text(conn.remoteId);


    }
}
function createNewPeerSettingData(dataConnection,directionFlg=0,actionFlg=0){
    //新規の通信相手を設定する(data)  dataConnection.remoteId は相手のPeerID
    // directionFlg=1:こちらからの接続要求。0：向こうからの接続要求
    console.log("debug : createNewPeerSettingData() "+(directionFlg==1 ? "to ":directionFlg==0 ? "from ":"??? ")+dataConnection.remoteId+"."  );

    forceOnElemStream_SW();

     if (dataConnection.remoteId in G.connectedDatas) {
         console.log("Warning (debug): コネクションojb上書き発生 ["+dataConnection.remoteId+"]."  );
     }else{
         addNewDataToChatMessageLog(dataConnection.remoteId,"(接続)",1); // 自分のLog画面に表示
     }


      
     // 切断時に利用するため、コネクションオブジェクトを保存しておく
      G.connectedDatas[dataConnection.remoteId] = dataConnection;

     // 通信相手一覧のHTML-Domを設置する
      if(!(document.getElementById('div_peerid-'+dataConnection.remoteId))){
          domAppendOrRemoveforPeer(1,dataConnection.remoteId); //Dom生成
      }
      
      
      // メッセージ受信イベントの設定
      dataConnection.on("data", function(data){
            checkRecievedDataStatus(dataConnection.remoteId , data);
      });
      
      //先方から接続が切断された場合の処理
      dataConnection.on("close", function(data){
            let i=0;   // dummy
            deletePeerFromCallList(dataConnection.remoteId);//データ接続切断時は映像/音声も切断する
            deletePeerFromDataList(dataConnection.remoteId);
      });
      
      
      dataConnection.on("open", function(data){
          if(actionFlg!=0){ //こちらからの要求操作である場合
              //こちらで保持している接続先を相手に送信する
              sendListConnection(dataConnection.remoteId,1); // 送信先相手に、再送信要求付を付ける
          }
      });
      


   
}
function sendListConnection(remoteId,requireCastFlg=0){
    //こちらで保持している接続先を相手に送信する
    if(remoteId){if (remoteId in G.connectedDatas){
        let conn = G.connectedDatas[remoteId];
        if(conn){if(conn.open) {
            let strlist = ""; 
            if(!(remoteId in G.connectedDatas)){ strlist = ","+(remoteId.toString(10)) }
            for (let key in G.connectedDatas) {
                strlist += (","+key);
            } 
            
            let stts="CL";
            if (requireCastFlg!=0) stts+="2"; // 再送信要求付 CL2
            
            //conn.send(stts+strlist); //strlistの最初はカンマ
            webRTC_SendData(conn,stts,strlist);
        }}
    }}
    
}
function createConnectionByList(strList,mode=1){
    //与えられた接続先リストを確認し、未接続な相手があれば接続を試みる
    // mode=0:通常、1:IDが自分より大きい相手のみ、2:小さい相手のみ 
    let ans =0;
    let flg=0;
    let flg2=1;// (Mode1,2はそのままではどうもうまく動作しない。時間差をつけて疑似mode0化する)
    
    let tgtlist = strList.split(",");
    for (const tgtId of tgtlist) {
        if(tgtId){if(tgtId!=""){if(tgtId!=G.SkyWayPeer.id){
            if (!(tgtId in G.connectedDatas)){
                flg=0;
                switch(mode){
                    case 0:
                        flg=1;
                        break;
                    case 1:
                        if(tgtId>G.SkyWayPeer.id) {flg=1;}
                        break;
                    case 2:
                        if(tgtId<G.SkyWayPeer.id) {flg=1;} 
                        break;
                    default:
                        flg=0;
                }
                if (flg!=0){
                    addNewPeer(tgtId,0);
                    ans++;
                }else{ //G.connectedDatasにのみ追加（接続はしない）
                    //G.connectedDatas[tgtId]=null;
                    //ロジックに穴がある。mode1,2で接続を後回しにされた接続先には、接続先リストも配信されないバグ
                }
            }
        }}}
    }
    
    if(ans!=0){
        console.log("debug : createConnectionByList Mode"+String(mode)+" finish "+String(ans)+"."+(mode==2 ? "[Warning]delay!":"")  );
    }

    if(flg2!=0){
        if (mode==1){
            setTimeout( function(){createConnectionByList(strList,2)} ,1000 );
        }
      //if (mode==2){
      //    setTimeout( function(){createConnectionByList(strList,1)} ,1000 );
      //}
    }
    return ans;
}
function allSendListConnection(expires=""){
    //全ての接続先に、こちらの接続先リストを送信する。但しExpiresを除く
    for (let key in G.connectedDatas) {
        if(key){if(key!=""){if(key!=G.SkyWayPeer.id){if(key!=expires){
            sendListConnection(key); // keyは送信先
        }}}}
    }
}




//20220813
function webRTC_SendData2All( type , data){
    for (let key in G.connectedDatas) {
       let conn = G.connectedDatas[key];
       webRTC_SendData(conn,type,data);
    }
}
function webRTC_SendData(targetConnect , type , data){
    if(targetConnect.open) {
        let dataInstance= new c_DataContainer();
        dataInstance.data = data;
        dataInstance.datatype = type;
        //targetConnect.send("CM,"+tgtmsg);
        
        let pkg=msgpack_encode(dataInstance);
        if(pkg){
            targetConnect.send( {msg:pkg,length:pkg.length} );
        }else{
            console.log("Warning(debug):msgpack_encodeに失敗");
        }
        //delete dataInstance;
    }
}

function checkRecievedDataStatus(remoteId,pkg0){
  // 受信データを種別で振分けする。remoteIdは送信者。
  
  let collectFlg=0;
  
  let pkg = new Uint8Array(pkg0.msg,0,pkg0.length);
  let dataInstance=msgpack_decode(pkg);

  if(dataInstance){
    if( typeof(dataInstance)=="object"){
      //let aaa = Object.prototype.toString.call(dataInstance);
      //if( aaa=="[object c_DataContainer]"){
        //if (dataInstance instanceof c_DataContainer){
            if((dataInstance.data)&&(dataInstance.datatype)){
                
                let data2 = dataInstance.data;
                if(dataInstance.isCompressed){data2 = data.data;}
                
                switch(dataInstance.datatype){
                  case "CM": // Chatメッセージ
                      recieveNewChatMessage(remoteId,data2);
                      break;
                  case "CL": // ConnectionList 接続先一覧
                  case "CL2": // 再送信要求付
                      console.log("debug : recieve ConnectionList(CL2) from "+remoteId+". "+data2  );
                      createConnectionByList(data2,1);
                      if(dataInstance.datatype=="CL2") {
                          allSendListConnection(); //新規入室者を全メンバーに通知
                          //sendNewChatMessage("(入室) "+remoteId); // 入室者はremoteIdであり、自分は申請受付者になる
                      }
                      break;
                  default:
                      console.log("Warning(debug):["+remoteId+"]より不正なデータ("+data.datatype+")を受信 : " + data);
                      break;
                }
                collectFlg=1;
                
            }
        //}
      //}
    }
  }
  
  if(collectFlg==0){
    console.log("Warning(debug):["+remoteId+"]より不正なデータを受信 ");
  }
  
}




function createNewPeerSettingCall(callConnection){
    //新規の通信相手を設定する(Stream)
   
   // 切断時に利用するため、コールオブジェクトを保存しておく
   G.connectedCalls[callConnection.remoteId] = callConnection;
   
   // 通信相手一覧のHTML-Domを設置する
   //if(!(document.getElementById('div_peerid-'+callConnection.remoteId))){
   //   domAppendOrRemoveforPeer(1,callConnection.remoteId); //Dom生成
   //}
   
   if(callConnection._options.payload){
       // 自分の映像ストリームを相手に渡す
       // - getUserMediaで取得したストリームオブジェクトを指定する
       if(!G.localStream) {
          G.localStream=new MediaStream();
       }
       callConnection.answer(G.localStream);
       
   }
   
      
      // 相手のストリームが渡された場合、このstreamイベントが呼ばれる
      // - 渡されるstreamオブジェクトは相手の映像についてのストリームオブジェクト
      
      callConnection.on('stream', function(stream){
          // 映像ストリームオブジェクトをURLに変換する
          // - video要素に表示できる形にするため変換している
          let tgtelem;
          
          tgtelem=document.getElementById('peervideo-'+callConnection.remoteId);
          
          if(tgtelem){
             
            if ('srcObject' in tgtelem) {
                tgtelem.srcObject = stream;
            }else{
                // var blob=new Blob([data],{type:"audio/webm"})
                // tgtelem.src=win.URL.createObjectURL(blob)
                tgtelem.src = URL.createObjectURL(stream)
            }
            
            //録音用GainNodeへの設定
            if(callConnection.remoteId in audioContextCtrls){
             if(audioContextCtrls[callConnection.remoteId].gainNode){
                let audioTracks = stream.getAudioTracks();
                if(audioTracks.length) {if(audioTracks[0]){
                    //audioContextCtrls[callConnection.remoteId].orgStream=new MediaStream(audioTracks);
                    audioContextCtrls[callConnection.remoteId].orgStream=stream;
                    //let audioSource = c_audioContext.createMediaStreamSource(stream);
                    let audioSource = c_audioContext.createMediaStreamSource(new MediaStream(audioTracks));
                    audioSource.connect(audioContextCtrls[callConnection.remoteId].gainNode);
                    audioContextCtrls[callConnection.remoteId].gainNode.gain.value =1;
                    
                }}
            }}
            
                 //映像再生の開始
            if(1==2){   // HTML側で属性の指定をした場合は不要か
              tgtelem.addEventListener('loadedmetadata', e => {
                  tgtelem.volume = 0.3;
                  tgtelem.muted = false;
                  tgtelem.controls=true;
                  tgtelem.play();
              });
            }
            
            
            
            //録音に通知
            if(mediaRecorder!==null){
                recreateAudioOutputStream();
            }
            
          }
      });

      //先方から接続が切断された場合の処理
      callConnection.on("close", () => {
          let i=0;  // dummy
          deletePeerFromCallList(callConnection.remoteId);
      });


}



function deletePeerFromCallList(tgtPeerID){
   
   if ((tgtPeerID in G.connectedCalls) == true) {
      
      // 切断時に利用するため保存しておいた コールオブジェクト
      let call = G.connectedCalls[tgtPeerID];
      
      //切断
      if(call) call.close(true);
      
      //接続先リストから削除する
      delete G.connectedCalls[tgtPeerID];
      
   }
   //Dom削除
   //if ((tgtPeerID in G.connectedDatas) != true) {
   //    domAppendOrRemoveforPeer(0,tgtPeerID);
   //}
   
}
function deletePeerFromDataList(tgtPeerID){
   connectedDatasModifyFlg=1;
   if ((tgtPeerID in G.connectedDatas) == true) {
      
      // 切断時に利用するため保存しておいた コールオブジェクト
      let conn = G.connectedDatas[tgtPeerID];

      //切断
      if(conn) conn.close(true);
      
      //接続先リストから削除する
      delete G.connectedDatas[tgtPeerID];
      
      addNewDataToChatMessageLog(tgtPeerID,"(退室)",1); // 自分のLog画面に表示
   }
   //Dom削除
   if ((tgtPeerID in G.connectedCalls) != true) {
      domAppendOrRemoveforPeer(0,tgtPeerID);
   }
   connectedDatasModifyFlg=0;
}

function quitConnection(tgtPeerID){
    //指定の接続先を切断する
   
   if(tgtPeerID in G.connectedCalls) {
      deletePeerFromCallList(tgtPeerID);
   }
   if(tgtPeerID in G.connectedDatas) {
      deletePeerFromDataList(tgtPeerID);
   }
   
}
function quitAllConnection(){
    //全ての接続先を切断する
   
   for (let tgtPeerID in G.connectedCalls) {
      deletePeerFromCallList(tgtPeerID);
   }
   for (let tgtPeerID in G.connectedDatas) {
      deletePeerFromDataList(tgtPeerID);
   }
   
}




function getSkywayPeerInstance(strKey){
    let ans;
    let varres;
    
    //if(!strkey){
    //    const cookieName = "SkyWayKey";
    //    varres = prompt( "SkyWay key" , getCookie(cookieName) );
    //    if(varres){  strKey=varres.toString();  }
    //}
    
    ans = new Peer({ key:strKey, debug: 3}); /* SkyWay keyを指定 */
        
    //    ans.on("open",(function(strKeyID){
    //        if(strKeyID){
    //           setCookie(cookieName,this.socket._key , 100);
    //        }
    //    }))
    
    
    return ans;
}


// --------------------------
async function changeParticipant(){
    console.log("[Info] start changeParticipant. " );
    const memberList = parentWindowDatas.participants;
    if(!parentWindowDatas.participants){console.log("[???] participants");return;}
    const loginUserEmail = G.loginUser.email;
    if(!loginUserEmail){console.log("[???] loginUserEmail");return;}
    if(!G.SkyWayPeer){console.log("[???] SkyWayPeer");return;}
    
    const recentRoomid0 = ( memberList[loginUserEmail] ? memberList[loginUserEmail].roomid : "");
    const recentRoomid = (recentRoomid0 ? recentRoomid0 :"");
    const recentRoomEnt0= ( memberList[loginUserEmail] ? memberList[loginUserEmail].enterflg : 0);
    const recentRoomEnt= ( recentRoomEnt0 ? recentRoomEnt0 : 0);
    
    // 切断
    for (let tgtPeerID in G.connectedDatas) {
        let flg=1;
        for (let key in memberList) {
            let mem = memberList[key];
            if( recentRoomid == (mem.roomid ? mem.roomid : "") ){
                if(mem.memberkey==tgtPeerID) {
                    if(mem.enterflg==recentRoomEnt) flg=0; // 同室に存在
                }
            }
        }
        if(flg){
            quitConnection(tgtPeerID);
        }
    }
    
    //接続
    for (let key in memberList) {
        if(key!=loginUserEmail){
            let mem = memberList[key];
            if( recentRoomid == (mem.roomid ? mem.roomid : "") ){
                if(mem.enterflg==recentRoomEnt){  // 同室に存在
                    if(!(mem.memberkey in G.connectedDatas)) {
                        try{
                            addNewPeer(mem.memberkey); // peerId追加
                        } catch(err){
                            console.log("[Error] SkyWayPeer - cannot connect to Peer["+mem.memberkey+"]:"+key);
                        }
                    }
                }
            }
        }
    }
    
}



