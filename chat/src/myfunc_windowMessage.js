import { changeParticipant } from "./udonWebRTC.js";
import { self_close } from "./udonChatHTML.js";
import { G }  from "./myGlobalParams.js";

const parentWindowDatas={};

function standbyToStartReceiveWinMessage(){
    window.addEventListener('message', chatwin_messageAction );
    console.log("[Info] start receive windowMessage." );
}
standbyToStartReceiveWinMessage();
function chatwin_messageAction(event){
    if( (event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin){   
        console.log("[Error] got illegal Message from : "+ event.source.location.origin );
    }else{
        if (!(event.data instanceof Object) || (event.data instanceof Array)){
            console.log("[Error] got not-regular Message from : "+ event.origin );
        }else{
            Object.keys(event.data).forEach((onekey) => {
                console.log("[Info] got window-Message ["+onekey+"] from : "+ event.origin );
                let afterEffectFunc=null;
                switch(onekey){
                  case "quit":
                    window.removeEventListener('message', chatwin_messageAction );
                    self_close();
                    break;
                  case "log":
                    console.log("[Info] got Message : "+ event.data[onekey] );
                    break;
                  case "participants":
                    console.log("[Info] got Message 'participants' " );
                    parentWindowDatas.participants = event.data[onekey];
                    afterEffectFunc = changeParticipant;
                    break;
                  case "roomlist":
                    parentWindowDatas.RoomList = event.data[onekey];
                    afterEffectFunc = changeParticipant;
                    break;
                  case "roomid":
                    parentWindowDatas.RoomId = event.data[onekey];
                    break;
                  case "check_peerid":
                    console.log("[Info] got Message : required 'peerId' " );
                    mypostWinMessage("check_peerid",(G.SkyWayPeer.id).toString());
                    break;
                  
                  
                  //--------------------
                  case "skywaykey": // waitMessageCallbackAryで処理するため、ここでは何もしない
                    console.log("[Info] got Message ["+onekey+"] : " + event.data[onekey]);
                    break; 
                  case "useremail": // waitMessageCallbackAryで処理するため、ここでは何もしない
                    console.log("[Info] got Message ["+onekey+"] : " + event.data[onekey]);
                    break; 
                    
                  default:
                    console.log("[Error] got unknown Message ["+onekey+"] from : "+ event.origin );
                }
                if(waitMessageCallbackAry){ if(onekey in waitMessageCallbackAry){if(typeof waitMessageCallbackAry[onekey] =="function"){
                    console.log("[Info] callback window-Message ["+onekey+"] " );
                    waitMessageCallbackAry[onekey](event.data[onekey]);
                    waitMessageCallbackAry[onekey]=null;
                }}}
                if(afterEffectFunc){if(typeof afterEffectFunc =="function"){
                    setTimeout( afterEffectFunc ,100);
                }}
            });
        }
    }
}
function mypostWinMessage(key,data=""){
    const sendmsg = {};
    sendmsg[key]=data;
    
    console.log("[Info] send window-Message ["+key+"] to opener-window." );
    let flg=1;
    if(window.opener){if(window.opener.postMessage){
        window.opener.postMessage( sendmsg , window.location.origin );
        flg=0;
    }}
    if(flg){
        console.log("[Error] cannot find window-opener." );
        window.removeEventListener('message', chatwin_messageAction );
        self_close();
    }
}
let waitMessageCallbackAry={};
function getReplyWinMessage(reqkey,key,data=""){
    if(key){
        let flg=1;
        if(waitMessageCallbackAry){ if(key in waitMessageCallbackAry){if(typeof waitMessageCallbackAry[key] =="function"){
            console.log("[Info] request Message : key="+ key +" is already required." );
            flg=0;
        }}}
        if(flg){
            return new Promise((resolve, reject) => {
                const timerId_suicide = setTimeout(function(){getReplyWinMessage_suicide(key);}, 10000);
                console.log("[Info] request Message : ["+ key +"] "+ timerId_suicide.toString() );
                waitMessageCallbackAry[key]=function(dt){
                    clearTimeout(timerId_suicide);
                    console.log("[Info] got Message : ["+ key +"] resolve." );
                    resolve(dt);
                }
                mypostWinMessage(reqkey,data); // 親windowへ情報を要求
            });
        }
    }
}
function getReplyWinMessage_suicide(msg){
    if(msg){
        console.log("[Info] getReplyWinMessage_suicide : "+ msg +" " );
    }
            if(confirm("windowMessageがTimeoutしました。閉じてください。\n"+msg)){
                window.removeEventListener('message', chatwin_messageAction );
                self_close();
            }
}

export { getReplyWinMessage,mypostWinMessage ,parentWindowDatas};
