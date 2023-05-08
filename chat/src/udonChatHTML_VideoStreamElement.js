import { Ghtml , c_audioContext }  from "./udonChatHTML_elements.js";
import { deletePeerFromCallList , deletePeerFromDataList } from "./udonWebRTC.js";  //  循環参照に注意！

export {domAppendOrRemoveforPeer}

export let audioContextCtrls={};  // ボリュームゲイン等のコントロール用


function domAppendOrRemoveforPeer(mode,strTgtPeerId){
  // Dom の <div id="streams">(=elemDiv_streams変数)内にPeer用のエレメントを追廃する
  //let strTgtPeerId = call.remoteId;
  let strvl;
  let elemvl;

  // 全削除
  let tgtElement = document.getElementById('div_peerid-'+strTgtPeerId);
  if(tgtElement){ 
      while (tgtElement.firstChild) tgtElement.removeChild(tgtElement.firstChild);
      tgtElement.remove(); 
  }

  //新規作成
  if(mode){if(strTgtPeerId!=""){
    //コンテナとなるDiv要素
    let newelem = document.createElement("div");
    newelem.id="div_peerid-"+strTgtPeerId;
    newelem.style="display:inline-block"; // 縦に並べるならblock,横ならinline-block
    Ghtml.elemDiv_streams.appendChild(newelem);
    
    let tgtElement = document.getElementById('div_peerid-'+strTgtPeerId);
    
    //内容
    
    // video   （サイズ等は div.videoframe スタイルシートで定義）
    let newelem2 = document.createElement("video");
    newelem2.id="peervideo-"+ strTgtPeerId;
    newelem2.autoplay=true;
    newelem2.setAttribute("autoplay",newelem2.autoplay);
    newelem2.controls=true;
    newelem2.setAttribute("controls",newelem2.controls);
    newelem2.volume=0.1;
    newelem2.setAttribute("volume",newelem2.volume);
    newelem2.muted=true;
    newelem2.setAttribute("muted",newelem2.muted);
    
    newelem = document.createElement("div");
    newelem.setAttribute("class","videoframe");
    newelem.appendChild(newelem2);
    
    tgtElement.appendChild(newelem);
    
    
    // 録音用のボリュームを同期させる(この直前に追加したElementのvolumneに連動させる)
    if(!(strTgtPeerId in audioContextCtrls)){ audioContextCtrls[strTgtPeerId]={}; }
    if(!(audioContextCtrls[strTgtPeerId].gainNode)){    // 録音用のGainノードを生成する
        audioContextCtrls[strTgtPeerId].gainNode=c_audioContext.createGain();
    }
    newelem2.addEventListener('volumechange', e => {
        if(strTgtPeerId in audioContextCtrls){
            let ctrls = audioContextCtrls[strTgtPeerId].gainNode;
            if(ctrls) {
                if(e.srcElement){if(e.srcElement.volume){
                    ctrls.gain.value = e.srcElement.volume; //gain
                }}
            }
        }
    });
    
    
    

    
    newelem = document.createElement("span");
    newelem.id="peerid-"+ strTgtPeerId;
    tgtElement.appendChild(newelem);
    // 相手のIDを表示する
    elemvl = document.getElementById("peerid-" + strTgtPeerId);
    if(elemvl){
        //$("#peerid-" + strTgtPeerId).text(strTgtPeerId);
        elemvl.innerHTML = strTgtPeerId;
    }
    

    //削除用のボタンを追加する
  if(1==1){
    newelem = document.createElement("button");
    newelem.type="button";
    newelem.onclick=function(){
       deletePeerFromCallList(strTgtPeerId);
       deletePeerFromDataList(strTgtPeerId);
    };
    newelem.innerHTML="x"; //削除
    tgtElement.appendChild(newelem);
  }
    
    
    
    
    
    newelem = document.createElement("br");
    tgtElement.appendChild(newelem);
    
  }}
  
  
}
