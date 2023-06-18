import { HtmlElements_comment,createHtmlElem_commentForEdit } from "./bbs_comment_m.js";
import { myAryNormalize , myAryCmp , createHtmlElement_button } from "./common.js";

// -----
const HtmlElement_myTitleSpanId ="bbsThread_title";
const HtmlElement_myTtlInfoDivId ="bbsThread_Infos";
const HtmlElement_myDetailsDivId ="bbsThread_Details";
const HtmlElement_myTableDivId ="bbsPost_ListTable";
const HtmlElement_myControllDivId ="bbsPost_controll";
const HtmlElement_myNewDetailsDivId ="bbsComment_NewDetails";
const HtmlElement_mySystemMessage01SpanId ="SystemMessage01";
const HtmlElement_myVoteDivId ="bbsThread_vote";

const HtmlElement_myThreadModifyDivId ="bbsThread_modify";

//-- 以下、JavaScript内で生成するもの
const HtmlElement_mybutton_submitComment_BtnId ="button_submitComment";
const HtmlElement_createNewCommentBtn ="button_createNewComment";

// ------------------------
const BBS_Configs={};

// ------------------------------- コメント表示
const expandDirection = -1; // 0:順方向(古いものから)  -1:逆方向(新しいものから)
const expandNumber = 10;      // 1頁あたりの表示行数

// ----------------------------------
const indexedDbName = "furutaniBBS";

const comment_MaxDatasize = 100;
const threadContent_MaxDatasize = 100;
// -----
const pageconfig={};

//---------------------------------------
// let HtmlElement_myTableDiv = null;
async function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    let urlOptionsAry = window.parent.getUrloptions(window.location.search);
    pageconfig.bbsCode = urlOptionsAry["b"];
    pageconfig.threadCode = urlOptionsAry["t"];
    pageconfig.FilenameCode = pageconfig.bbsCode.toLowerCase();
    
    const confAry = await import( './'+pageconfig.FilenameCode+'.js' );
    if(confAry){
        if(confAry.PM_BBSconfigs){
            BBS_Configs.c_bbsCode = confAry.PM_BBSconfigs.c_bbsCode;
            //--
            BBS_Configs.c_threadtypeAry = confAry.PM_BBSconfigs.c_threadtypeAry;
            if(!BBS_Configs.c_threadtypeAry) BBS_Configs.c_threadtypeAry = {proposal:"提案",question:"教えて",share:"共有",report:"報告"};
            
        }
    } 
    
    let tgtElem;
    // --
    const mySystemIndicatorFunc = mySystemIndicatorFunc_create(); //閉包関数
    mySystemIndicatorFunc("nowloading",1,"Now loading...");
    
    //---------
    
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    //pageconfig.threadDocInfo = await window.parent.getdataFromIndexedDb(indexedDbName ,storeName ,pageconfig.threadCode);
    pageconfig.threadDocInfo = await window.parent.fb_getDataFromFirestoreDb_singleDoc(storeName,pageconfig.threadCode).catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb_singleDoc : "+storeName +" "+ pageconfig.threadCode +" : "+ reject);
        return null;
    });
    
    let strdbpath = storeName+"/"+pageconfig.threadCode+"/contents";
    pageconfig.threadConfig = await window.parent.fb_getDataFromFirestoreDb_singleDoc(strdbpath,"_system").catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb_singleDoc : "+strdbpath +" _system : "+ reject);
        return null;
    });
    if(!pageconfig.threadConfig){  // return null; 
        pageconfig.threadConfig = {};
    }
    
    
    

    tgtElem = document.getElementById(HtmlElement_myTitleSpanId);
    if(tgtElem){
        tgtElem.innerHTML = pageconfig.threadDocInfo.title;
    }

    //---------
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint01","home");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint02","bbs");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint03",pageconfig.FilenameCode,{},pageconfig.bbsCode);
    
    //---------
    
    dispThreadInfos(0);
    dispDetails();
    
    dispBBSList(); //コメント
    dispBBSControllBtn();
    
    dispVoteCtrl();
    
    //---------
    mySystemIndicatorFunc("nowloading",false);
    
    if(1==2){  mytest(); }
};
// async function getElementByIdPromise(elementId){
//    return new Promise((resolve, reject) => {
//        function myloop(){
//            let tgtelem = document.getElementById(elementId);
//            if(tgtelem){ resolve(tgtelem); return tgtelem;
//            }else{
//                setTimeout(myloop,50);
//            }
//        }
//        myloop();
//    });
// }
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

window.moveFramePage = moveFramePage;
function moveFramePage(pagename,commentCode="",threadCode=(pageconfig.threadCode || ""),bbsCode=(pageconfig.bbsCode || "BBS01") ){
    let opt={};
    if(bbsCode)    opt["b"]=bbsCode;
    if(threadCode) opt["t"]=threadCode;
    if(commentCode)opt["c"]=commentCode;
    window.parent.changeIframeTarget_main(pagename,opt);
}




// -------------------------------
let counterOfPageNumber = 0; // 表示頁数(最初は０)

async function dispBBSList(){ 
    let tgtElem = document.getElementById(HtmlElement_myTableDivId);
    if(!tgtElem){return;}
    
    let strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/discussion";
    
    let dispContents="";
    //----------------
    dispContents+="コメント一覧<br />";
    dispContents+="<table width=100% border='1'>";
    dispContents+="<tr> <th width='120px'>区分/タイトル</th> <th>内容</th> <th width='200px'>投稿者</th> <th width='200px'>投稿日</th> </tr>";
    
    let itempos = counterOfPageNumber * expandNumber; //1件目を0と数える
    let itemnumber = expandNumber;
    if(expandDirection<0){
        itempos = 0-itempos-1;
        itemnumber = 0-itemnumber;
    }
    let data = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,itempos,itemnumber);
    let keylist=Object.keys(data);
    for(let key in keylist){
        let tgtdoc = data[keylist[key]];
        dispContents += `<tr myinfo_pos="${keylist[key]}" myinfo_sort="${tgtdoc.sort}">`;
        
        const idxPKey=(tgtdoc.primaryKey.split("/"));
        const fsPKey= idxPKey[idxPKey.length-1];
        let linktitle= tgtdoc.titlecategory;
        if(linktitle=="") linktitle="○";
        let strA =`<a href="javascript:moveFramePage('bbs_comment','${fsPKey}')">${linktitle}</a>`;
        dispContents += `<td>${strA}</td>`;
        
        dispContents += `<td>${tgtdoc.details.replace( /\n/g ,"<br />")}</td>`; 
        
        dispContents += `<td>${tgtdoc.ownername}</td>`;
        
        let strTime1 = window.parent.myDateTimeFormat(tgtdoc.created,5);
        let strTime2 = window.parent.myDateTimeFormat(tgtdoc.modified,5);
        if(strTime2!="") strTime2 ="("+strTime2+")";
        dispContents += `<td>${strTime1} ${strTime2}</td>`;
        
        dispContents += `</tr>`;
    }
    
    dispContents+="</table>";
    
    //--
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
    
    //------------------
    let btn1 = document.getElementById("button_expandPageBackward");
    if(btn1){
        if(itempos==expandDirection){
            btn1.disabled = "disabled";
        }else{
            btn1.disabled = null;
        }
    }
    let btn2 = document.getElementById("button_expandPageForward");
    if(btn2){
        if(keylist.length==expandNumber){
            btn2.disabled = null;
        }else{
            btn2.disabled = "disabled";
        }
    }
    //----
}


