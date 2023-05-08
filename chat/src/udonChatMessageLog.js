import { Ghtml }  from "./udonChatHTML_elements.js";
import { G }  from "./myGlobalParams.js";

export { htmlElemInit_MessageLog , addNewDataToChatMessageLog }



let chatMessage_logAry=[];
let chatMessage_saveCntMax=0;





function htmlElemInit_MessageLog(){
   //  elemText_chatMessage_saveSW = document.getElementById("textarea_chatMessage-save_sw");
   if(Ghtml.elemText_chatMessage_saveSW){
     Ghtml.elemText_chatMessage_saveSW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         saveChatMessageLog();
         
         e.target.removeAttribute("disabled");
     });
   }
}




function addNewDataToChatMessageLog(strid,data,crflg=1) {
    // 画面に受信したメッセージを表示
    let strAdd;
    let strHM;
    let strYMDHM;
    
    let nowtime = new Date();
    strHM = "";
    strHM = strHM +strFormatTwoChar(nowtime.getHours()) + ":" ;
    strHM = strHM +strFormatTwoChar(nowtime.getMinutes());
    
    //strYMDHM = nowtime.getFullYear().toString() + "/" ;
    //strYMDHM = strYMDHM +strFormatTwoChar(nowtime.getMonth()+1) + "/" ;
    //strYMDHM = strYMDHM +strFormatTwoChar(nowtime.getDate()) + " " ;
    //strYMDHM = strYMDHM + strHM +":";
    //strYMDHM = strYMDHM +strFormatTwoChar(nowtime.getSeconds());
    
    
    strAdd = strHM +" "+ strid;
    if(crflg==0) strAdd = strAdd+"\n";
    strAdd = strAdd + data+"\n";
    
    Ghtml.elemText_chatMessage_log.value += strAdd;
    
    Ghtml.elemText_chatMessage_log.scrollTop = Ghtml.elemText_chatMessage_log.scrollHeight;
    
    //保存
    let logobj={};
    logobj.rectime = nowtime;
    logobj.peerid = strid;
    logobj.data = data;
    
    chatMessage_logAry.push(logobj);
    
}
function strFormatTwoChar(intval) {
    let ans="";
    if (intval<10) ans = ans +"0";
    ans = ans + intval.toString();
    return ans
}





function saveChatMessageLog(){
    let filename;
    let blob;
    let strData;
    let strymd;

    let cntmax = -1;
    if(chatMessage_logAry){ cntmax=chatMessage_logAry.length; }
    if(cntmax>0){
        
        filename = "log.txt";
        if (filename!="") {
            
            if(1==2){
                let write_json=JSON.stringify(chatMessage_logAry);
                blob=new Blob([write_json], {type: 'application/json'});
            }else{
                
                strData="";
                for(let i=0;i<cntmax;i++){
                    let logobj=chatMessage_logAry[i];
                    
                    strymd = logobj.rectime.getFullYear().toString() + "/" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getMonth()+1) + "/" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getDate()) + " " ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getHours()) + ":" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getMinutes()) + ":" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getSeconds());
                    
                    strData = strData + strymd;
                    
                    strData = strData + "," +logobj.peerid;
                    strData = strData + "," +logobj.data.replace(/\r?\n/g, ' ');
                    
                    strData = strData + "\n"
                }
                blob = new Blob([strData],{type:"text/plan"});
            }
            Ghtml.elemText_chatMessage_saveBlobLink.href = URL.createObjectURL(blob);
            Ghtml.elemText_chatMessage_saveBlobLink.download = filename;
            Ghtml.elemText_chatMessage_saveBlobLink.click();


            //保存したデータを配列から削除
            if(confirm('出力分をメモリから削除しますか')){
                 chatMessage_logAry.slice(0,cntmax)
            }
            
        }
    }

}