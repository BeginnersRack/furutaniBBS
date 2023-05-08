import { addNewDataToChatMessageLog } from "./udonChatMessageLog.js";
import { webRTC_SendData2All } from "./udonWebRTC.js";
import { G }  from "./myGlobalParams.js";
import { Ghtml  }  from "./udonChatHTML_elements.js";


export { htmlElemInit_TextMessageChat , recieveNewChatMessage , sendNewChatMessage }










function htmlElemInit_TextMessageChat(){
   //elemText_chatMessage_SW = document.getElementById("textarea_chatMessage-input_sw");
   if(Ghtml.elemText_chatMessage_SW){
     Ghtml.elemText_chatMessage_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         let tgtmsg;
         if(Ghtml.elemText_chatMessage){
             tgtmsg = Ghtml.elemText_chatMessage.value;
             if(tgtmsg){if(tgtmsg!=""){
                   sendNewChatMessage(tgtmsg);
             }}
             Ghtml.elemText_chatMessage.value ="";
         }
         
         e.target.removeAttribute("disabled");
     });
   }
}






function sendNewChatMessage(tgtmsg){
    //チャットに送信する
    
    webRTC_SendData2All("CM",tgtmsg);
    

    // 自分のLog画面に表示
    let tgtid = "";
    if(G.SkyWayPeer) { tgtid = G.SkyWayPeer.id; }
    recieveNewChatMessage(tgtid,tgtmsg)
    
}


// メッセージ受信イベントの設定

function recieveNewChatMessage(strid,data,crflg=0) {
    
    addNewDataToChatMessageLog(strid,data,crflg);
    
}