async function dispThreadInfos(editmode=false){
    let tgtElem = document.getElementById(HtmlElement_myTtlInfoDivId);
    if(!tgtElem){return;}
    
    const loginUser = window.parent.fb_getLoginUser();
    const adminFlg = pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >= 0;
    if (editmode){if( !adminFlg ){
        window.parent.fb_myconsolelog("Error: 権限のない更新操作が行われました。:"+loginUser.email)
        editmode=false;
    }}
    
    let threadDoc = pageconfig.threadDocInfo;
    let threadCnf = pageconfig.threadConfig;
    //----
    let dispContents="";
    
    dispContents+="<table width=100%>";
    dispContents+="<tr> <th>★★投稿★★</th><th></th>  </tr>";
    
    dispContents+="<tr><td>タイトル</td><td>";
    if(!editmode){
        dispContents+= threadDoc.title;
    }else{
        dispContents+=`<input type="text" id="ThreadInfoInput_title" name="title" maxlength="100" size="40" value="`;
        dispContents+=``+(threadDoc.title ? threadDoc.title : "")+`">`;
    }
    dispContents+= "</td></tr>";
    
    dispContents+="<tr><td>概要</td><td>";
    if(!editmode){
        dispContents+= (threadDoc.overview).replace( /\n/g ,"<br />");
    }else{
        dispContents+=`<textarea id="ThreadInfoInput_overview" style="width:100%; height:80px;">`;
        dispContents+= threadDoc.overview +`</textarea>`;
    }
    dispContents+= "</td></tr>";
    
    dispContents+="<tr><td>投稿者</td><td>";
    if(!editmode){
        dispContents+= threadDoc.ownername +"  ("+ window.parent.myDateTimeFormat(threadDoc.modified) +")";
    }else{
        dispContents+=`<input type="text" id="ThreadInfoInput_ownername" name="ownername" maxlength="100" size="20" value="`+threadDoc.ownername+`"><br />`;
        if(1==2){
            dispContents+=`管理者ID<textarea id="ThreadInfoInput_ownerids" style="width:100%; height:80px;">`;
            if(threadDoc.ownerids){ for (const elem of threadDoc.ownerids) { if(elem!="") dispContents+= (elem+", "); } }
            dispContents+=`</textarea>`;
        }else{
            dispContents+=`管理者ID<input type="text" id="ThreadInfoInput_ownerids" style="width:80%;" value ="`;
            if(threadDoc.ownerids){ for (const elem of threadDoc.ownerids) { if(elem!="") dispContents+= (elem+", "); } }
            dispContents+=`">`;
        }
    }
    dispContents+= "</td></tr>";
    
    dispContents+="<tr><td>スレッド区分</td><td>";
    if(!editmode){
        if(threadDoc.threadtype in BBS_Configs.c_threadtypeAry){
            dispContents+= BBS_Configs.c_threadtypeAry[threadDoc.threadtype];
        }else{
            dispContents+= threadDoc.threadtype;
        }
        if(threadDoc.hideflg){ dispContents+= (" 　 非公開中：["+threadDoc.hideflg+"]"); }
    }else{
        dispContents+=`<select id="ThreadInfoInput_threadtype" name="threadtype">`;
        for(let key in BBS_Configs.c_threadtypeAry){
            dispContents+= `<option value="`+key+`"`;
            if(threadDoc.threadtype==key) dispContents+=" selected";
            dispContents+= `>`+BBS_Configs.c_threadtypeAry[key]+`</option>`;
        }
        dispContents+=`</select>　　`;
        
        if(threadDoc.hideflg){ dispContents+=`非公開中：理由`; } else { dispContents+=`公開中：非公開化（理由を記入）`; }
        dispContents+=`<input type="text" id="ThreadInfoInput_hideflg"    name="hideflg"    maxlength="40" size="10" value="`;
        dispContents+=``+(threadDoc.hideflg ? threadDoc.hideflg : "")+`">`;
        if(threadDoc.hideflg){ dispContents+=`（理由をクリアして保存すると公開されます）`; }
    }
    dispContents+= "</td></tr>";
    
    

    if(editmode){
        dispContents+="<tr><td>コメント設定</td><td>";
        
        
        dispContents+=`区分：<input type="text" id="ThreadInfoInput_posttitles" name="posttitles" maxlength="100" size="40" value="`;
        if(threadCnf){ if(threadCnf.post_titles==null){ dispContents+= "意見,質問,回答,その他"; 
            }else{if(threadCnf.post_titles){ for (const elem of threadCnf.post_titles) { if(elem!="") dispContents+= (elem+", "); } }
        }   }
        dispContents+=`">`;
        dispContents+=`<label><input type="checkbox" name="ThreadInfoInput_posttitles_free" value="free" `;
        if(threadCnf.post_titles){if(threadCnf.post_titles.indexOf("")>=0){ dispContents+=`checked`; }}
        dispContents+=` />自由記入(タイトル入力)を許可</label>`;
        dispContents+=`<br />`;
        
        
        dispContents+=`投票：<input type="text" id="ThreadInfoInput_voteoptions" name="voteoptions" maxlength="100" size="40" value="`;
        if(threadCnf){ if(threadCnf.voteoptions==null) {  dispContents+= "賛成,反対"; 
            }else{if(threadCnf.voteoptions){ for (const elem of threadCnf.voteoptions) { if(elem!="") dispContents+= (elem+", "); } }
        }   }
        dispContents+=`">`;
        
        
        dispContents+= "</td></tr>";
    }
    
    
    
    dispContents+="</table>";
    //----
    if(editmode){
                dispContents+=`<input type="button" id="button_ThreadInfo_save" value="保存"`;
                dispContents+=` onclick="updateThreadInfo_preExec();" />`;
                dispContents+=`<input type="button" id="button_ThreadInfo_discard" value="修正内容を破棄"`;
                dispContents+=` onclick="dispThreadInfos(0);" />`;
    }else{
        if(adminFlg){
                dispContents+=`<input type="button" id="button_ThreadInfo_modify" value="修正する" onclick="dispThreadInfos(1);" />`;
        }
    }
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );


    // -----
    let tgtElem_BtnForCommentOpen;
    let tgtElem_BtnForThreadOpen;
    if(editmode){
        createNewComment_hide(); // コメント投稿の入力欄を閉じる
        tgtElem_BtnForCommentOpen = document.getElementById(HtmlElement_createNewCommentBtn);
        if(tgtElem_BtnForCommentOpen){ tgtElem_BtnForCommentOpen.disabled=true; }
        
        updateThread_hide(); // "スレッド内容の入力欄を閉じる
        tgtElem_BtnForThreadOpen = document.getElementById("button_modifyThread_New"); 
        if(tgtElem_BtnForThreadOpen){ tgtElem_BtnForThreadOpen.disabled=true; }

    }else{
        tgtElem_BtnForCommentOpen = document.getElementById(HtmlElement_createNewCommentBtn);
        if(tgtElem_BtnForCommentOpen){ tgtElem_BtnForCommentOpen.disabled=false; }

        tgtElem_BtnForThreadOpen = document.getElementById("button_modifyThread_New"); 
        if(tgtElem_BtnForThreadOpen){ tgtElem_BtnForThreadOpen.disabled=true; }
    }
    
}


