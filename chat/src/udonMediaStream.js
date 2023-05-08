import { Ghtml ,c_audioContext,c_elemEvent_input }  from "./udonChatHTML_elements.js"
import { G }  from "./myGlobalParams.js";
import { mediaRecorder ,recreateAudioOutputStream } from "./udonRecordVoice.js";
import { sendStreamToPeer } from "./udonWebRTC.js";

export { htmlElemInit_MediaStream  }
export { forceOnElemStream_SW }; 






// ============ 初期化実行 ================


let myNavigatorMediaDevices;

let videoTrack = null;
let audioTrack = null;

const c_gainNode = c_audioContext.createGain(); // マイク音量（感度）調整用



// カメラ／マイクにアクセスするためのメソッドを取得しておく
myNavigatorMediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
   getUserMedia: function(c) {
     return new Promise(function(y, n) {
       (navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia).call(navigator, c, y, n);
     });
   }
} : null);
if (!myNavigatorMediaDevices) {
  console.log("getUserMedia() not supported.");
}


//---
let videoConstraints = null;
let videoConstraintsText = "";
let audioConstraints = null;
let audioConstraintsText = "";


videoConstraintsText = '{ "width": {"max":320}, "height": {"max":240} ,"frameRate": { "ideal": 5, "max": 10 } }';
audioConstraintsText = '{ "sampleSize": 8, "channelCount": 1, "echoCancellation": false}';



// ============================

function htmlElemInit_MediaStream(){

   //elemRange_microphoneLevel = document.getElementById('my-microphoneLevel');
   //elemRange_microphoneLevelCurVal = document.getElementById('my-microphoneLevel_currentValue');
   if(Ghtml.elemRange_microphoneLevel){
     Ghtml.elemRange_microphoneLevel.addEventListener('input', function(e){
         update_elemRange_microphoneLevelCurVal();
         
         if(c_gainNode){
             c_gainNode.gain.value = e.target.value;
         }
         
     });
     
     Ghtml.elemRange_microphoneLevel.value = c_gainNode.gain.value; // 初期値
     Ghtml.elemRange_microphoneLevel.dispatchEvent(c_elemEvent_input);
   }
   
   //elemMic_SW =  document.getElementById('my-mic_sw');
   if(Ghtml.elemMic_SW){
     Ghtml.elemMic_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){
             e.target.value=0;
             e.target.innerText = "音声送信を開始";
             dispInfoStreamStatus(); //音声停止中
             
             if(G.localStream){
                 changAbleStream(G.localStream.getAudioTracks(),false);//Off
                 
             }
         }else{
             e.target.value=1;
             e.target.innerText = "音声送信を停止";
             dispInfoStreamStatus(); //音声送出中
             
             if(G.localStream){
                 changAbleStream(G.localStream.getAudioTracks(),true);//On
             }
         }
         e.target.removeAttribute("disabled");
     });
   }

   

   //elemCheckBox_micProperties = document.getElementsByName("my-checkbox_microphoneProps");
   if(Ghtml.elemCheckBox_micProperties){
     for (let i = 0; i < Ghtml.elemCheckBox_micProperties.length; i++){
       Ghtml.elemCheckBox_micProperties[i].addEventListener('change', function(e){
         allDisabledElement(Ghtml.elemCheckBox_micProperties,true);
         changeAudioConstraints();
         setTimeout(function(e){ allDisabledElement(Ghtml.elemCheckBox_micProperties,false);}, 1000); // 処理実行直後1秒間は続けて処理を行わない
       });
     }
   }
   //elemRadio_micEchoCancel= document.getElementsByName("my-radio_microphoneEchoCancel");
   if(Ghtml.elemRadio_micEchoCancel){
     for (let i = 0; i < Ghtml.elemRadio_micEchoCancel.length; i++){
       Ghtml.elemRadio_micEchoCancel[i].addEventListener('change', function(e){
         allDisabledElement(Ghtml.elemRadio_micEchoCancel,true);
         changeAudioConstraints();
         setTimeout(function(e){ allDisabledElement(Ghtml.elemRadio_micEchoCancel,false);}, 1000); // 処理実行直後1秒間は続けて処理を行わない
       });
     }
   }
   
   
    
    //elemVideo_SW =  document.getElementById('my-video_sw');
    if(Ghtml.elemVideo_SW){
      Ghtml.elemVideo_SW.addEventListener('click', function(e){
          e.target.setAttribute("disabled", true);
          if(e.target.value!=0){
              e.target.value=0;
              e.target.innerText = "映像送信を開始";
              dispInfoStreamStatus();
              
              if(G.localStream){if(G.localStream.getVideoTracks){ 
                  changAbleStream(G.localStream.getVideoTracks(),false); }} //Off
          }else{
              e.target.value=1;
              e.target.innerText = "映像送信を停止";
              dispInfoStreamStatus();
              
              if(G.localStream){if(G.localStream.getVideoTracks){ 
                  changAbleStream(G.localStream.getVideoTracks(),true); }} //On
          }
          e.target.removeAttribute("disabled");
      });
    }

    //elemRange_VideoFrameRate = document.getElementById('my-video_rate');
    //elemRange_VideoFrameRateCurVal = document.getElementById('my-video_rate_currentValue');
    if(Ghtml.elemRange_VideoFrameRate){
      Ghtml.elemRange_VideoFrameRate.addEventListener('input', function(e){
          update_elemRange_VideoFrameRateCurVal();
          changeVideoConstraints();
      });
      Ghtml.elemRange_VideoFrameRate.dispatchEvent(c_elemEvent_input);
    }
    



   //elemStream_SW =  document.getElementById('my-stream_sw');
   //elemStream_SW_Msg =  document.getElementById('my-stream_sw_message');
   if(Ghtml.elemStream_SW){
     Ghtml.elemStream_SW.addEventListener('click', function(e){
         Ghtml.elemStream_SW.setAttribute("disabled", true);
         toggleElemStream_SW();
     });
   }


}




