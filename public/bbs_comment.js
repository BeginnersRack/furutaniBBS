import { HtmlElements_comment,createHtmlElem_commentForEdit } from "./bbs_comment_m.js";

//-- Htmlファイルで定義されているもの
const HtmlElement_myTitleSpanId ="bbsThread_title";
const HtmlElement_myThreadInfosDivId ="bbsThread_Infos";
const HtmlElement_myDetailsDivId ="bbsComment_Details";
const HtmlElement_myNewDetailsDivId ="bbsComment_NewDetails";
const HtmlElement_myNewDetailsOldDivId ="bbsComment_Details_old";
const HtmlElement_myControllDivId ="bbsComment_controll";
const HtmlElement_mySystemMessage01SpanId ="SystemMessage01";
//-- 以下、JavaScript内で生成するもの
const HtmlElement_mybutton_submitComent_BtnId ="button_submitComment";
const HtmlElement_myDetailsDispAreaId  ="bbsComment_DispDetails";

//---
const indexedDbName = "furutaniBBS";


const BBS_Configs={};


//---
const pageconfig={};
   // pageconfig.bbsCode    :(URLパラメータより)BBSコード
   // pageconfig.threadCode :(URLパラメータより)スレッドID
   // pageconfig.commentCode:(URLパラメータより)コメントID
   // pageconfig.threadDocInfo : 親スレッドのデータ(スレッド名ID)
   // pageconfig.threadConfig  : 親スレッドの設定データ(スレッド設定情報) = _system
   // pageconfig.postData      : コメントデータ

//---------------------------------------

async function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    let urlOptionsAry = window.parent.getUrloptions(window.location.search);
    pageconfig.bbsCode = urlOptionsAry["b"];
    pageconfig.threadCode = urlOptionsAry["t"];
    pageconfig.commentCode = urlOptionsAry["c"];
    
    pageconfig.FilenameCode = pageconfig.bbsCode.toLowerCase();
    const confAry = await import( './'+pageconfig.FilenameCode+'.js' );
    if(confAry){
        if(confAry.PM_BBSconfigs){
            BBS_Configs.c_bbsCode = confAry.PM_BBSconfigs.c_bbsCode;
            //--
            BBS_Configs.MaxDatasize_comment = confAry.PM_BBSconfigs.MaxDatasize_comment;
            if(!BBS_Configs.MaxDatasize_comment) BBS_Configs.MaxDatasize_comment = 1000;

            BBS_Configs.recordHistorySize = confAry.PM_BBSconfigs.recordHistorySize;
            if(!BBS_Configs.recordHistorySize) BBS_Configs.recordHistorySize = 0;
            BBS_Configs.MaxDatasize_History = confAry.PM_BBSconfigs.MaxDatasize_History;
            if(!BBS_Configs.MaxDatasize_History) BBS_Configs.MaxDatasize_History = 1000;
        }
    } 

    
    let tgtElem;
    //----
    const mySystemIndicatorFunc = mySystemIndicatorFunc_create(); //閉包関数
    mySystemIndicatorFunc("nowloading",1,"Now loading...");
    //---------
    
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    const strdbpath = storeName+"/"+pageconfig.threadCode;
    pageconfig.threadDocInfo = await window.parent.getdataFromIndexedDb(indexedDbName ,storeName ,pageconfig.threadCode);
    pageconfig.threadConfig = await window.parent.getdataFromIndexedDb(indexedDbName ,strdbpath+"/contents","_system");
    if(!pageconfig.threadConfig){
        const sortMax = await window.parent.fb_getMaxOfSortIndex(strdbpath+"/contents"); // "_system"文書を作成
        const dmy = await waitExistSingleDoc(strdbpath+"/contents","_system");
        if(dmy) pageconfig.threadConfig = dmy;
    }
    
    pageconfig.postData = await window.parent.fb_getDataFromFirestoreDb_singleDoc(strdbpath+"/discussion", pageconfig.commentCode ).catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb_singleDoc : "+strdbpath + reject);
    });
    
    let threadTitle = pageconfig.threadDocInfo.Title ? pageconfig.threadDocInfo.Title : "thread";
    //---------
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint01","home");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint02","bbs");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint03",pageconfig.bbsCode,{},pageconfig.bbsCode);
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint04","bbs_thread",{b:pageconfig.bbsCode,t:pageconfig.threadCode}, threadTitle.substring(0,10) );
    
    // -----
    
    tgtElem = document.getElementById(HtmlElement_myTitleSpanId);
    if(tgtElem){
        tgtElem.innerHTML = pageconfig.threadDocInfo.title;
    }
    tgtElem = document.getElementById(HtmlElement_myThreadInfosDivId);
    if(tgtElem){
        tgtElem.innerHTML = pageconfig.threadDocInfo.overview;
    }
    
    // -----
    

    
    //---------
    
    dispDetails();
    
    //dispBBSList();
    
    dispBBSControllBtn();
    
    //---------
    mySystemIndicatorFunc("nowloading",false);
    
    
    if(1==2){  mytest(); }
};
function waitExistSingleDoc(strdbpath,dockey){
    return new Promise((resolve, reject) => {
        async function mycheck(myresolve,cnt=0){
            const tgtdoc = await window.parent.getdataFromIndexedDb(indexedDbName ,strdbpath,dockey);
            if(tgtdoc){
                myresolve(tgtdoc);
            }else{
                if(cnt>100){
                    console.log("[Error] 文書が設定できませんでした : "+strdbpath +" / "+dockey);
                }else{
                    setTimeout( async function(){  mycheck(myresolve,cnt+1);
                    },100);
                }
            }
        }
        mycheck(resolve);
    });
}
function mySystemIndicatorFunc_create(key="",flg=false,msg=""){
    let timerIdAry={};
    let timerId = timerIdAry[key];
    
    //const msgElem = await getElementByIdPromise(HtmlElement_mySystemMessage01SpanId);
    const msgElem = document.getElementById(HtmlElement_mySystemMessage01SpanId);
    
    function indicatorIncriment(){
        if(msgElem){ 
            msgElem.innerHTML = msgElem.innerHTML +"."; 
        }
    }
    //---------
    return function(key,flg=false,msg=""){
        if(flg){
            if(msgElem){ msgElem.innerHTML=msg; }
            timerIdAry[key] = setInterval(indicatorIncriment, 1000);
        }else{
            if(timerIdAry[key]){
                clearInterval(timerIdAry[key]);
            }
            delete timerIdAry[key];
            if(msgElem){ msgElem.innerHTML=""; }
        }
    }
}


