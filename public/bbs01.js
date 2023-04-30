const HtmlElement_myTableDivId ="bbs01_ListTable";
const HtmlElement_myControllDivId ="bbs01_controll";
const HtmlElement_myNewDetailsDivId ="bbsThread_NewDetails";


const comment_MaxDatasize = 100;

//---
const pageconfig={};

//---------------------------------------
let HtmlElement_myTableDiv = null;
function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    let urlOptionsAry = window.parent.getUrloptions(window.location.search);
    pageconfig.bbsCode = "BBS01"; // = urlOptionsAry["b"];
    
    //---------
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint01","home");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint02","bbs");
    
    //---------
    dispBBSList();
    dispBBSControllBtn();
    
    //---------
    
    
    
    if(1==2){  mytest(); }
};

function moveFramePage(pagename,threadCode,bbsCode="BBS01"){
    let opt={};
    opt["b"]=bbsCode;
    opt["t"]=threadCode;
    window.parent.changeIframeTarget_main(pagename,opt);
}

// -------------------------------
const expandDirection = -1; // 0:順方向(古いものから)  -1:逆方向(新しいものから)
const expandNumber = 10;      // 1頁あたりの表示行数
let counterOfPageNumber = 0; // 表示頁数(最初は０)
// -------------------------------
async function dispBBSList(){
    let tgtElem = document.getElementById(HtmlElement_myTableDivId);
    if(!tgtElem){return;}
    
    
    const loginUser = window.parent.fb_getLoginUser();
    //const adminFlg = pageconfig.threadDocInfo.ownerids.indexOf(loginUser.email) >= 0;
    
    let strdbpath = "BulletinBoardList/BBS01/threadList";
    
    
    
    let dispContents="";
    //----
    dispContents+="<table width=100%>";
    dispContents+="<tr> <th>種別</th> <th>タイトル</th> <th>担当</th> <th>内容</th> </tr>";
    
    let itempos = counterOfPageNumber * expandNumber; //1件目を0と数える
    let itemnumber = expandNumber;
    if(expandDirection<0){
        itempos = 0-itempos-1;
        itemnumber = 0-itemnumber;
    }
    let data = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,itempos,itemnumber);
    let keylist=Object.keys(data);
    for(let key in keylist){
        const tgtdoc = data[keylist[key]];
        const adminFlg = ( tgtdoc.ownerids ? (tgtdoc.ownerids.indexOf(loginUser.email) >= 0) : false );
        const strH = tgtdoc.hideflg ? tgtdoc.hideflg :"";
        const flgDisp = ( strH ? adminFlg : 1 );
        
        dispContents += `<tr myinfo_pos="${keylist[key]}" myinfo_sort="${tgtdoc.sort}">`;
        
        let strT = strH;
        if(!strT) { strT = tgtdoc.threadtype; if(!strT) { strT=""; } }
        dispContents += `<td>${strT}</td>`;
        
        if(flgDisp){
            let strA =`<a href="javascript:moveFramePage('bbs_thread','${tgtdoc.primaryKey}')">${tgtdoc.title}</a>`;
            //let strA =`<input type="button" value="開く" onclick="moveFramePage('bbs_thread','${tgtdoc.primaryKey}')" />${tgtdoc.title}`;
            dispContents += `<td>${strA}</td>`;
            
            dispContents += `<td>${tgtdoc.ownername}</td>`;
            dispContents += `<td>${tgtdoc.overview}</td>`;
        }else{
            dispContents += `<td> - </td><td>${tgtdoc.ownername}</td><td> - </td>`;
        }
        
        dispContents += `</tr>`;
    }
    
    dispContents+="</table>";
    
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
    //----
    
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


