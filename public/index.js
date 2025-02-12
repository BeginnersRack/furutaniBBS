//import { createHtmlElement_button } from "./common.js";
    //   ※ Module読み込みさせる場合は、外から呼び出したいものにExport宣言が必要。

// Scriptタグでの呼び出しを想定：こうすることで、ここで宣言した関数が windowオブジェクトとして使用可能になる。


window.addEventListener("load", function(event) {
    setConnectionMembersCountListener();
    
    
    firstpage();
    // ** Module読み込みの場合、onload発火時点では、moduleのimport処理は完了していないことに注意。** defer
    
});
function firstpage(){
    first_getLoginUser();
}
function first_getLoginUser(){
    let loginUser;
    try{
        loginUser = fb_getLoginUser(1);
        first_changeIframeTarget();
    }catch(err){
        setTimeout( first_getLoginUser , 100 );console.log("L-skip");
        return;
    };
}
function first_changeIframeTarget(){
    const tgtElem = document.getElementById("iframe_main");
    if(tgtElem){
        tgtElem.addEventListener("load", function(event) {
            func_iframe_main_onload();
        });
        changeIframeTarget_main('home');
    }
}


//***********  認証確認 ***************
//  --  src/my_authentication.js 内にて、onAuthStateChangedイベントを定義している。
//  --  認証結果は window.fb_getLoginUser()で取得可能。
//  --  また、HTMLの"my_auth"エレメント内に結果を表示する。
//  --  処理の最後に、window.fb_onAuthStateChanged_callback()関数が実行される

function fb_onAuthStateChanged_callback(){
    let tgtElemId="accountHello";
    let tgtPreElem = document.getElementById(tgtElemId);
    if(tgtPreElem){  //  名前表示の後ろにボタンを追加。
        createHtmlElement_button("MyAccountを開く","changeIframeTarget_main('myAccount')",tgtElemId,2);
    }
    
    //window.changeIframeTarget_main('home');
    
}

//***********  離脱時の処理 ***************
let flg_RTDBwritten=0;

window.addEventListener("beforeunload", function(event) {
    if(1==2){
        //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
        //    このため、ページ遷移警告の後にDB登録処理等をおこなうことはできない。
        event.preventDefault(); //ページ遷移警告の表示
        event.returnValue = ''; //ページ遷移警告の表示
    }
});
window.addEventListener( ('onpagehide' in self ? 'pagehide' : 'unload') , function(event) {

    //--- 切断 --- 
    //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
    //      myconsolelog() も mode=-1以外は使用不可
    
    
    let intCnt=1;
    if (intCnt!=0){
        console.log(`[logoff]ブラウザ unload...`);
        
        // 終了するまでの時間稼ぎをする(ただし最大2秒まで)。画面リロードでもトリガされることに注意
        let tgttime = new Date();
        tgttime.setSeconds( tgttime.getSeconds() + 2);
        flg_RTDBwritten=1; // createAccessLogData()処理完了時に0になる
        //    切断前処理
        fb_createAccessLogData(null,'QuitBrowser' ,-1); 
        //    切断前処理の完了を待機
        while (intCnt>0) {
            let nowtime = new Date();
            if(nowtime>tgttime) intCnt=0;
            if(!flg_RTDBwritten) intCnt=0;
        }
        
    }
    
    
});






//***********  iframeの内容を切り替えする ***************
let str_IframeTarget_main_name="";

function setEventOfButton_moveFramePage(tgtdoc,btnId,tgtName,optionAry={},btnName){
    if(!tgtdoc)tgtdoc=document;
    let tgtElem = tgtdoc.getElementById(btnId);
    if(tgtElem){
        tgtElem.addEventListener("click", (event)=>{
            let rndFlg=false;
            if (event.shiftKey) {
                rndFlg=true;
            }
            this.changeIframeTarget_main(tgtName,optionAry,rndFlg);
        });
        if(btnName){
            tgtElem.value=btnName;
        }
    }
}
function changeIframeTarget_main(caseflg , optionAry0={} ,rndflg=false){  

    let tgtPreElem = document.getElementById("iframe_main");
    if(!tgtPreElem){return 0;}
    
    tgtPreElem.style.visibility = "visible";

    let loginUser = fb_getLoginUser();
    if(!loginUser){return 0;}
    if(!loginUser.uid){
        if((caseflg!="")&&(caseflg!="home")){
            tgtPreElem.contentDocument.location.replace("./404.html");
            return 0;
        }
    }
    
    str_IframeTarget_main_name=caseflg;
    let tgturl ="404";
    switch(caseflg){
        case "myAccountx":
            tgturl="./myAccount.html";
            break;
        case "":
            tgturl="";
            break;
        default:
            tgturl="./"+str_IframeTarget_main_name+".html"
    }
    if(tgturl=="404"){
        tgturl="./404.html";
        console.log(`[404]iframe url = ${caseflg}`);
    }else{
        if(tgturl!=""){
            let optionAry = optionAry0;
            if(!optionAry)optionAry={};
            if(rndflg){
                if(!("rnd" in optionAry)){
                    let dts = new Date();
                    optionAry["rnd"]=dts.getMilliseconds().toString(10);
                }
            }
            
            if(Object.keys(optionAry).length>0){
                let strSep="?";
                if( tgturl.indexOf('?')!=-1 ){strSep="&";}
                for(let key in optionAry){
                    tgturl += (strSep + key +"="+ optionAry[key] );
                    strSep="&";
                }
            }
            
        }
    }
    
    if(tgturl==""){
        tgtPreElem.src="about:blank";
    }else{
        tgtPreElem.contentDocument.location.replace(tgturl);
    }
}