function update_elemRange_microphoneLevelCurVal(){
   if(Ghtml.elemRange_microphoneLevel){
         if(Ghtml.elemRange_microphoneLevelCurVal){
             Ghtml.elemRange_microphoneLevelCurVal.innerText = Ghtml.elemRange_microphoneLevel.value;
         }
   }
}
function update_elemRange_VideoFrameRateCurVal(){
   if(Ghtml.elemRange_VideoFrameRate){
         if(Ghtml.elemRange_VideoFrameRateCurVal){
             Ghtml.elemRange_VideoFrameRateCurVal.innerText = Ghtml.elemRange_VideoFrameRate.value;
         }
   }
}

function allDisabledElement(tgt,flg){
   if(tgt){if(tgt.length){
       for (let i = 0; i < tgt.length; i++){
           if(flg){
               tgt[i].setAttribute("disabled", true);
           }else{
               tgt[i].removeAttribute("disabled");
           }
       }
   }}
}


// ---------------------------

function forceOnElemStream_SW(){
    if(Ghtml.elemStream_SW.value==0){
        toggleElemStream_SW();
    }
}
function toggleElemStream_SW(){  // 接続の初期化（ON/OFF）

         if(Ghtml.elemStream_SW.value!=0){
             Ghtml.elemStream_SW.value=0;
             Ghtml.elemStream_SW.innerText = "通信再開";
             dispInfoStreamStatus();
         }else{
             Ghtml.elemStream_SW.value=1;
             Ghtml.elemStream_SW.innerText = "通信停止";
             dispInfoStreamStatus();
         }
         
         initVideoConstraints(Ghtml.elemStream_SW);
}
function dispInfoStreamStatus(){
   if(Ghtml.elemStream_SW){
     if(Ghtml.elemStream_SW.value==0){
             if(Ghtml.elemStream_SW_Msg){Ghtml.elemStream_SW_Msg.innerText="停止中";}
             if(Ghtml.elemMic_STTS)  {Ghtml.elemMic_STTS.innerText  ="";}
             if(Ghtml.elemVideo_STTS){Ghtml.elemVideo_STTS.innerText="";}
     }else{
             if(Ghtml.elemStream_SW_Msg){Ghtml.elemStream_SW_Msg.innerText="通信中";}
             if(Ghtml.elemMic_SW){if(Ghtml.elemMic_STTS){
                 if(Ghtml.elemMic_SW.value!=0)   {Ghtml.elemMic_STTS.innerText  ="音声送出中";}
                 else                            {Ghtml.elemMic_STTS.innerText  ="音声停止中";}
             }}
             if(Ghtml.elemVideo_SW){if(Ghtml.elemVideo_STTS){
                 if(Ghtml.elemVideo_SW.value!=0) {Ghtml.elemVideo_STTS.innerText  ="映像送出中";}
                 else                            {Ghtml.elemVideo_STTS.innerText  ="映像停止中";}
             }}
     }
   }
}