async function dispDetails(){
    
    let tgtElem;
    
    //--- 更新処理用
    
    const ttl_defaultVal=(pageconfig.postData.titlecategory ? pageconfig.postData.titlecategory : "");
    tgtElem = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem){
        let dispContents=createHtmlElem_commentForEdit(pageconfig); //  myNewDetailsTextareaId と myNewTitleTextId を含むHTLM

        dispContents+=`<input type="button" id="`+HtmlElement_mybutton_submitComent_BtnId+`" value="更新" />`;
        dispContents +=`　<input type="button" value="入力を破棄して閉じる" onclick="createNewComment_hide();" />`;
        // ----
        tgtElem.innerHTML ="";
        tgtElem.insertAdjacentHTML('beforeend', dispContents );
        tgtElem.style.display = "none";
    }
    
    
    //--- 表示用 
    tgtElem = document.getElementById(HtmlElement_myDetailsDivId);
    if(tgtElem){
        let dispContents="";
        dispContents+="<table id='" +HtmlElement_myDetailsDispAreaId+ "' width=100%>";
        if((pageconfig.threadConfig)&&(pageconfig.threadConfig.post_titles)&&(pageconfig.threadConfig.post_titles.length>0)){
            let strtitle= pageconfig.postData.titlecategory;
            dispContents+="<tr> <th>件名："+ (strtitle?strtitle:"  ") +`　 ${pageconfig.postData.ownername} </th>  </tr>`;
        }
        dispContents+=`<tr> <th>コメント内容 　</td> </tr>`;
        dispContents+=`<tr> <td> <pre>${pageconfig.postData.details}</pre>  </td>  </tr>`;
        dispContents+=`<tr> <td> 投稿日：${window.parent.myDateTimeFormat(pageconfig.postData.created)}`;
        dispContents+=` 　　最終更新日：${window.parent.myDateTimeFormat(pageconfig.postData.modified)} </td></tr>`;
        dispContents+="</table>";
        
        // ----
        tgtElem.innerHTML ="";
        tgtElem.insertAdjacentHTML('beforeend', dispContents );
    }
    //----
    tgtElem = document.getElementById(HtmlElement_myNewDetailsOldDivId);
    if(tgtElem){
        let dispContents="";
        
        let strscr = `let tgtelmT=document.getElementById("`+HtmlElement_myNewDetailsOldDivId+`_pastlogTR");if(tgtelmT){`;
        strscr +=  `let tgtelmS=document.getElementById("`+HtmlElement_myNewDetailsOldDivId+`_pastlogSW");if(tgtelmS){`;
        strscr += `const clsTxt="∨";if(tgtelmS.innerHTML==clsTxt){tgtelmS.innerHTML="＞";`;
        strscr +=     `tgtelmT.style.display="none";`;
        strscr += `}else{ tgtelmS.innerHTML=clsTxt;`;
        strscr +=     `tgtelmT.removeAttribute("style");`;
        strscr += `}}}`;
        
        dispContents+="<table width=100%>";
        dispContents+=`<tr> <td> 過去データ<span id="`+HtmlElement_myNewDetailsOldDivId+`_pastlogSW"`;
        dispContents+=` onclick='`+strscr+`'`;
        dispContents+=`>＞</span>  </td>  </tr>`;
        dispContents+=`<tr id="`+HtmlElement_myNewDetailsOldDivId+`_pastlogTR" style="display:none;">`;
        dispContents+=` <td> ${pageconfig.postData.details_old}  </td>  </tr>`;
        dispContents+="</table>";
        
        tgtElem.innerHTML ="";
        tgtElem.insertAdjacentHTML('beforeend', dispContents );
    }
    
    
    
    //----
}
function createNewComment_hide(){
    let tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem_newInput){
        const BtnSubmit = document.getElementById(HtmlElement_mybutton_submitComent_BtnId);
        if(BtnSubmit){
            BtnSubmit.removeEventListener("click", updateComment_preExec );
        }
        
        tgtElem_newInput.style.display ="none";
        //tgtElem_newInput.innerHTML ="";
    }
    
    
    let tgtElem_Ctrl = document.getElementById(HtmlElement_myControllDivId);
    if(tgtElem_Ctrl){
        tgtElem_Ctrl.style.display ="block";
    }
    
    let tgtElem_disp = document.getElementById(HtmlElement_myDetailsDispAreaId);
    if(tgtElem_disp){
        tgtElem_disp.style.display ="block";
    }
    
    
}


