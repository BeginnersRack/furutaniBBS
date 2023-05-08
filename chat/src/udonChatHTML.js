

import {G} from "./myGlobalParams.js";
import { Ghtml  , c_elemEvent_input }  from "./udonChatHTML_elements.js";

import { htmlElemInit_Voicerecognition } from "./udonChatHTML_VoiceRecognition.js";
import { startMultiparty ,htmlElemInit_WebRTC ,quitAllConnection ,connectedDatasModifyFlg} from "./udonWebRTC.js";
import { htmlElemInit_MediaStream  } from "./udonMediaStream.js";
import { htmlElemInit_RecordVoice  , mediaRecorder  } from "./udonRecordVoice.js";
import { htmlElemInit_TextMessageChat , sendNewChatMessage } from "./udonTextMessageChat.js";
import { htmlElemInit_MessageLog } from "./udonChatMessageLog.js";
import { getCookie , setCookie } from "./myfunc_cookie.js";
import { getReplyWinMessage,mypostWinMessage } from "./myfunc_windowMessage.js";





// DOM要素の構築が終わった場合に呼ばれるイベント
// - DOM要素に結びつく設定はこの中で行なう

document.addEventListener('DOMContentLoaded', function() {  // <<< $(function() {
    myOnload();
})
async function myOnload(){
  Ghtml.elemStream_SW =  document.getElementById('my-stream_sw');
  Ghtml.elemStream_SW_Msg =  document.getElementById('my-stream_sw_message');
  Ghtml.elemVideo_STTS =  document.getElementById('my-video_status');
  Ghtml.elemMic_SW =  document.getElementById('my-mic_sw');
  Ghtml.elemMic_STTS =  document.getElementById('my-mic_status');
  Ghtml.elemRange_microphoneLevel = document.getElementById('my-microphoneLevel');
  Ghtml.elemRange_microphoneLevelCurVal = document.getElementById('my-microphoneLevel_currentValue');


  Ghtml.elemCheckBox_micProperties = document.getElementsByName("my-checkbox_microphoneProps");
  Ghtml.elemRadio_micEchoCancel= document.getElementsByName("my-radio_microphoneEchoCancel");
  Ghtml.elemTextArea_ResultRecognition = document.getElementById("textarea_ResultRecognition");
  Ghtml.elemTextArea_ResultRecognitionP= document.getElementById("textarea_ResultRecognition_pre");
  Ghtml.elemCheckBox_ResultRecognition = document.getElementById("my-checkbox_recordRecognition");
  Ghtml.elemCheckBox_ResultRecognition_chat = document.getElementById("my-checkbox_recordRecognition_directChat");
  Ghtml.elemText_ResultRecognitionStatus = document.getElementById("text_ResultRecognition_status");
  Ghtml.elemText_chatMessage = document.getElementById("textarea_chatMessage-input");
  Ghtml.elemText_chatMessage_SW = document.getElementById("textarea_chatMessage-input_sw");
  Ghtml.elemText_chatMessage_log = document.getElementById("textarea_chatMessage-log");
  Ghtml.elemText_chatMessage_saveSW = document.getElementById("textarea_chatMessage-logsave_sw");
  Ghtml.elemText_chatMessage_saveBlobLink = document.getElementById("textarea_chatMessage-save_bloblink");
  
  Ghtml.elemRec_SW =  document.getElementById('my-rec_sw');
  Ghtml.elemTextArea_RecSound = document.getElementById('textarea_ResultRecSound');

  Ghtml.elemVideo = document.getElementById('my-video');
  Ghtml.elemVideo_SW=  document.getElementById('my-video_sw');
  Ghtml.elemRange_VideoFrameRate = document.getElementById('my-video_rate');
  Ghtml.elemRange_VideoFrameRateCurVal = document.getElementById('my-video_rate_currentValue');
  
  
  Ghtml.elemVolume_SW =  document.getElementById('my-volume_sw');
  Ghtml.elemRange_VolumeLevel = document.getElementById('my-volumeLevel');
  Ghtml.elemRange_VolumeLevelCurVal = document.getElementById('my-volumeLevel_currentValue');


  Ghtml.elemText_myPeerId = document.getElementById("my-peer-id");
  Ghtml.elemText_myPeerId_copySW = document.getElementById("my-peer-id-copy_sw");
  Ghtml.elemDiv_streams = document.getElementById("streams");
  Ghtml.elemAddNewPeer_SW = document.getElementById("my-addNewPeer");
  Ghtml.elemText_AddNewPeerID = document.getElementById("peer-id-input");

  
  
  
   //音声認識
   if(Ghtml.elemCheckBox_ResultRecognition){
      htmlElemInit_Voicerecognition();
   }
  
  
   //テキストチャット
   //elemText_chatMessage_SW = document.getElementById("textarea_chatMessage-input_sw");
   if(Ghtml.elemText_chatMessage_SW){
      htmlElemInit_TextMessageChat();
   }
   //  elemText_chatMessage_saveSW = document.getElementById("textarea_chatMessage-save_sw");
   if(Ghtml.elemText_chatMessage_saveSW){
     htmlElemInit_MessageLog();
   }



   // 音声録音
   //elemRec_SW =  document.getElementById('my-rec_sw');
   if(Ghtml.elemRec_SW){
     htmlElemInit_RecordVoice();
   }
   const recSwDiv=document.getElementById('div-rec_sw');
   if(recSwDiv){if(1==2){ recSwDiv.style.visibility ="visible";
   }}


   // 音声/映像ストリーム関係
   htmlElemInit_MediaStream();
   
   



   //  elemText_myPeerId_copySW = document.getElementById("my-peer-id-copy_sw");
   if(Ghtml.elemText_myPeerId_copySW){
     Ghtml.elemText_myPeerId_copySW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         if(Ghtml.elemText_myPeerId){
             Ghtml.elemText_myPeerId.readOnly=false;
             Ghtml.elemText_myPeerId.removeAttribute("readonly");
             
             Ghtml.elemText_myPeerId.select();
             document.execCommand("copy"); 
             getSelection().empty();
             
             Ghtml.elemText_myPeerId.setAttribute("readonly","");
             Ghtml.elemText_myPeerId.readOnly=true;
         }
         
         e.target.removeAttribute("disabled");
     });
   }





   //   通信先接続相手を追加
   // elemAddNewPeer_SW = document.getElementById("my-addNewPeer");
   if(Ghtml.elemAddNewPeer_SW){
       htmlElemInit_WebRTC();
   }








   
   
   
   
   
   
   
   
   
   
   
   
   
   // ======================================================
   
   let strValue=getCookie("recentPeerId");
   if(strValue){if(strValue!=""){
      if(Ghtml.elemText_AddNewPeerID){
          Ghtml.elemText_AddNewPeerID.value=strValue;
      }
   }}
   
   
   
   
   // =============================
   // WebRTC 開始
   // =============================
   let skywayKey = await getReplyWinMessage("skywaykey",""); //親画面からkeyを取得する
   startMultiparty(skywayKey);
   
   
   mypostWinMessage("log","chatWindow stand by.")
}