// ============================


function buildVideoConstraintsJSON() {
  try {
    videoConstraints = JSON.parse(videoConstraintsText);
  } catch(error) {
    handleError(error);
  }
}
function buildAudioConstraintsJSON() {
  try {
    audioConstraints = JSON.parse(audioConstraintsText);
  } catch(error) {
    handleError(error);
  }
}

function getCurrentSettings() {
  if (videoTrack) {
    videoConstraintsText = JSON.stringify(videoTrack.getSettings(), null, 2);
  }
  if (audioTrack) {
    audioConstraintsText = JSON.stringify(audioTrack.getSettings(), null, 2);
  }
}


// =====================================


function startVideo(triggerElem = null) {
  
  //デバイス確認
  let enableVideoFlg =0;
  let enableAudioFlg =0;
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) { // 成功時
      devices.forEach(function(device) {
         if(device.kind=="videoinput"){ enableVideoFlg=1; }
         if(device.kind=="audioinput"){ enableAudioFlg=1; }
      });
  }).catch(function(err) { // エラー発生時
      console.log(err.name + "[enumerateDevices]: " + err.message);
  }).then( function(stream) {
    
    
    if((enableVideoFlg+enableAudioFlg)==0){
        startVideo_functionEnd(); // 終了処理
    }
    
    
    //enableVideoFlg=0;
        
        
    
    // カメラ／マイクのストリームを取得する
    
    //navigator.mediaDevices.getUserMedia({
    //    video: videoConstraints ,
    //    audio: audioConstraints
    //}).then( function(stream) 
    
    let enableDeviceAry = {};
    if(enableVideoFlg!=0){enableDeviceAry.video = videoConstraints;}
    if(enableAudioFlg!=0){enableDeviceAry.audio = audioConstraints;}
    
    navigator.mediaDevices.getUserMedia(enableDeviceAry
    ).then( function(stream) {
        
        let audioTracks = stream.getAudioTracks();
        if (audioTracks.length) {
            audioTrack = audioTracks[0];
        }
        
        let videoTracks = stream.getVideoTracks();
        if (videoTracks.length) {
            videoTrack = videoTracks[0];
        }
        
        
        let newDestination=null;
        //マイクからの音量に増幅を掛ける（新しいストリームを新規に作成）
        if (audioTrack!==null) {
            const micSource = c_audioContext.createMediaStreamSource(stream);
            newDestination = c_audioContext.createMediaStreamDestination();
            micSource.connect(c_gainNode);
            c_gainNode.connect(newDestination);
        }
        
        //新規に作成した音声ストリームに、映像ストリームを付加
        G.localStream = null;

        if(newDestination===null){
            if (videoTrack!==null) {
                G.localStream = stream;
            }
        }else{
            if (videoTrack!==null) {
                newDestination.stream.addTrack(videoTrack);
                G.localStream = newDestination.stream;
            }else{
                G.localStream = newDestination.stream;
            }
        }
        
        
        // 送出許可されたもののみを有効にする
        let flg=false;
        if(Ghtml.elemMic_SW){
            if(Ghtml.elemMic_SW.value!=0){
                flg=true;
            }
        }
        changAbleStream(G.localStream.getAudioTracks(),flg)
        
        
        
        
        
        flg=false;
        if(Ghtml.elemVideo_SW){
            if(Ghtml.elemVideo_SW.value!=0){
                flg=true;
            }
        }
        changAbleStream(G.localStream.getVideoTracks(),flg)
        
        
        
        
        
        if(G.localStream !== null){
            
            //ストリーム保存
            //const mediaRecorder = new MediaRecorder(G.localStream);
            
            
            //ブラウザ上に表示する
            if(Ghtml.elemVideo){
                try {
                    Ghtml.elemVideo.srcObject = G.localStream;
                } catch (error) {
                    let url = window.URL.createObjectURL(G.localStream);
                    Ghtml.elemVideo.prop('src', url); // video要素のsrcに設定することで、映像を表示する
                }
            }
            
            //録音に通知
            if(mediaRecorder!==null){
                recreateAudioOutputStream();
            }
        }

        
    }).then(function() {
        new Promise(function(resolve) {
          //Ghtml.elemVideo.onloadedmetadata = resolve;
        });
    }).then(function() {
        getCurrentSettings(); // 今の設定(初期状態)を変数に保存
        
        
        CheckEnable_videoTrack(triggerElem , 3);
        
        
        c_audioContext.resume().then(() => { console.log('Playback audioContext resumed successfully');}); //Chromeのセキュリティ設定
        
    }).then(function() {
        
        
        for (let key in G.connectedDatas) {
           let flg=0;
           if (key in G.connectedCalls){
              let conn = G.connectedCalls[key];
              if(conn.open) {
                  //conn.replaceStream(G.localStream);
                  //flg=1;
                  conn.close(true);
              }
           }
           if(flg==0){
                  sendStreamToPeer(key); // 相手へのデータ通信接続を開始する
                   // connectedCalls[key]の内容は更新される
           }
        }
        
    }).then(function() { // 終了処理
        startVideo_functionEnd(); 
    }).catch(function(err) { // エラー発生時
      console.log(err.name + "[]: " + err.message);
    });
  
  
  });
  
  
  //------- 終了処理
  function startVideo_functionEnd(){
      setTimeout(function(){resurrectionBtnElem(triggerElem)}, 1000);
  }
}