function dispBBSControllBtn(){
    let tgtElem_Ctrl = document.getElementById(HtmlElement_myControllDivId);
    if(!tgtElem_Ctrl){return;}
    let loginUser = window.parent.fb_getLoginUser();
    
    const c_elmId="button_createNewThread";
    
    //----
    let tgtFlg = document.getElementById(c_elmId);
    if(tgtFlg){
        tgtFlg.style.display ="block";
    }else{
        let dispContents="";
        //----
        if (pageconfig.postData.ownerids.indexOf(loginUser.email) >=0 ){
            
            dispContents+=`<input type="button" id="{$c_elmId}" value="コメントを変更" onclick="updateComment();" />`;
            
        }
        
        tgtElem_Ctrl.innerHTML ="";
        tgtElem_Ctrl.insertAdjacentHTML('beforeend', dispContents );
    }
    //--

}

// ------------- コメントの更新登録 ---------------
function updateComment(){
    const loginUser = window.parent.fb_getLoginUser();
    
    // ---
    if (pageconfig.postData.ownerids.indexOf(loginUser.email) <0 ){
        window.parent.fb_myconsolelog("Error: 権限のない更新操作が行われました。:"+loginUser.email)
        return 0;
    }
    //------
    let tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem_newInput){
        tgtElem_newInput.style.display ="block";
    }
    
    //    dispBBSControllBtn()
    let tgtElem_Ctrl = document.getElementById(HtmlElement_myControllDivId);
    if(tgtElem_Ctrl){
        tgtElem_Ctrl.style.display ="none";
        // tgtElem_Ctrl.innerHTML ="";
    }

    let tgtElem_disp = document.getElementById(HtmlElement_myDetailsDispAreaId);
    if(tgtElem_disp){
        tgtElem_disp.style.display ="none";
    }
    
    const BtnSubmit = document.getElementById(HtmlElement_mybutton_submitComent_BtnId);
    if(BtnSubmit){
         BtnSubmit.removeEventListener("click", updateComment_preExec );
         BtnSubmit.addEventListener("click", updateComment_preExec );
    }
    
}
function updateComment_preExec(ev){
    let strMsg="";
    const tgtElem_newInput = document.getElementById(HtmlElements_comment.myNewDetailsTextareaId);
    if(tgtElem_newInput){
        strMsg = tgtElem_newInput.value;
    }
    if(strMsg.length>=BBS_Configs.MaxDatasize_comment){
            ngflg=1;strMsg+="本文が長すぎます。\n";
            return null;
    }
    strMsg = strMsg.substring(0,BBS_Configs.MaxDatasize_comment);
    if(strMsg.trim()==""){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が入力されていません");
        alert("値を入力してください");
        return 0;
    }
    
    let strTtl="";
    const tgtElem_ttl = document.getElementById(HtmlElements_comment.myNewTitleTextId);
    if(tgtElem_ttl){
        strTtl = tgtElem_ttl.value ? tgtElem_ttl.value : "";
    }
    
    
    updateComment_exec(strTtl , strMsg);
}
async function updateComment_exec(strTtl , strMsg){
    const strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/discussion";
    const loginUser = window.parent.fb_getLoginUser();
    
    // ---
    if (pageconfig.postData.ownerids.indexOf(loginUser.email) <0 ){
        window.parent.fb_myconsolelog("[Error] : 権限のない更新が行われました。(exec):"+loginUser.email)
        return 0;
    }
    // ---
    let docdata={};
    let nochangeflg=1;
    //docdata.ownerids=[loginUser.email]; //mailAddress
    //docdata.ownername=loginUser.displayName;
    //docdata.modified = fsdb_serverTimestamp();
    
    // -- Title --
    const newtitle = window.parent.escapeHtml( strTtl );
    docdata.titlecategory=newtitle
    if(pageconfig.postData.titlecategory != newtitle){ nochangeflg=0; }
    
    // -- 本文 --
    const strNewDetails=window.parent.escapeHtml(strMsg);
    if(pageconfig.postData.details != strNewDetails){ nochangeflg=0; }
    docdata.details=strNewDetails;
    
    // --------------------------
    if(nochangeflg){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が更新されていません");
        alert("変更されていません。");
        return 0;
    }
    
    // -- 過去履歴 --
    const dateDetailsOld= window.parent.myDateTimeFormat(pageconfig.postData.modified);
    const strtitle= pageconfig.postData.titlecategory;
    const strDetailsOldHd = "("+dateDetailsOld+") " + (strtitle?strtitle:"");
    if(BBS_Configs.recordHistorySize>=0){
        let recordStr = strDetailsOldHd + "<br />\n";
        if(BBS_Configs.recordHistorySize!=0){
            recordStr +=  (pageconfig.postData.details).substring(0,BBS_Configs.recordHistorySize) +"<br />\n" 
        }
        docdata.details_old = (recordStr + pageconfig.postData.details_old).substring(0,BBS_Configs.MaxDatasize_History);
    }
    
    // ----------
    if(!confirm( "OK?" +strTtl )){
        return 0;
    }
    // ----------
    let flgOk=0;
    try {
        let tryProcess = window.parent.fb_updateDataOnFirestore(strdbpath ,  pageconfig.commentCode   , docdata);
        let try1 = await tryProcess;
        if(try1!==null){ flgOk=1; }
    } catch(e){
        let msg="データの更新登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : "+msg );
        setTimeout( function(){throw e;} );
        alert(msg);
        return null;
    }
    if(!flgOk){
        let msg="データの更新登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : " + msg );
        alert(msg);
    }else{
        //let opt={};
        //opt["b"]=pageconfig.bbsCode;
        //opt["t"]=pageconfig.threadCode;
        //window.parent.changeIframeTarget_main("bbs_thread",opt);
        window.parent.changeIframeTarget_main("bbs_thread",{b:pageconfig.bbsCode,t:pageconfig.threadCode});
        
        //createNewComment_hide();
        
    }
}