async function updateThreadInfo_preExec(){
    let strMsg="";
    let docdata1={};
    let docdata2={};
    
    let nochangeflg=1;
    let ngflg=0;
    //----
    let threadDoc = pageconfig.threadDocInfo;
    let threadCnf = pageconfig.threadConfig;
    // --------------------------docdata1
    let tgtElem_newInput;
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_title");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_title\n"; }else{
        if(tgtElem_newInput.value==""){
            ngflg=1;strMsg+="タイトルを入力してください。\n";
        }else{
            if(tgtElem_newInput.value!=threadDoc.title){
                nochangeflg=0;
                docdata1.title = tgtElem_newInput.value;
            }
        }
    }

    tgtElem_newInput = document.getElementById("ThreadInfoInput_overview");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_overview\n"; }else{
        if(tgtElem_newInput.value==""){
            ngflg=1;strMsg+="概要を入力してください。\n";
        }else{
            if(tgtElem_newInput.value!=threadDoc.overview){
                nochangeflg=0;
                docdata1.overview = tgtElem_newInput.value;
            }
        }
    }
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_hideflg");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_hideflg\n"; }else{
            if(tgtElem_newInput.value!=threadDoc.hideflg){
                nochangeflg=0;
                docdata1.hideflg = tgtElem_newInput.value;
            }
    }
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_ownername");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_ownername\n"; }else{
        if(tgtElem_newInput.value==""){
            ngflg=1;strMsg+="管理者名を入力してください。\n";
        }else{
            if(tgtElem_newInput.value!=threadDoc.ownername){
                nochangeflg=0;
                docdata1.ownername = tgtElem_newInput.value;
            }
        }
    }
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_ownerids");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_ownerids\n"; }else{
            let newIds=myAryNormalize(tgtElem_newInput.value);
            if(newIds.length<=0){
                ngflg=1;strMsg+="管理者を無しにはできません。\n";
            }else{
                if(myAryCmp(newIds,threadDoc.ownerids)){
                    nochangeflg=0;
                    docdata1.ownerids = newIds;
                }
            }
    }
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_threadtype");  // select要素 //
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_threadtype\n"; }else{
        if(tgtElem_newInput.value==""){
            ngflg=1;strMsg+="区分を選択してください。\n";
        }else{
            if(tgtElem_newInput.value!=threadDoc.threadtype){
                nochangeflg=0;
                docdata1.threadtype = tgtElem_newInput.value;
            }
        }
    }
    
    //  array は custom object では firestoreに登録できない。 pure JavaScript objects である必要がある。




    // --------------------------docdata2
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_voteoptions");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_voteoptions\n"; }else{
            let newIds=myAryNormalize(tgtElem_newInput.value);
        //    if(newIds.length<=0){
        //        ngflg=1;strMsg+="投票選択肢を設定してください。\n";
        //    }else{
                if(myAryCmp(newIds,threadCnf.voteoptions)){
                    nochangeflg=0;
                    docdata2.voteoptions = newIds;
                }
        //    }
    }
    
    
    
    tgtElem_newInput = document.getElementById("ThreadInfoInput_posttitles");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：ThreadInfoInput_posttitles\n"; }else{
            let newIds=myAryNormalize(tgtElem_newInput.value);
        //    if(newIds.length<=0){
        //        ngflg=1;strMsg+="コメント区分を設定してください。\n";
        //    }else{
            
                let tgtElem_chkbox = document.getElementsByName("ThreadInfoInput_posttitles_free");
                if(tgtElem_chkbox){
                    let chkflg=0;
                    for (let i = 0; i < tgtElem_chkbox.length; i++) { if(tgtElem_chkbox[i].checked) chkflg=1; }
                    if(chkflg){
                        newIds.push("");
                    }
                }
            
                if(myAryCmp(newIds,threadCnf.post_titles)){
                    nochangeflg=0;
                    docdata2.post_titles = newIds;
                }
        //    }
    }
    
    
    
    // --------------------------
    if(nochangeflg){
        //window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が更新されていません");
        alert("変更されていません。");
        return null;
    }
    if(ngflg){
        alert(strMsg);
        return null;
    }
    // --------------------------
    
    updateThreadInfo_exec( docdata1,docdata2 );
}

async function updateThreadInfo_exec( newdocdata1 ,newdocdata2 ){
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList"; 
    const loginUser = window.parent.fb_getLoginUser();
    
    // ---
    if (pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) <0 ){
        window.parent.fb_myconsolelog("[Error] : 権限のない"+strMode +"登録が行われました。(exec):"+loginUser.email)
        return null;
    }
    
    // -- 過去履歴 --
    //  const dateDetailsOld= window.parent.myDateTimeFormat(contentDoc.modified);
    //  const strDetailsOldHd = "("+dateDetailsOld+") ";
    //  newdocdata1.details_old = strDetailsOldHd + "<br />\n" + contentDoc.details +"<br />\n" + contentDoc.details_old;
    
    // ----------
    if(!confirm( "OK?"  )){
        return null;
    }
    // ----------
    let flgOk=0;
    try {
        let try2=0;
        if(Object.keys(newdocdata2).length>0){
            let try2p = window.parent.fb_updateDataOnFirestore(storeName+"/"+pageconfig.threadCode+"/contents" , "_system" , newdocdata2 );
            try2 = await try2p;   // スレッド文書の/contents/_systemを更新
        }
        let try1p = window.parent.fb_updateDataOnFirestore(storeName , pageconfig.threadCode , newdocdata1 ); // 変更なくても更新日だけは更新する
        let try1 = await try1p;   // スレッド文書を更新
        if(try1!==null){if(try2!==null){ flgOk=1; }}
    } catch(e){
        let msg="データの登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : "+msg );
        setTimeout( function(){throw e;} );
        alert(msg);
        return null;
    }
    
    if(!flgOk){
        let msg="データの登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : " + msg );
        alert(msg);
    }else{
        setTimeout( async function(){
            pageconfig.threadDocInfo = await window.parent.getdataFromIndexedDb(indexedDbName ,storeName ,pageconfig.threadCode);
            const strdbpath = storeName+"/"+pageconfig.threadCode+"/contents";
            pageconfig.threadConfig = await window.parent.getdataFromIndexedDb(indexedDbName ,strdbpath ,"_system");
            
            dispThreadInfos(0); // 画面表示を更新
        },100);
    }
}
// ====================

