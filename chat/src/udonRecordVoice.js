import { audioContextCtrls } from "./udonChatHTML_VideoStreamElement.js";
import { Ghtml }  from "./udonChatHTML_elements.js";
import { G }  from "./myGlobalParams.js";

export { htmlElemInit_RecordVoice , recreateAudioOutputStream};
export let mediaRecorder; //録音用




// ===================================================

const saveaudio_chunks = [];   // 音声の録音用データ格納先

let mediaRecorder_micVolumeGain;



function htmlElemInit_RecordVoice(){
    //elemRec_SW =  document.getElementById('my-rec_sw');
    if(Ghtml.elemRec_SW){
      Ghtml.elemRec_SW.innerText = "REC開始";
      Ghtml.elemRec_SW.addEventListener('click', function(e){
          e.target.setAttribute("disabled", true);
          if(e.target.value!=0){
              audioRecCommand(0);//停止
                  e.target.value=0;
                  e.target.innerText = "REC開始";
          }else{
              if(0!=audioRecCommand(1)){    //開始
                  e.target.value=1;
                  e.target.innerText = "REC終了";
              }
          }
          e.target.removeAttribute("disabled");
      });
    }
   
    //elemVideo = document.getElementById('my-video');
    if(Ghtml.elemVideo){
      Ghtml.elemVideo.addEventListener('volumechange', e => {
          if(typeof mediaRecorder=="object"){if(mediaRecorder){
              if(mediaRecorder_micVolumeGain){ //マイクの音の録音用ゲインを設定しなおす。
                  mediaRecorder_micVolumeGain.value = Ghtml.elemVideo.volume; //Muteしていても値は取れる。
              }
          }}
      });
    }
}