function dispBBSControllBtn(){
    let tgtElem = document.getElementById(HtmlElement_myControllDivId);
    if(!tgtElem){return;}
    
    let dispContents="";
    //----
    dispContents+=`<input type="button" id="button_expandPageBackward" value="前ページ" onclick="func_expandPageNext(-1);" />`;
    dispContents+=`<input type="button" id="button_expandPageForward"  value="次ページ" onclick="func_expandPageNext(1);" /><br />`;
    
    
    dispContents+=`<input type="button" id="`+HtmlElement_myNewDetailsDivId+`_createBtn" value="新規作成" onclick="open_createNewThread();" />`;
    
    
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
}
function func_expandPageNext(directionFlg){
    counterOfPageNumber+=directionFlg;
    if(counterOfPageNumber<0)counterOfPageNumber=0;
    dispBBSList();
}











//---------------------------
function open_createNewThread(){

    let tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem_newInput){
        let dispContents="";
        dispContents+=`<input type="text" id="`+HtmlElement_myNewDetailsDivId+`_ttl" name="title" maxlength="100" size="40" value="">`;
        dispContents+=`<textarea id="`+HtmlElement_myNewDetailsDivId+`_text1" style="width:100%; height:80px;"></textarea>`;
        dispContents+=`<input type="button" id="`+HtmlElement_myNewDetailsDivId+`_submitBtn" value="新規スレッド作成" onclick="createNewThread_submit();" />`;
        dispContents += `　<input type="button" value="入力を破棄して閉じる" onclick="createNewThread_hide();" />`;
        // ---
        tgtElem_newInput.innerHTML =dispContents;
        tgtElem_newInput.style.display ="block";
    }
    
    let tgtElem_BtnForOpen = document.getElementById(HtmlElement_myNewDetailsDivId+"_createBtn");
    if(tgtElem_BtnForOpen){
        tgtElem_BtnForOpen.disabled=true;
    }

}
function createNewThread_hide(){
    let tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId);
    if(tgtElem_newInput){
        tgtElem_newInput.style.display ="none";
        //tgtElem_newInput.innerHTML="";
    }
    
    let tgtElem_BtnForOpen = document.getElementById(HtmlElement_myNewDetailsDivId+"_createBtn");
    if(tgtElem_BtnForOpen){
        tgtElem_BtnForOpen.disabled=false;
    }
}



async function createNewThread_submit(){
    let strMsg="";
    let ngflg=0;
    
    let docdata1={};
    // --------------------------
    let tgtElem_newInput;
    
    tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId+"_ttl");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：" + HtmlElement_myNewDetailsDivId+"_ttl \n"; }else{
        if(tgtElem_newInput.value==""){
            ngflg=1;strMsg+="タイトルを入力してください。\n";
        }else{
                docdata1.title = tgtElem_newInput.value.substring(0,comment_MaxDatasize);
        }
    }
    
    tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsDivId+"_text1");
    if(!tgtElem_newInput){ ngflg=1; strMsg+="notFoundError：" + HtmlElement_myNewDetailsDivId+"_overview \n"; }else{
        if(tgtElem_newInput.value==""){
            ngflg=1;strMsg+="概要を入力してください。\n";
        }else{
                docdata1.overview = tgtElem_newInput.value.substring(0,comment_MaxDatasize);
        }
    }
    // -----
    
    docdata1.hideflg = "作成中";
    docdata1.threadtype="";
    
    // --------------------------
    if(ngflg){
        //window.parent.fb_myconsolelog("[Info] 登録処理を中断："+strMsg);
        alert(strMsg);
        return null;
    }
    // -----------------------------------------------------------------------------
    
    const loginUser = window.parent.fb_getLoginUser();
    const strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"; 
    //------
    
    let docdata={};
    for(let key in docdata1){
        docdata[key]= window.parent.escapeHtml(docdata1[key]);
    }
    
    docdata.ownerids = [loginUser.email];
    docdata.ownername = loginUser.displayName;
    
    
    //------------------------------------------------------
    // ---------- 投稿する ------
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
        //------- 成功 ------
        
        createNewThread_hide();
    }
    
}





// ============================================== 以下、テスト用 ==============
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