// ------------------------------------
// ---------- 以下、テスト用 ----------


async function aa(){
    
    let data = await window.parent.fb_getDataFromFirestoreDb("BulletinBoardList/BBS01/threadList",0,5);
    
    let keylist=Object.keys(data);
    alert(keylist.length);
    
}


async function bb(){
    let adddata={};
    
    adddata.ownerids = ["tkym@m3.kcn.ne.jp"];
    adddata.title = "たいとる";
    adddata.threadtype = "";
    adddata.ownername = "ほげ";
    adddata.overview = "ああああああああ";
    
    
    let dataPromise = window.parent.fb_addDataToFirestore("BulletinBoardList/BBS01/threadList",adddata);
    
    let newdoc = await dataPromise;
    alert(newdoc);
    
}

//***********

function mytest(msg){
    // ----------for test--------
    // 名前 , 関数 , エレメントID , mode={0:中の末尾  1:並びの末尾(parentNode指定)  2:並びの次の位置},検索対象Document
    //window.parent.createHtmlElement_button("uuu","mytest()","forTest",0,this.document);
    HtmlElement_myTest = document.getElementById("forTest");
    if(HtmlElement_myTest){
        // 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法,document }
        window.parent.createHtmlElement_button("FireStore","aa()","forTest",0,document);
        window.parent.createHtmlElement_button("FireStore_add","bb()","forTest",0,document);
        
        window.parent.createHtmlElement_button("test01","window.parent.fb_fs_mytest_firestore(1);","forTest",0,document);
        window.parent.createHtmlElement_button("test02","window.parent.fb_fs_mytest_firestore(2);","forTest",0,document);
        window.parent.createHtmlElement_button("test03","window.parent.fb_fs_mytest_firestore(3);","forTest",0,document);
    }
}

//***********  Export ***************

window.func_iframeOnload = func_iframeOnload;
window.updateComment = updateComment;
window.updateComment_preExec = updateComment_preExec;
window.createNewComment_hide=createNewComment_hide;