function func_iframe_main_onload(){
    let tgtElem_iframeMain = document.getElementById("iframe_main");
    
    // --------------------------
    // -- フレームサイズの調整 --
    if(tgtElem_iframeMain){
        switch(0){
         case 1:
            try{ //フレームの高さを中身に合わせて調整する
              //tgtElem_iframeMain.style.width = tgtElem_iframeMain.contentWindow.document.body.scrollWidth + "px";
              tgtElem_iframeMain.style.height = (tgtElem_iframeMain.contentWindow.document.body.scrollHeight +50) + "px"; //+50はpadding
            }catch (error) {
                console.log(`[ERROR]フレームの高さ調整に失敗しました：${error.code}:${error.message}`);
            }
         break;
         default:
            
        }
    }
    //----------------
    //   iframe内に表示している内容（str_IframeTarget_main_name）によって、表示するElementを切り替える
    // -----  {  display:display-visibility ,  hidden:display-hidden  , none:none-hidden }
    let aryFlgs = {};
    switch(str_IframeTarget_main_name){
        case "myAccount":
            aryFlgs["my_auth"]     = "none";
            aryFlgs["iframe_main"] = "display";
            break;
        case "404":
        default:
            aryFlgs["my_auth"]     = "display";
            aryFlgs["iframe_main"] = "display";
    }
    //---
    for (var key in aryFlgs) {
        let tgtElem = document.getElementById(key);
        if(tgtElem){
            let p_visibility="visible"; //"hidden"/"visible"
            let p_display="none";  // {block,inline,inline-block,flex,grid,flow-root, ....}
            switch(tgtElem.tagName){
                case "a":
                case "span":
                case "img":
                case "iframe":
                case "label":
                case "br":
                    p_display="inline";
                    break;
                case "input":
                case "textarea":
                case "select":
                    p_display="inline-block";
                    break;
                case "table":
                    p_display="table";
                    break;
                case "tr":
                    p_display="table-row";
                    break;
                case "td":
                case "th":
                    p_display="table-cell";
                    break;
                default:
                    p_display="block";
            }
            
            switch(aryFlgs[key]){
                case "display":
                    break;
                case "hidden":
                    p_visibility="hidden";
                    break;
                case "none":
                    p_visibility="hidden";
                    p_display="none";
                    break;
                default:
                    p_visibility="hidden";
                    p_display="none";
            }
            tgtElem.style.display   =p_display; 
            tgtElem.style.visibility=p_visibility; 
        }
    }
    //---
    if(tgtElem_iframeMain){
        let childElemWindow = tgtElem_iframeMain.contentWindow;
        if(childElemWindow){
            let tgtfunc = childElemWindow.func_iframeOnload;  //  func_iframeOnload()
            if(tgtfunc){if (typeof tgtfunc=='function'){
                tgtfunc();
            }}
        }
    }
    
    
}



//***********  URLオプションの取得 ***************
function getUrloptions(strUrl){
    let ans={};
    if(!strUrl)strUrl=window.location.href; // or location.search
    
    let ary1 = strUrl.split("?");
    let strOpts = ary1[ary1.length-1];
    let ary2 = strOpts.split("&");
    for(let str1 of ary2){
        let ary3 = str1.split("=");
        if(ary3[0]){
            ans[ary3[0]] = (ary3.length<=1)?"": decodeURIComponent( ary3.slice(-1)[0] );
        }
    }
    return ans;
    
}





//*********** アクセス者数の表示 *************
function setConnectionMembersCountListener(){
    let elem = document.getElementById("span_ConnectionMembersCount");
    if(elem){
        fb_setConnectionMembersListListener(elem);
        console.log(`設定 [span_ConnectionMembersCount]`);
        
        elem.insertAdjacentHTML('beforebegin', '現在のアクセス者=');
        elem.insertAdjacentHTML('afterend', '人');
        
        
        
            let flg=0;
            let pelm=elem.parentNode;
            if(pelm){if(pelm.tagName=="A"){ flg=1;
            }}
            if(flg){
                pelm.setAttribute('onclick', 'dispConnectionMembersData()');
            }else{
                elem.addEventListener("click", function(event) {
                        dispConnectionMembersData();
                });
            }
        
        
        
    }
}
function dispConnectionMembersData(){
    let msg="";
    const msgcr="\n"; // "\n" or "<br/>"
    const data = window.fb_getConnectionMembersList();
    if(data){
        let keylist=Object.keys(data);
        for(let key of keylist){
            let elem=data[key];
            msg+=elem.name;
            msg+=msgcr;
        }
    }
    alert(msg);
}

//***********  他   ***************
// -----------------------------------------