function stopVideo(triggerElem = null){
  getCurrentSettings(); // 今の設定(初期状態)を変数に保存
  
  if (videoTrack) {
    videoTrack.stop();
  }
  if (audioTrack) {
    audioTrack.stop();
  }
  
  videoTrack = null;
  audioTrack = null;
  
  
  
  for (let key in G.connectedCalls) {
       let conn = G.connectedCalls[key];
       if(conn.open) {
           conn.close(true);
       }
       delete G.connectedCalls[key];
  }
  
  
  resurrectionBtnElem(triggerElem);
};




function changAbleStream(streamTracks , enableFlg){
    // 渡されたストリームのトラックに、送出許可を設定する
    if(streamTracks){
        if (streamTracks.length) {
            streamTracks[0].enabled = enableFlg;
        }
    }
}












function resurrectionBtnElem(triggerElems){
    let tgtary;
    if(triggerElems.foreach){
        tgtary=triggerElems
    }else{
        tgtary=[triggerElems];
    }
    tgtary.forEach(triggerElem => {
        if(typeof(triggerElem)=="object"){
          if(triggerElem.type){
            if(triggerElem.type="button"){
              if(triggerElem.disabled){
                triggerElem.removeAttribute("disabled");
              }
            }
          }
        }
    });
}


function CheckEnable_videoTrack(triggerElem = null , loop=0){
    let flg=loop;
    if(videoTrack){
        flg -= 1;
    }
    
    if(flg<0){
        resurrectionBtnElem(triggerElem);
    }else{
        setTimeout(function(){CheckEnable_videoTrack(triggerElem , flg)}, 1000);
    }
}

function initVideoConstraints(triggerElem = null){  // ストリームのon/off制御
   let flg=0;
   
   if(Ghtml.elemStream_SW){
       if(Ghtml.elemStream_SW.value==0){ //Off
           getCurrentSettings();
           if(videoConstraints){
               videoConstraints = false;
               flg=1;
           }
           if(audioConstraints){
               audioConstraints = false;
               flg=1;
           }
           if(flg!=0){
               stopVideo(triggerElem);
           }
       }else{   // if(Ghtml.elemStream_SW.value!=0){ //On
           if(!videoConstraints){
               buildVideoConstraintsJSON();
               changeVideoConstraintsPt();
               flg=1;
           }
           if(!audioConstraints){
               buildAudioConstraintsJSON();
               changeAudioConstraintsPt();
               flg=1;
           }
           if(flg!=0){
               startVideo(triggerElem);

               
               if(Ghtml.elemRange_VideoFrameRate){
                   Ghtml.elemRange_VideoFrameRate.value = videoConstraints.frameRate;
                   //update_elemRange_VideoFrameRateCurVal();
                   Ghtml.elemRange_VideoFrameRate.dispatchEvent(c_elemEvent_input);
               }
               
               

           }

       }
       
   }
   
   if(flg==1){
       //変更あり
   }
}