async function dispVoteCtrl(){
    let tgtElem = document.getElementById(HtmlElement_myVoteDivId);
    if(!tgtElem){return;}
    
    //------
    const loginUser = window.parent.fb_getLoginUser();
    const myMailAddrs = loginUser.email;
    // ----
    const adminFlg = pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >= 0;
    let threadCnf = pageconfig.threadConfig;
    let strVoteOptions = threadCnf.voteoptions;
    if(!strVoteOptions){ return; }
    
    let strvl;
    //----------
    let voteRate={};
    let voteMember={};
    let myVote ="";
    
    let datapack=await getVodeDatas();
    if(datapack){ 
        pageconfig.myVoteDoc = null;
        let keylist=Object.keys(datapack);
        for(let key in keylist){
            let tgtdoc = datapack[keylist[key]];
            if(tgtdoc.ownerid){
                let strVoteval = tgtdoc.vote;
                if(strVoteval){
                    let strmem = tgtdoc.ownername+"("+tgtdoc.ownerid+")";
                    if (strVoteval in voteRate) {
                        voteRate[strVoteval] += 1;
                        voteMember[strVoteval] += ("\n"+strmem);
                    }else{
                        voteRate[strVoteval] = 1;
                        voteMember[strVoteval] = strmem;
                    }
                }
                if(tgtdoc.ownerid==myMailAddrs){
                    myVote=(strVoteval?strVoteval:"");
                    pageconfig.myVoteDoc = tgtdoc;
                }
            }
        }
    }
    
    
    //--------------------------------
    let myVoteIndx =-1;
    
    let strSl =`<select id="input_voteSelect01">`;
    let slctIndx=0;
    if(myVote==""){
        strSl+=`<option value="null" selected></option>`;
        myVoteIndx=slctIndx;
        slctIndx++;
    }
    for (let i=0;i<strVoteOptions.length;i++){
        strSl+=`<option value="${i}"`;
        if(strVoteOptions[i]==myVote){ strSl+=` selected`; myVoteIndx=slctIndx; }
        strSl+=`>` + strVoteOptions[i] + `</option>`;
        slctIndx++;
    }
    if(myVote!=""){
        strSl+=`<option value="none">(取消)</option>`;
        slctIndx++;
        if(myVoteIndx<0){
            strSl+=`<option value="ng">`+myVote+`</option>`;
            myVoteIndx=slctIndx;
            slctIndx++;
        }

    }
    strSl+=`</select>`;
    
    // ------
    let dispContents="";
    dispContents+="<table width=100%>";
    dispContents+="<tr><th colspan='1'>投票</th>";
    
    strvl =`<input type="button" id="button_voteSelect01" value="投票を登録" onclick="updateVoteSelect01(`+ myVoteIndx.toString() +`);" />`;
    dispContents+="<td>"+strvl+"</td>";
    
    dispContents+="<td>"+strSl+"</td>";
    
    dispContents+="</tr>";
    
    for (let key in voteRate){
        let cnt=voteRate[key];
        const cntstr = "*".repeat(cnt);
        let ttl = key;
        if(adminFlg){
            // ttl=`<a href="javascript:alert('${voteMember[key]}')">` +ttl+"</a>";
            cnt = `<a href="javascript:alert('${voteMember[key]}')">` +cnt+"</a>";
        }
        dispContents+=`<tr><td>${ttl}</td><td>${cnt}</td><td>${cntstr}</td></tr>`;
    }
    
    dispContents+="</table>";
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
}
async function getVodeDatas(){
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    const strdbpath = storeName+"/"+pageconfig.threadCode+"/vote";

    let data = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,0,0,false); 
    
    return data;
}
async function updateVoteSelect01(defaultIndx=-1){
    const elemSelect = document.getElementById("input_voteSelect01");
    if(!elemSelect){return;}
    
    //const adminFlg = pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >= 0;
    
    const threadCnf = pageconfig.threadConfig;
    const strVoteOptions = threadCnf.voteoptions;
    if(!strVoteOptions){ return; }
    //-------
    const elemSelectedIndex = elemSelect.selectedIndex;
    if(null==elemSelectedIndex){
        alert("投票内容が識別できません");
        return;
    }
    const elemSelectedValue = elemSelect.options[elemSelectedIndex].value;
    const elemSelectedText = elemSelect.options[elemSelectedIndex].text;
    
    if(elemSelectedValue=="null"){
        alert("投票内容が入力されていません");
        return;
    }
    if(elemSelectedIndex==(defaultIndx.toString())){
        alert("投票内容が変更されていません");
        return;
    }
    if(elemSelectedValue=="ng"){
        alert("指定できない投票内容です");
        return;
    }
    
    let newVoteVal = elemSelectedText;
    if(elemSelectedValue=="none") newVoteVal = "";
    
    
    //--- 実行確認 ---
    let orgvl="未入力";
    if(defaultIndx>=0){ if(elemSelect.options[defaultIndx].value!="null"){  orgvl =  elemSelect.options[defaultIndx].text;  }}
    let newvl="取消";
    if(elemSelectedIndex>=0){ if(elemSelectedValue!="none"){  newvl =  elemSelectedText;  }}
    
    let msg="以下の内容で登録しますか？\n";
    msg += orgvl + "\n   ↓\n" +newvl;
    if(!confirm(msg)){
        if(defaultIndx>=0) elemSelect.selectedIndex = defaultIndx;
        return;
    }
    //-----実行
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    const strdbpath = storeName+"/"+pageconfig.threadCode+"/vote";
    
    const loginUser = window.parent.fb_getLoginUser();
    const myMailAddrs = loginUser.email;
    
    let flgOkP;
    let modemsg="？？";
    if(elemSelectedValue=="none" && 1==2){ // 削除
        modemsg="削除";
        try{
            flgOkP = window.parent.fb_deleteDataOnFirestore(strdbpath, myMailAddrs);
        } catch(e){
            let msg="投票データの削除に失敗しました！";
            window.parent.fb_myconsolelog("[Error] : "+msg );
            setTimeout( function(){throw e;} );
            alert(msg);
            return null;
        }
    }else{
        const newdoc = updateVoteSelect01_createDoc( newVoteVal );
        try{
            if(pageconfig.myVoteDoc){  // 更新
                modemsg="更新";
                flgOkP = window.parent.fb_updateDataOnFirestore(strdbpath, myMailAddrs , newdoc , false);
            }else{  // 新規
                modemsg="作成";
                flgOkP = window.parent.fb_addDataToFirestore(strdbpath, newdoc , myMailAddrs);
            }
        } catch(e){
            let msg="投票データの"+modemsg+"に失敗しました！";
            window.parent.fb_myconsolelog("[Error] : "+msg );
            setTimeout( function(){throw e;} );
            alert(msg);
            return null;
        }
    }
    const flgOk = await flgOkP;
    if(!flgOk){
        let msg="投票データの"+modemsg+"に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : " + msg );
        alert(msg);
        return null;
    }
    setTimeout( dispVoteCtrl ,100);
}
function updateVoteSelect01_createDoc(newVoteVal){
    const loginUser = window.parent.fb_getLoginUser();
    const myMailAddrs = loginUser.email;
    
    const orgdoc = pageconfig.myVoteDoc;
    
    // --------------
    const newdocdata = {};
    
    newdocdata.vote = newVoteVal;
    
    // --------------
    // -- 過去履歴 --
    if(orgdoc){
        const dateVoteOld= window.parent.myDateTimeFormat(orgdoc.modified_sys);
        newdocdata.vote_old = "("+dateVoteOld+") " + orgdoc.vote +"<br />\n" + orgdoc.vote_old;
    }else{
        newdocdata.vote_old = "";
    }
    
    // ----
    if(orgdoc){
        if( orgdoc.ownername != loginUser.displayName){
            newdocdata.ownername = loginUser.displayName;
        }
    }else{
        newdocdata.ownerid = myMailAddrs; // key
        newdocdata.ownername = loginUser.displayName;
    }
    // ----
    return newdocdata;
}