function audioRecCommand(mode){ //HTMLボタンより呼び出される。 mode=0:停止, 1:開始
    if(mode==1){ // 開始
        if(createAudioOutputStream()<=0){
            mode=0;
        }else{
            //sendNewChatMessage("(system-rec)");
            if(Ghtml.elemTextArea_RecSound)Ghtml.elemTextArea_RecSound.innerHTML="録音中";
        }
    }else{ // 終了
        if(mediaRecorder){
            mediaRecorder.stop();
        }
        //mediaRecorder=null;
        if(Ghtml.elemTextArea_RecSound)Ghtml.elemTextArea_RecSound.innerHTML="";
    }
    return mode;
}
function createAudioOutputStream(){
    
    let sorceCnt =0;
    
    let recAudioContext = new (window.AudioContext || window.webkitAudioContext)(); 
    let newDestination = recAudioContext.createMediaStreamDestination();
    
    // Mic      
            if(G.localStream){
                let audioTracks = G.localStream.getAudioTracks();
                if(audioTracks.length) {if(audioTracks[0]){
                  let tgtgain=0;
                  //ボリュームを追加
                  
                  if(typeof Ghtml.elemVideo=="object"){if(Ghtml.elemVideo){if(Ghtml.elemVideo.volume){
                      tgtgain=Ghtml.elemVideo.volume;
                  }}}
                  
                  
                  if(tgtgain>0){
                      let audioctxGainNode;
                      //audioctx.AudioContext = new (window.AudioContext || window.webkitAudioContext)();
                      audioctxGainNode = recAudioContext.createGain();
                      
                      let audioSource = recAudioContext.createMediaStreamSource(G.localStream);
                      audioSource.connect(audioctxGainNode);
                      mediaRecorder_micVolumeGain = audioctxGainNode.gain;
                      //audioctxGainNode.gain.value =1;
                      mediaRecorder_micVolumeGain.value = tgtgain; //自カメラ映像再生用の音量に合わせる(Mute無効)
                      
                      audioctxGainNode.connect(newDestination);
                      sorceCnt+=1;
                  }
                }}
            }
            
            
            
            
            
    //stream
    
    for (let key in audioContextCtrls) {
    //    let ctrls = audioContextCtrls[key].gainNode;
    //    if(ctrls) {
    //        ctrls.connect(newDestination);
    //        sorceCnt+=1;
    //    }
        
        let audioTracks = null;
        if(audioContextCtrls[key]){if(audioContextCtrls[key].orgStream){
            audioTracks = audioContextCtrls[key].orgStream.getAudioTracks();
        }}
        if(audioTracks){if(audioTracks.length) {if(audioTracks[0]){
          //let ctrls = recAudioContext.createMediaStreamSource(audioContextCtrls[key].orgStream);
            let ctrls = recAudioContext.createMediaStreamSource(new MediaStream(audioTracks));
            
            if(1==2){ // 受信音声をそのまま録音
                ctrls.connect(newDestination);
            }else{    // このPCでの再生音量に合わせる（リアルタイム追従はしない）
                let audioctxGainNode;
                audioctxGainNode = recAudioContext.createGain();
                ctrls.connect(audioctxGainNode);
                mediaRecorder_micVolumeGain = audioctxGainNode.gain;
                mediaRecorder_micVolumeGain.value =1;
                if(audioContextCtrls[key].gainNode){if(audioContextCtrls[key].gainNode.gain){
                    mediaRecorder_micVolumeGain.value = audioContextCtrls[key].gainNode.gain.value;
                }}
                
                audioctxGainNode.connect(newDestination);
            }
            sorceCnt+=1;
        }}}
    }
    
    // output
    
    
    //ここからテスト
    //sorceCnt =-1;
    if(sorceCnt==-1){
        let newelem = document.createElement("audio");
        newelem.id="peeraudioXXXXXXX";
        newelem.setAttribute("autoplay",true);
        newelem.setAttribute("muted",true);
        newelem.volume = 0.3;
        newelem.controls="true";
        newelem.addEventListener('loadedmetadata', e => {
                        newelem.muted = "false";
                   // newelem.play();
        });
        let audioTracks;let cntxtss;let newDest;let myAudioContext;
        switch(4){
        case 1:
            newelem.srcObject = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream;
            break;
        case 2:
            audioTracks = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream.getAudioTracks();
            newelem.srcObject = new MediaStream(audioTracks);
            break;
        case 3:
            myAudioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            
            audioTracks = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream.getAudioTracks();
            cntxtss = myAudioContext.createMediaStreamSource(new MediaStream(audioTracks));
            
            newDest =myAudioContext.destination;
            cntxtss.connect(newDest);
            
            newelem.srcObject = newDest.stream;
            break;
        case 4:
            myAudioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            
            audioTracks = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream.getAudioTracks();
            cntxtss = myAudioContext.createMediaStreamSource(new MediaStream(audioTracks));
            
            newDest = myAudioContext.createMediaStreamDestination();
            cntxtss.connect(newDest);
            
            newelem.srcObject = newDest.stream;
            break;
        default:
            newelem.srcObject = newDestination.stream;
            break;
        }
        //
        Ghtml.elemRec_SW.parentElement.appendChild(newelem);
    }
    //ここまでテスト
    
    
    
    if(sorceCnt<=0){
        console.log("debug : No AudioSource for Record."  );
    }else{
        let mimetypeChoice='audio/webm';
        if(MediaRecorder.isTypeSupported("audio/webm\;codecs=opus")){ mimetypeChoice='audio/webm\;codecs=opus'; }
        
        mediaRecorder = new MediaRecorder(newDestination.stream, { mimeType: mimetypeChoice });
        
        for(let i=saveaudio_chunks.length;i>0;i--){
            saveaudio_chunks.shift();
        } // saveaudio_chunks を空にする。
        
        mediaRecorder.addEventListener('dataavailable', e => { 
              // 一定間隔で録画が区切られて、データが渡される
              if (e.data.size > 0) {
                 saveaudio_chunks.push(e.data);
                 //saveaudio_chunks[0]=(e.data);
              }
        });
        
        mediaRecorder.addEventListener('stop', () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(saveaudio_chunks,{'type': mimetypeChoice }));
            a.download = 'audio-test.webm';
            a.click();
            
            mediaRecorder=null;
        });
        
        mediaRecorder.start();
    }
    
    return sorceCnt;
}
function recreateAudioOutputStream(){
    if(mediaRecorder){
        
        mediaRecorder.stop(); // 一旦、今までの録音内容をファイルに出力
        
        recreateAudioOutputStream_restart(); // 録音を再開
        
    }
}
function recreateAudioOutputStream_restart(){
    if(mediaRecorder){
        setTimeout( recreateAudioOutputStream_restart ,100);
    } else {
        createAudioOutputStream();
    }
}
//-----------------


