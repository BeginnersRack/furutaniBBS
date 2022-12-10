

window.addEventListener("load", function(event) {
    setConnectionMembersCountListener();
});



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

function changeIframeTarget_main(caseflg){  

    let tgtPreElem = document.getElementById("iframe_main");
    if(!tgtPreElem){return 0;}

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
            if( tgturl.indexOf('?')!=-1 ){tgturl+="&";}else{tgturl+="?";}
            let dts = new Date();
            tgturl += ("rnd=" + dts.getMilliseconds().toString(10) );
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