// =====================
function setStyleRule(selector,propStr ,overWriteFlg=0){
    const styles = document.head.getElementsByTagName('style');
    let styleEl;
    if(styles.length==0){
        styleEl = document.createElement("style");
        document.head.appendChild(styleEl);
    }else{
        styleEl = styles[0];
    }
    const styleSheet = styleEl.sheet;
    
    let stylesAry = styleSheet.cssRules;
    let flg=0;
    for(let i=0;i<stylesAry.length;i++){
        if(stylesAry[i].selsese == selector){
            flg++;
            if(overWriteFlg){ styleSheet.deleteRule( i ); }
        }
    }
    if(flg==0 || overWriteFlg){
        styleSheet.insertRule(`${selector}{${propStr}}` , styleSheet.cssRules.length );
    }

}
function setDispInfoToolToInputText(elem){
    if(!elem)return 0;
    
    
    // 指定されたエレメントと同じ位置に配置された <div class="tooltip"></div> を検索
    const tooltipAry = elem.parentNode.querySelectorAll('.tooltip');
    if(!tooltipAry) return 0;
    if(tooltipAry.length==0) return 0;
    
    
    tooltipAry.forEach((tooltip) => {
        
        const elem_parent = tooltip.parentNode;
        elem_parent.style.position = "relative"
        // elemの親にあたる要素(div)のstyleを position:relative; とする：重ね合わせ
        
        const tgt_id = tooltip.id ? tooltip.id : "";
        const tgt_keyselector = tgt_id ? ("#"+tgt_id) : ".tooltip";
        
        if(!getStyleRule(tgt_keyselector)){
            
            const allow_type = !tooltip.dataset ? "up" : (tooltip.dataset.allow ? tooltip.dataset.allow : "up");
            
            
            let bordersize = parseInt( ((tooltip.dataset && tooltip.dataset.size ) ? tooltip.dataset.size  :0) ,10);
            if(bordersize<=0)bordersize=12;
            
            let dpos_top = parseInt( ((tooltip.dataset && tooltip.dataset.top ) ? tooltip.dataset.top  :0) ,10);
            let dpos_left= parseInt( ((tooltip.dataset && tooltip.dataset.left) ? tooltip.dataset.left :0) ,10);
            
            let bpos_top = 0;
            let bpos_left =0;
            let mpos_top = 0;
            let mpos_left =0;
            let strBorder ="";
            switch (allow_type){
                case "up":
                    mpos_top =  40;
                    mpos_left=  0;
                    strBorder ="bottom";    // ☒のうちの1辺だけを表示させる
                    bpos_top = -20; // mposからの相対移動量
                    bpos_left=  20;
                  break;
                default:
                    mpos_top = -30;
                    mpos_left= 0;
                    strBorder ="right";
                    bpos_top = 15;
                    bpos_left= -20;
                  break;
            }
            
            // -- スタイルを定義 (before)--
            let propStr ="";
            
            propStr  = "content: '';";
            propStr += "position:absolute;";
            
            propStr += "border:"+bordersize.toString()+"px solid transparent;";    // △を表示させるため、サイズ24の☒を生成して4辺を透明に指定
            propStr += "top:"+(bpos_top).toString()+"px;";
            propStr += "left:"+(bpos_left).toString()+"px;";
            propStr += "border-"+strBorder+":"+bordersize.toString()+"px solid #808080;";   // ☒のうちの1辺だけを表示させる
            setStyleRule(tgt_keyselector+":before",propStr);
            
            
            // -- スタイルを定義 --
            propStr  = "position:absolute;";
            propStr += "background-color:#808080;";
            propStr += "color:white; font-size:0.8em;";  // 文字色
            propStr += "border-radius:0.5em; padding:"+(bordersize-2).toString()+"px;";
            propStr += "margin:-0.8em 0.5em 0 1em;";
            propStr += "top:"+(mpos_top+dpos_top).toString()+"px;";
            propStr += "left:"+(mpos_left+dpos_left).toString()+"px;";
            propStr += "display:none;";    // 初期状態では非表示に指定
            
            setStyleRule( tgt_keyselector ,propStr);
            
        }
    });
    
    
    
    // --イベントを設置--
    elem.onfocus = function () {
        let tooltip = this.parentNode.querySelector('.tooltip');
        tooltip.style.display = 'inline-block';
    };
    elem.onblur = function () {
        let tooltip = this.parentNode.querySelector('.tooltip');
        tooltip.style.display = 'none';
    };
    
}
function getStyleRule(name) {
  for(var i=0; i<document.styleSheets.length; i++) {
    let sheet = document.styleSheets[i];
    for (let ix=0; ix<sheet.cssRules.length; ix++) {
        if (sheet.cssRules[ix].selectorText == name) return sheet.cssRules[ix].style;
    }
  }
  return null;
}

