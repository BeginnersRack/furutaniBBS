// import "./my_authentication.js";
import {createAccessLogData , ConnectionLogData_logmodeFlg} from "./myfunc_getlog.js";
import { getMySessionNumber } from "./myfunc_storage.js";

//*********** my functions ****************

function myconsolelog(msg0,mode=0){ // mode  -1:console.logのみ   1:アクセスログにも記録   0:接続者情報のlogmode値に従う
    let msg = msg0;
    const ssnum=getMySessionNumber();
    if(ssnum) msg+= "("+ssnum+")";
    
    console.log(msg);
    
    let flg=false;
    if(mode){
        if(mode<0){flg=false;}else{flg=true;}
    }else{
        
        // getConnectionMembersList() の自分のデータに、
        //   logmode が存在しているなら、flg=true;
        if(ConnectionLogData_logmodeFlg){ flg=true; }
        
    }
    if(flg){
        createAccessLogData( null , msg );
    }
}

//*****************************

function buildHtmlpageSource(strTitle,strBodyContents,strHeadContents="",strHeadJSCode=""){
   let strHtmlTag ='<html xmlns="http://www.w3.org/1999/xhtml" lang="ja">';

   // *** Head ***
   let strHeadTag ="<HEAD>";
   strHeadTag += `<meta http-equiv="content-type" content="text/html;charset=utf-8">`;   
   // ***Title ***
   let strTitleTag = "<TITLE>"+strTitle;
   
   // ***JS-Code
   let strJSCodeTag ="";
   if(strHeadJSCode){if(strHeadJSCode!=""){
       strJSCodeTag = `<script language="javascript">` +strHeadJSCode +"</script>";
   }}
   
   
   //-----------------------
   let ans="";
   let strvl="";
   
   // *** Head ***
   strvl  = strHeadTag + strTitleTag+"</title>";
   strvl += strJSCodeTag+strHeadContents +"</head>";
   ans +=strvl;
   
   // *** Body ***
   ans +="<body>\n"+strBodyContents+"\n</body>";
   
   
   // ----------------------
   return (strHtmlTag + ans + "</html>");
}


/** 　escapeHtml(orgdata , reverseFlg=0)　
 * CSS対策としてのEscape処理を行う関数
 * @param  {string} orgdata     エスケープさせたい元文字列
 * @param  {boolean}reverseFlg  真の場合はアンエスケープする
 * @return {string}  エスケープした文字列
 */
let escapeHtmlPatterns={
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
};
let escapeHtmlRegExpStr=[];
function escapeHtmlCreateRegExpStr(){
    let strF="";   //  正規表現 /[&'`"<>]/g
    let strR="";   //  正規表現 /&(lt|gt|amp|quot|#x27|#x60);/g
    
    Object.keys(escapeHtmlPatterns).forEach( function(key){
          strF += key;
          if(strR!="")strR+="|";
          strR += (escapeHtmlPatterns[key].slice(1,-1));
    });
    
    escapeHtmlRegExpStr[0]= "[" + strF + "]";
    escapeHtmlRegExpStr[1]= "&("+ strR + ");";
}
function escapeHtml(orgdata , reverseFlg=0) {
  if((escapeHtmlRegExpStr.length==0)||(escapeHtmlRegExpStr[0]=="")){
      escapeHtmlCreateRegExpStr();
  }
  let RegExpStrFlg=0;
  let fnc_myReplaceStr = function(org){let ans = escapeHtmlPatterns[org]; return (ans ? ans : ""); };

  if(reverseFlg){
      RegExpStrFlg=1;
      fnc_myReplaceStr = function(org){
          let tgtkey = Object.keys(escapeHtmlPatterns).find( function(key){
              return escapeHtmlPatterns[key]==org;
          });
          return (tgtkey ? tgtkey : "");
      };
  }
  // --------------
  let ans="";
  switch (typeof orgdata){
   case 'string':
      ans = orgdata.replace(  new RegExp(escapeHtmlRegExpStr[RegExpStrFlg],'g')  , function(match){
                return fnc_myReplaceStr(match);
      });
      break;
   default:
  }
  return ans;
}



/** 　myDateTimeFormat(orgvalue)　
 * 日時の値を文字列に整形して返す
 * @param  {string/number/date}orgvalue 
 * @return {string}  日時を示す文字列
 */
function myDateTimeFormat(orgvalue){
    if(!orgvalue){return "";}
    
    let tsdate;
    if(typeof orgvalue==='object'){if(Object.prototype.toString.call(orgvalue)=="[object Date]"){
        tsdate = orgvalue;
    }}
    if(typeof orgvalue==='number'){if(isFinite(orgvalue)){ // 数値
        tsdate = new Date(orgvalue);
    }}
    if(!tsdate){
         let tsdate0 = new Date(orgvalue);
         if(!isNaN(tsdate0)){
             tsdate=tsdate0;
         }
    }
    //-----
    if(!tsdate){ return ""; }
    
    const yyyymmdd = new Intl.DateTimeFormat(
      undefined,
      {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      }
    )
    
    return yyyymmdd.format(tsdate);
}


//******** sample ↓*********
//let testtestAry={}
//async function testwait(strKey="test",waitSec=5){
//    let waitPromise = createPromise_waitDeleteKey(testtestAry,strKey,true,waitSec);
//    console.log(`[Info] End処理を ${waitSec}秒間 待機しています・・・`);
//    setTimeout( function(){delete testtestAry[strKey];} ,3000);
//    if(await waitPromise.catch(function(strRejectInfo){
//        console.log(`[Warning] 更新待機がtimeoutしました : ${strRejectInfo}`);
//        return false;
//    }) ){
//        console.log(`[Info] 時間内にEndしました `);
//    }
//}
//******** sample ↑*********
function createPromise_waitDeleteKey(globalAry , key ,initializeFlg=true,maxSec=1,intervalms=100){
  if(initializeFlg) globalAry[key]=true; // これが削除されるまで、最大(maxSec)秒待機する (別処理終了時に delete globalAry[key] する)
  return new Promise(function(resolve,reject){
      sub_waitDeleteKeyLoop(resolve,reject,globalAry,key, (maxSec*1000/intervalms)|0 ,intervalms );
  });
}
function sub_waitDeleteKeyLoop(resolve,reject ,globalAry,key,cnt,intervalms=100){
      if((!globalAry)||(!globalAry[key])){
          if(globalAry){delete globalAry[key];}
          resolve(true); // 待機終了
      }else{
          cnt--;
          if(cnt<0){ // timeoutする
              let strInfo=key.toString();
              if(globalAry){
                  if(globalAry[key]){
                      strInfo += (" = " + globalAry[key].toString() );
                  }
                  delete globalAry[key];
              }
              reject(strInfo);
          }else{  // 待機を継続
              setTimeout(sub_waitDeleteKeyLoop,intervalms , resolve,reject,globalAry,key,cnt,intervalms);
          }
      }
}



function myObjectEqual(obj1,obj2){
    return false;
}

//***********  Export ***************
export { myconsolelog ,myDateTimeFormat , myObjectEqual ,createPromise_waitDeleteKey };

window.fb_myconsolelog=myconsolelog;
window.buildHtmlpageSource=buildHtmlpageSource;
window.escapeHtml = escapeHtml;
window.myDateTimeFormat = myDateTimeFormat;