function changeAudioConstraintsPt(){
   let flg=0;
   
   if(audioConstraints){
         
         if(Ghtml.elemCheckBox_micProperties){
         
             
             for (let i = 0; i < Ghtml.elemCheckBox_micProperties.length; i++){
                 
                 switch (Ghtml.elemCheckBox_micProperties[i].value) {
                   case "again":
                     if(audioConstraints.autoGainControl != Ghtml.elemCheckBox_micProperties[i].checked ){ 
                         audioConstraints.autoGainControl = Ghtml.elemCheckBox_micProperties[i].checked;
                         flg=1;
                     }
                   break;
                   case "noize":
                     if(audioConstraints.noiseSuppression != Ghtml.elemCheckBox_micProperties[i].checked ){ 
                         audioConstraints.noiseSuppression = Ghtml.elemCheckBox_micProperties[i].checked;
                         flg=1;
                     }
                   break;
                   default:
                   break;
                 }
                 
             }

         }
         
         if(Ghtml.elemRadio_micEchoCancel){
             let strvl ="";
             for (let i = 0; i < Ghtml.elemRadio_micEchoCancel.length; i++){
                 if(Ghtml.elemRadio_micEchoCancel[i].checked){ 
                     strvl = Ghtml.elemRadio_micEchoCancel[i].value; break;
                 }
             }
             
             if(strvl=="none"){
                 if(audioConstraints.echoCancellation){
                     audioConstraints.echoCancellation=false;
                     flg=1;
                 }
             }else{
                 if(!audioConstraints.echoCancellation){
                     audioConstraints.echoCancellation=true;
                     flg=1;
                 }
                 if(audioConstraints.echoCancellationType != strvl){
                     audioConstraints.echoCancellationType = strvl;
                     flg=1;  // "system" or "browser"
                 }
             }
         }
         
   }
   
   return flg;
}
function changeAudioConstraints(triggerElem = null){
   let flg=changeAudioConstraintsPt();
   if(flg==1){
       if(audioTrack){
           if(audioConstraints){
                   audioTrack.applyConstraints(audioConstraints); // 設定変更を実施
           }
       }
   }
}


function changeVideoConstraintsPt(){
   let flg=0;
   
   if(videoConstraints){
         if(Ghtml.elemRange_VideoFrameRate){
         
             if(Ghtml.elemRange_VideoFrameRate.value != videoConstraints.frameRate){
                 if(videoConstraints.frameRate.ideal){
                     videoConstraints.frameRate.ideal = Number(Ghtml.elemRange_VideoFrameRate.value);
                 }else{
                     videoConstraints.frameRate = Number(Ghtml.elemRange_VideoFrameRate.value);
                 }
                 if(videoConstraints.frameRate.max){
                     videoConstraints.frameRate.max = Number(Ghtml.elemRange_VideoFrameRate.value)+5;
                 }
                 flg=1;
             }
         }
   }
   
   return flg;
}
function changeVideoConstraints(triggerElem = null){
   let flg=changeVideoConstraintsPt();
   if(flg==1){
       if(videoTrack){
           if(videoConstraints){
                   changeVideoConstraints_delay();
           }
       }
   }
}
let changeVideoConstraints_id=0; // 0:実行可能、それ以外:実行保留期間中
let changeVideoConstraints_flg=0; // 0以外：Constraintsの設定変更要求あり
function changeVideoConstraints_delay(mode=0){
    if(mode==0){
         changeVideoConstraints_flg=1; //更新すべきﾃﾞｰﾀがある
    }
    if(changeVideoConstraints_flg!=0){
        if(changeVideoConstraints_id==0){ //実行可能
            changeVideoConstraints_flg=0;
            videoTrack.applyConstraints(videoConstraints); // 設定変更を実施
            getCurrentSettings(); // 設定をテキストに保存
            changeVideoConstraints_id = setTimeout(function(){
                changeVideoConstraints_id=0;
                changeVideoConstraints_delay(1);    }, 1000); // 処理実行直後1秒間は続けて処理を行わない
        }
    }
}