// =====================
let maxsortval=0;
async function dispDetails(){
    let tgtElem = document.getElementById(HtmlElement_myDetailsDivId);
    if(!tgtElem){return;}
    
    const loginUser = window.parent.fb_getLoginUser();
    const adminFlg = pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >= 0;
    const flgDisp = ( pageconfig.threadDocInfo.hideflg ? adminFlg : 1 );
    
    let dispContents="";
    //----
    
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    let strdbpath = storeName+"/"+pageconfig.threadCode+"/contents";
    
    let data_config = pageconfig.threadConfig;
    if(!data_config){ return; }
    
    
    // -----
    dispContents+="<table width=100%>";
    dispContents+="<tr> <th>記事内容</th><th></th>  </tr>";
    
    if(!flgDisp){
        dispContents+=`<tr> <td> ${pageconfig.threadDocInfo.hideflg}  </td><td></td></tr>`;
    }else{
        let data = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,0,1000);
        let keylist=Object.keys(data);
        for(let key in keylist){
            let tgtdoc = data[keylist[key]];
            
            if(tgtdoc.chaptertitle){
              dispContents+=`<tr> <td colspan="2"><big><big><strong> ${tgtdoc.chaptertitle}  </strong></big></big></td></tr>`;
            }
            
            const dt_details = tgtdoc.details.replace( /\n/g ,"<br />");
            dispContents+=`<tr> <td> ${dt_details}  </td>`;
            dispContents+=`<td>`+ updateThread_sw(tgtdoc.primaryKey) +`</td>`;
            dispContents+=`</tr>`;
            
            
            if(tgtdoc.imagelink){
              dispContents+=`<tr><td><img src="`+tgtdoc.imagelink+`"`;   // max-height: 300px;
              dispContents+=` style="display: block; margin: auto; resize: auto;`;
              if(tgtdoc.imageheight){  dispContents+=` height:`+(tgtdoc.imageheight)+`px;`;  }
              dispContents+=`"></td><td></td></tr>`;
            }
            
            //---
            if(tgtdoc.sort){if(Number.isFinite(tgtdoc.sort)){if(maxsortval<tgtdoc.sort){maxsortval=tgtdoc.sort;}}}
        }
        
        if (pageconfig.threadDocInfo.ownerids){
            if (pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >=0 ){
                dispContents+=`<tr> <td> `;
                dispContents+=`<input type="button" id="button_modifyThread_New" value="スレッド投稿内容を追加"`;
                dispContents+=` onclick="updateThread_disp('');" />`;
                dispContents+=`</td><td></td></tr>`;
            }
        }
    }
    dispContents+="</table>";
    
    
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
    //----
    
    //----
}


