import { changeParticipant } from "./udonWebRTC.js";
import { self_close } from "./udonChatHTML.js";
import { G }  from "./myGlobalParams.js";

const parentWindowDatas={};

window.addEventListener('message', chatwin_messageAction );
function chatwin_messageAction(event){
    if( (event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin){   
        console.log("[Error] got illegal Message from : "+ event.source.location.origin );
    }else{
        if (!(event.data instanceof Object) || (event.data instanceof Array)){
            console.log("[Error] got not-regular Message from : "+ event.origin );
        }else{
            Object.keys(event.data).forEach((onekey) => {
                if(waitMessageCallbackAry){ if(onekey in waitMessageCallbackAry){if(typeof waitMessageCallbackAry[onekey] =="function"){
                    waitMessageCallbackAry[onekey](event.data[onekey]);
                }}}
                switch(onekey){
                  case "quit":
                    window.removeEventListener('message', chatwin_messageAction );
                    self_close();
                    break;
                  case "log":
                    console.log("[Info] got Message : "+ event.data[onekey] );
                    break;
                  case "participant":
                    console.log("[Info] got Message 'participant' " );
                    parentWindowDatas.participants = event.data[onekey];
                    
                    break;
                  case "roomlist":
                    parentWindowDatas.RoomList = event.data[onekey];
                    break;
                  case "check_peerid":
                    console.log("[Info] got Message : required 'peerId' " );
                    mypostWinMessage("check_peerid",(G.SkyWayPeer.id).toString());
                    break;
                  
                  
                  //--------------------
                  case "skywaykey": // waitMessageCallbackAryで処理するため、ここでは何もしない
                    break; 

                  default:
                    console.log("[Error] got unknown Message ["+onekey+"] from : "+ event.origin );
                }
            });
        }
    }
}
function mypostWinMessage(key,data=""){
    const sendmsg = {};
    sendmsg[key]=data;
    
    window.opener.postMessage( sendmsg , window.location.origin );
}
let waitMessageCallbackAry={};
function getReplyWinMessage(key,data){
    return new Promise((resolve, reject) => {
        waitMessageCallbackAry[key]=function(dt){
            resolve(dt);
        }
        mypostWinMessage(key,data); // 親windowへ情報を要求
    });
}



export { getReplyWinMessage,mypostWinMessage ,parentWindowDatas};