// =========================================

let flgForceClose=0;
window.addEventListener("beforeunload", function(event) {


    //接続先PeerIDをクッキーに保存しておく
    const cookieName = "recentPeerId";
    let strValue="";
    if(G.connectedDatas){
        for (let peerid in G.connectedDatas) {
            if(peerid!=G.SkyWayPeer.id){
                strValue=peerid;
            }
        }
    }
    
    if(strValue!=""){
        setCookie(cookieName,strValue,(0.5)); //保持時間を日で指定
    }
    




    if(1==1){
        //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
        //    このため、ページ遷移警告の後に切断処理等をおこなうことはできない。
        if(!flgForceClose){
            event.preventDefault(); //ページ遷移警告の表示
            event.returnValue = ''; //ページ遷移警告の表示
        }
    }else{
        //--- 切断 --- 
        sendNewChatMessage("(退出)");
        quitAllConnection();
    }
    
});
const terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
window.addEventListener(terminationEvent, function(event) {

    //--- 切断 --- 
    //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
    //    このため、ページ遷移警告の後に切断処理等をおこなうことはできない。
    //sendNewChatMessage("(退出)");
    //quitAllConnection();
    
    mypostWinMessage("quit","");//親windowへ通知
    
    let intCnt=Object.keys(G.connectedDatas).length;
    if (intCnt>0){
        sendNewChatMessage("(退出)");
        quitAllConnection();
        
        // 終了するまでの時間稼ぎをする(ただし最大30秒まで)
        let tgttime = new Date();
        tgttime.setSeconds( tgttime.getSeconds() + 30);
        
        while (intCnt>0) {
            if(connectedDatasModifyFlg!=0) { intCnt=1; }
            else{intCnt = Object.keys(G.connectedDatas).length;
                if(intCnt==0){
                    intCnt=1;
                    let sc = new Date();
                    sc.setSeconds( sc.getSeconds() + 2);
                    if(sc<tgttime)tgttime=sc;
                }
            }

            let nowtime = new Date();
            if(nowtime>tgttime) intCnt=0;
        }
        
    }
    
    
});

function self_close(){
    mypostWinMessage("quit","");//親windowへ通知
    quitAllConnection();
    flgForceClose=1;
    window.close();
}
//=====================
export { self_close };