function dispBBSControllBtn1(){

}
function updateThread_sw(strId3){ // strId3="(threadCode)/contents/(documentId)"
    const strId_ary = strId3.split("/");
    const strId = strId_ary[strId_ary.length-1];
    
    let dispContents="";
    const loginUser = window.parent.fb_getLoginUser();
    if (pageconfig.threadDocInfo.ownerids){
        if (pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >=0 ){
            dispContents+=`<input type="button" id="button_modifyThread_`+strId+`" value="スレッド投稿内容を変更"`;
            dispContents+=` onclick="updateThread_disp('`+strId+`');" />`;
        }
    }
    return dispContents;
}
async function updateThread_disp(strId){
    const loginUser = window.parent.fb_getLoginUser();
    if (pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) <0 ){
        window.parent.fb_myconsolelog("Error: 権限のない更新操作が行われました。:"+loginUser.email)
        return 0;
    }
    const tgtElem = document.getElementById(HtmlElement_myThreadModifyDivId);
    if(!tgtElem){return;}
    //------
    let dispContents="";
    let strBtnVal="";
    
    let contentDoc = {};
    if(strId!=""){
        strBtnVal="更新";
        const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
        contentDoc = await window.parent.getdataFromIndexedDb(indexedDbName ,storeName ,pageconfig.threadCode+"/contents/"+strId);    
    }else{
        strBtnVal="登録";
        contentDoc.details="";
        contentDoc.sort= maxsortval + 10;
    }
    
    dispContents+=`章タイトル：<input type="text" id="updateThread_disp_chapterTitle" name="chapterTitle" maxlength="100" size="40" value="`;
    dispContents+= contentDoc.chaptertitle +`"></input></ br>`;
    dispContents+=`<textarea id="updateThread_disp_textarea" style="width:100%; height:80px;">`;
    dispContents+= contentDoc.details +`</textarea>`;
    dispContents+=`添付画像Link：　Height `; 
    dispContents+=`<span><input type="text" id="updateThread_disp_imageheight" name="imageheight" maxlength="6" size="7" value="`;
    dispContents+=   (contentDoc.imageheight ? contentDoc.imageheight : "") +`"></input> `;
    dispContents+=  `<div><div class="tooltip" id="tooltip_imagelink_height" data-allow="left" data-left="260">`; 
    dispContents+=  `画像サイズを高さで指定します。指定ないときは原寸表示します。</div></div></span> `; 
    dispContents+=`<span>`
    dispContents+= ` <div><div class="tooltip" data-allow="up">外部サイトの画像URLを指定します。OneDrive保存の画像の場合は「埋め込み」でURLを取得してください</div></div>`
    dispContents+= `<input type="text" id="updateThread_disp_imagelink" name="imagelink" maxlength="300" size="120" value="`;
    dispContents+=  (contentDoc.imagelink ? contentDoc.imagelink : "") +`" placeholder="画像のURL / 埋め込みパス"></input> `;
    dispContents+=`</span>`;
    dispContents+=`<input type="button" value="`+strBtnVal+`" onclick="updateThread_preExec('`+strId+`');" />`;
    dispContents+=`　表示順:<input type="text" id="updateThread_disp_sortval" name="sort" maxlength="4" size="4" value="`+contentDoc.sort+`">`;
    dispContents += `　<input type="button" value="入力を破棄して閉じる" onclick="updateThread_hide();" />`;
    
    //------
    tgtElem.innerHTML="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
    tgtElem.style.display ="block";
    
    let tgtElem_i;  // Popup ToolTipを設定
    tgtElem_i = document.getElementById("updateThread_disp_imagelink");
    if(tgtElem_i){  setDispInfoToolToInputText(tgtElem_i);  }
    tgtElem_i = document.getElementById("updateThread_disp_imageheight");
    if(tgtElem_i){  setDispInfoToolToInputText(tgtElem_i);  }
    
    
    // ------
    let tgtElem_btn = document.getElementById(HtmlElement_createNewCommentBtn);
    if(tgtElem_btn){ tgtElem_btn.disabled=true; }
    
    createNewComment_hide(); // コメント投稿の入力欄を閉じる
    let tgtElem_BtnForCommentOpen = document.getElementById(HtmlElement_createNewCommentBtn);
    if(tgtElem_BtnForCommentOpen){ tgtElem_BtnForCommentOpen.disabled=true; }
    
    let tgtElem_BtnForThreadInfoOpen;
    tgtElem_BtnForThreadInfoOpen = document.getElementById("button_ThreadInfo_modify");
    if(tgtElem_BtnForThreadInfoOpen){ tgtElem_BtnForThreadInfoOpen.disabled=true; }
    tgtElem_BtnForThreadInfoOpen = document.getElementById("button_modifyThread_New");
    if(tgtElem_BtnForThreadInfoOpen){ tgtElem_BtnForThreadInfoOpen.disabled=true; }
}
function updateThread_hide(){
    let tgtElem = document.getElementById(HtmlElement_myThreadModifyDivId);
    if(tgtElem){
        tgtElem.style.display ="none";
        tgtElem.innerHTML="";
    }
    
    let tgtElem_BtnForCommentOpen = document.getElementById(HtmlElement_createNewCommentBtn);
    if(tgtElem_BtnForCommentOpen){ tgtElem_BtnForCommentOpen.disabled=false; }

    let tgtElem_BtnForThreadInfoOpen;
    tgtElem_BtnForThreadInfoOpen = document.getElementById("button_ThreadInfo_modify");
    if(tgtElem_BtnForThreadInfoOpen){ tgtElem_BtnForThreadInfoOpen.disabled=false; }
    tgtElem_BtnForThreadInfoOpen = document.getElementById("button_modifyThread_New");
    if(tgtElem_BtnForThreadInfoOpen){ tgtElem_BtnForThreadInfoOpen.disabled=false; }
}
async function updateThread_preExec(strId){
    let strMsg="";
    const tgtElem_newInput = document.getElementById("updateThread_disp_textarea");
    if(tgtElem_newInput){
        strMsg = tgtElem_newInput.value;
    }
    strMsg = strMsg.substring(0,threadContent_MaxDatasize);
    if(strMsg.trim()==""){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が入力されていません");
        alert("値を入力してください");
        return null;
    }
    
    let newsortval=-1;
    const tgtElem_newSortval = document.getElementById("updateThread_disp_sortval");
    if(tgtElem_newInput){
        newsortval = tgtElem_newSortval.value;
        if(isNaN(newsortval)) {newsortval=-1; } else { newsortval=parseInt(newsortval,10); }
    }
    if(newsortval<0 || newsortval>999){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が入力されていません");
        alert("表示位置の指定が無効です。0～999の整数で指定してください");
        return null;
    }
    
    
    let strChapterTitle="";
    const tgtElem_chapterTitle = document.getElementById("updateThread_disp_chapterTitle");
    if(tgtElem_chapterTitle){
        strChapterTitle = tgtElem_chapterTitle.value;
    }
    strChapterTitle = strChapterTitle.substring(0,threadContent_MaxDatasize);
    
    
    let strImageLink="";
    const tgtElem_strImageLink = document.getElementById("updateThread_disp_imagelink");
    if(tgtElem_strImageLink){
        strImageLink = tgtElem_strImageLink.value;
    }
    strImageLink = strImageLink.substring(0,300);
    
    let strImageHeight="";
    const tgtElem_strImageHeight = document.getElementById("updateThread_disp_imageheight");
    if(tgtElem_strImageHeight){
        strImageHeight = tgtElem_strImageHeight.value;
    }
    const numImageHeight = parseInt(strImageHeight,10);
    if(strImageHeight.trim()!="" && (numImageHeight!=numImageHeight || numImageHeight<=0)){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：不正な値（画像サイズ）");
        alert("サイズの指定["+strImageHeight+"]は無効です");
        return null;
    }
    
    
    // --------------------------
    let contentDoc={};
    if(strId!=""){
        const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
        contentDoc = await window.parent.getdataFromIndexedDb(indexedDbName ,storeName ,pageconfig.threadCode+"/contents/"+strId);
    }
    // ---------------
    let nochangeflg=1;
    
    let docdata={};
    
    // -- sort --
    if(contentDoc.sort != newsortval){ 
        nochangeflg=0;
        docdata.sort = newsortval;
    }
    
    // -- 本文 --
    const strNewDetails=window.parent.escapeHtml(strMsg);
    if(contentDoc.details != strNewDetails){ nochangeflg=0; }
    docdata.details=strNewDetails;

    // -- 章タイトル --
    const strNewChapterTitle=window.parent.escapeHtml(strChapterTitle);
    if(contentDoc.chaptertitle != strNewChapterTitle){ nochangeflg=0; }
    docdata.chaptertitle=strNewChapterTitle;

    // -- 画像Link --
    const strNewImageLink=window.parent.escapeHtml(strImageLink);
    if(contentDoc.imagelink != strNewImageLink){ nochangeflg=0; }
    docdata.imagelink=strNewImageLink;
    if(contentDoc.imageheight != numImageHeight){ nochangeflg=0; }
    docdata.imageheight = ( numImageHeight==numImageHeight ? numImageHeight : 0);

    
    // --------------
    if(strId!="" && nochangeflg){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が更新されていません");
        alert("変更されていません。");
        return null;
    }
    // --------------------------
    
    updateThreadContent_exec( strId , contentDoc , docdata );
}

