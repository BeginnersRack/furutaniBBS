import { sendNewChatMessage } from "./udonTextMessageChat.js";
import { Ghtml }  from "./udonChatHTML_elements.js";

 
export { htmlElemInit_Voicerecognition };





//音声認識
let recognition = null;

let recognitionFlgs = {};
recognitionFlgs.recognitionRestartableFlg = true;
recognitionFlgs.flgEnableSpeechRecognition=false;



let window_SpeechRecognition;
// var window_SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition || webkitSpeechRecognition || SpeechRecognition;
if(window.webkitSpeechRecognition){window_SpeechRecognition = window.webkitSpeechRecognition}
else if(window.SpeechRecognition){window_SpeechRecognition = window.SpeechRecognition}
else if(typeof webkitSpeechRecognition!=="undefined"){window_SpeechRecognition = webkitSpeechRecognition}
else if(typeof SpeechRecognition!=="undefined"){window_SpeechRecognition = SpeechRecognition}

if(window_SpeechRecognition){  // if('SpeechRecognition' in window){
  if("function"==typeof window_SpeechRecognition){
     recognitionFlgs.flgEnableSpeechRecognition=true;
  }
}





// =========================

function htmlElemInit_Voicerecognition(){
  if(Ghtml.elemCheckBox_ResultRecognition){
    let flg=0
    if(recognitionFlgs.flgEnableSpeechRecognition){
      settingRecognition(); //音声認識の初期化
      if(recognition){
                Ghtml.elemCheckBox_ResultRecognition.addEventListener('change', function(e){
                    if(e.target.checked){
                      recognition.start();
                      Ghtml.elemCheckBox_ResultRecognition_chat.disabled = false;
                    }else{
                      recognitionFlgs.recognitionRestartableFlg=false;
                      recognition.stop();
                      Ghtml.elemCheckBox_ResultRecognition_chat.disabled = true;
                    }
                });
                flg=1;
      }
    }
    if(flg==0){ // 初期化失敗
         Ghtml.elemCheckBox_ResultRecognition.checked = false;
         Ghtml.elemCheckBox_ResultRecognition.disabled = true;
         Ghtml.elemCheckBox_ResultRecognition_chat.checked = false;
         Ghtml.elemCheckBox_ResultRecognition_chat.disabled = true;
    }else{
         //Ghtml.elemCheckBox_ResultRecognition.checked = true; // 20220724　初期値はHTML定義に依存させる
         Ghtml.elemCheckBox_ResultRecognition.disabled = false;
         Ghtml.elemCheckBox_ResultRecognition_chat.disabled = false;
    }
    if(Ghtml.elemCheckBox_ResultRecognition.checked){
        recognition.start();
    }
  }
}




// ============ 初期設定関数 ================
const c_testflg =0;


function settingRecognition(){
  if(!(recognitionFlgs.flgEnableSpeechRecognition)){
      return false;
  }else{ //音声認識の初期化
    recognition = new window_SpeechRecognition();
    if(recognition){
        recognition.lang = 'ja-JP';
        recognition.interimResults = true; // 暫定結果も返す
        recognition.continuous = true;
        
        recognition.addEventListener('start', (event) => { // onstart:リスニング開始
           recognitionFlgs.recognitionRestartableFlg = true; // 再起動可（音声解析中でない）
           //Ghtml.elemCheckBox_ResultRecognition.checked = true;
        })
        recognition.addEventListener('end', (event) => {
            addMessageOfRecognitionErr();
            if (recognitionFlgs.recognitionRestartableFlg) {
                recognitionFlgs.recognitionRestartableFlg = false; // 再起動不可（再起動中）
                recognition.start();
                //Ghtml.elemCheckBox_ResultRecognition.checked = false;
                Ghtml.elemText_ResultRecognitionStatus.innerHTML="";
                if(c_testflg){ console.log("Recognition end(restart)."); }
            }else{
                if(c_testflg){ console.log("Recognition end."); }
                let interimTranscript = '';
                
            }
        })
        recognition.addEventListener('result', (event) => {
            let finalTranscript = ''; //確定結果
            let interimTranscript = ''; // 暫定(灰色)の認識結果
            for (let i = event.resultIndex; i < event.results.length; i++) {
              let transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
                recognitionFlgs.recognitionRestartableFlg = true;  // 再起動可（音声解析中でない）
                if(c_testflg){ console.log("Recognition final."+interimTranscript); }
                interimTranscript="";
              } else {
                interimTranscript = interimTranscript + transcript;
                recognitionFlgs.recognitionRestartableFlg = false;  // 再起動不可（音声解析中）
              }
            }
            if(!recognitionFlgs.recognitionRestartableFlg){
                if(c_testflg){ console.log("Recognition continue."); }
            }
            addMessageOfRecognition(finalTranscript,interimTranscript);
            
        })
        recognition.addEventListener('nomatch', (event) => {
            addMessageOfRecognitionErr();
            if(c_testflg){ console.log("Recognition NoMatch:"+event.error); }
        })
        recognition.addEventListener('error', (event) => {
            addMessageOfRecognitionErr();
            if(c_testflg){ console.log("RecognitionError:"+event.error); }
        })
        recognition.addEventListener('soundstart', (event) => {
            Ghtml.elemText_ResultRecognitionStatus.innerHTML="●";
        })
        recognition.addEventListener('soundend', (event) => {
            Ghtml.elemText_ResultRecognitionStatus.innerHTML="○";
            recognitionFlgs.recognitionRestartableFlg = true;//stopメソッドにより発生するonendイベントで再起動させる
            recognition.stop();
        })
        
        
        
        
        
        // recognition.stop();
        // recognition.start(); https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition
    }
  }
}
function addMessageOfRecognition(msg1,msg2){
    let maxcount = 100; //表示最大文字数
    
    if(msg1!=""){
      if(Ghtml.elemTextArea_ResultRecognition){
          let msg = Ghtml.elemTextArea_ResultRecognition.value;
          //msg += (strTime+msg1);
          msg += msg1;
          if(msg.length>maxcount){ msg=msg.slice( 0-maxcount ); }
          Ghtml.elemTextArea_ResultRecognition.value = msg;
      }
      let flg=1;
      //if(!Ghtml.elemMic_SW){flg=0;}
      //if(Ghtml.elemMic_SW.value==0){flg=0;}
      if(flg!=0){ 
          if(Ghtml.elemCheckBox_ResultRecognition_chat.checked){
              sendNewChatMessage(msg1); //チャットに出力する
          }
      }
    }
    if(Ghtml.elemTextArea_ResultRecognitionP){
        Ghtml.elemTextArea_ResultRecognitionP.innerHTML = msg2;
    }
}
function addMessageOfRecognitionErr(){
    let msg='';
    if(Ghtml.elemTextArea_ResultRecognitionP){
        msg=Ghtml.elemTextArea_ResultRecognitionP.innerHTML;
        Ghtml.elemTextArea_ResultRecognitionP.innerHTML="";
    }
    addMessageOfRecognition(msg,"");
}