async function updateThreadContent_exec( strId , contentDoc , newdocdata ){
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    const loginUser = window.parent.fb_getLoginUser();
    
    const strMode = (strId!="" ? "更新" : "新規");
    // ---
    if (pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) <0 ){
        window.parent.fb_myconsolelog("[Error] : 権限のない"+strMode +"登録が行われました。(exec):"+loginUser.email)
        return null;
    }
    
    // -- 過去履歴 --
    if(strId!=""){
        const dateDetailsOld= window.parent.myDateTimeFormat(contentDoc.modified);
        const strDetailsOldHd = "("+dateDetailsOld+") ";
        newdocdata.details_old = strDetailsOldHd + "<br />\n" + contentDoc.details +"<br />\n" + contentDoc.details_old;
    }else{
        newdocdata.details_old = "";
    }
    // ----------
    if(!confirm( "OK?"  )){
        return null;
    }
    // ----------
    let flgOk=0;
    try {
        let try1p;
        if(strId!=""){
            try1p = window.parent.fb_updateDataOnFirestore(storeName+"/"+pageconfig.threadCode+"/contents" , strId , newdocdata);
        }else{
            try1p = window.parent.fb_addDataToFirestore(storeName+"/"+pageconfig.threadCode+"/contents" , newdocdata , null);
        }
        let try2p = window.parent.fb_updateDataOnFirestore(storeName , pageconfig.threadCode , {} ); // 更新日だけ更新する
        
        let try1 = await try1p;
        let try2 = await try2p;
        if(try1!==null){if(try2!==null){ flgOk=1; }}
    } catch(e){
        let msg="データの"+strMode+"登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : "+msg );
        setTimeout( function(){throw e;} );
        alert(msg);
        return null;
    }
    
    if(!flgOk){
        let msg="データの"+strMode+"登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : " + msg );
        alert(msg);
    }else{
        
        if(newdocdata.sort && Number.isFinite(newdocdata.sort)){
            setTimeout(async function(){
                const refPath = storeName+"/"+pageconfig.threadCode+"/contents";
                const sortMax = await window.parent.fb_getMaxOfSortIndex(refPath);
                if(sortMax<newdocdata.sort){
                    window.parent.fb_getMaxOfSortIndex( refPath , true);
                }
            });
        }
        
        // let opt={};
        // opt["b"]=pageconfig.bbsCode;
        // opt["t"]=pageconfig.threadCode;
        // window.parent.changeIframeTarget_main("bbs_thread",opt);
        
        //func_expandPageNext(0);
        
        updateThread_hide();
        dispDetails();
    }
}












function dispBBSControllBtn(){
    let tgtElem = document.getElementById(HtmlElement_myControllDivId);
    if(!tgtElem){return;}
    
    let dispContents="";
    //----
    dispContents+=`<input type="button" id="button_expandPageBackward" value="前ページ" onclick="func_expandPageNext(-1);" />`;
    dispContents+=`<input type="button" id="button_expandPageForward"  value="次ページ" onclick="func_expandPageNext(1);" /><br />`;
    
    
    dispContents+=`<input type="button" id="`+HtmlElement_createNewCommentBtn+`" value="コメントを追加" onclick="open_createNewComment();" />`;
    
    
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
}
function func_expandPageNext(directionFlg){
    counterOfPageNumber+=directionFlg;
    if(counterOfPageNumber<0)counterOfPageNumber=0;
    dispBBSList();
}



function open_createNewComment(){

    let tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem_newInput){
        let dispContents=createHtmlElem_commentForEdit(null); //  myNewDetailsTextareaId と myNewTitleTextId を含むHTLM
        
        // コントロール
        dispContents+=`<input type="button" id="`+HtmlElement_mybutton_submitComment_BtnId+`" value="コメント投稿" onclick="createNewComment_submit();" />`;
        dispContents += `　<input type="button" value="入力を破棄して閉じる" onclick="createNewComment_hide();" />`;
        // ---
        tgtElem_newInput.innerHTML =dispContents;
        tgtElem_newInput.style.display ="block";
    }
    
    let tgtElem_BtnForOpen = document.getElementById(HtmlElement_createNewCommentBtn);
    if(tgtElem_BtnForOpen){
        tgtElem_BtnForOpen.disabled=true;
    }

}
function createNewComment_hide(){
    let tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem_newInput){
        tgtElem_newInput.style.display ="none";
        //tgtElem_newInput.innerHTML="";
    }
    
    let tgtElem_BtnForOpen = document.getElementById(HtmlElement_createNewCommentBtn);
    if(tgtElem_BtnForOpen){
        tgtElem_BtnForOpen.disabled=false;
    }
}

async function createNewComment_submit(){
    let strMsg="";
    const tgtElem_newInput = document.getElementById(HtmlElements_comment.myNewDetailsTextareaId);
    if(tgtElem_newInput){
        strMsg = tgtElem_newInput.value;
    }
    strMsg = strMsg.substring(0,comment_MaxDatasize);
    if(strMsg.trim()==""){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が入力されていません");
        alert("値を入力してください");
        return null;
    }
    
    // --
    let strTtl="";
    const tgtElem_ttl = document.getElementById(HtmlElements_comment.myNewTitleTextId);
    if(tgtElem_ttl){
        strTtl = tgtElem_ttl.value ? tgtElem_ttl.value : "";
    }
    
    //---------
    const loginUser = window.parent.fb_getLoginUser();
    const strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/discussion";

    let docdata={};
    
    // -- Title --
    const newtitle = window.parent.escapeHtml( strTtl );
    docdata.titlecategory=newtitle;
    
    // -- 本文 --
    const strNewDetails=window.parent.escapeHtml(strMsg);
    docdata.details = strNewDetails;
    docdata.details_old="";
    
    // -- 他 --
    docdata.ownerids = [loginUser.email];
    docdata.ownername = loginUser.displayName;
    
    // ---------- コメントを投稿する
    if(!confirm( "OK?"  )){
        return null;
    }
    // ----------
    let flgOk=0;
    try {
        let tryProcess =window.parent.fb_addDataToFirestore(strdbpath , docdata);
        let try1 = await tryProcess;
        if(try1!==null){ flgOk=1; }
    } catch(e){
        let msg="データの新規登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : "+msg );
        setTimeout( function(){throw e;} );
        alert(msg);
        return null;
    }
    
    if(!flgOk){
        let msg="データの新規登録に失敗しました。";
        window.parent.fb_myconsolelog("[Error] : " + msg );
        alert(msg);
    }else{
        let opt={};
        //opt["b"]=pageconfig.bbsCode;
        //opt["t"]=pageconfig.threadCode;
        //window.parent.changeIframeTarget_main("bbs_thread",opt);
        
        func_expandPageNext(0);
    }
    
    // ---
    createNewComment_hide();
    setTimeout( dispBBSList ,100);
    
}




//--------------------------- 以下、テストコード --------------------
function test_upcomment(strMsg){
    let strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/discussion";
    let loginUser = window.parent.fb_getLoginUser();
    
    let docdata={};
    docdata.ownerid=loginUser.email; //mailAddress
    docdata.ownername=loginUser.displayName;
    
    docdata.details=window.parent.escapeHtml(strMsg);
    
    if(confirm( "OK?" + docdata.ownerid )){
        window.parent.fb_addDataToFirestore(strdbpath , docdata);
    }
}



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
window.updateThreadInfo_preExec = updateThreadInfo_preExec;
window.dispThreadInfos  = dispThreadInfos;
window.updateVoteSelect01  = updateVoteSelect01;
window.updateThread_disp  = updateThread_disp;
window.updateThread_preExec  = updateThread_preExec;
window.updateThread_hide  = updateThread_hide;
window.func_expandPageNext  = func_expandPageNext;
window.open_createNewComment  = open_createNewComment;
window.createNewComment_submit  =createNewComment_submit ;
window.createNewComment_hide  =createNewComment_hide ;



