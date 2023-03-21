const HtmlElement_myTitleSpanId ="bbsThread_title";
const HtmlElement_myDetailsDivId ="bbsThread_Details";
const HtmlElement_myTableDivId ="bbsThread_ListTable";
const HtmlElement_myControllDivId ="bbsThread_controll";
const HtmlElement_myNewDetailsDivId ="bbsComment_NewDetails";
const HtmlElement_myNewDetailsTextareaId ="bbsComment_NewDetailsText";
const HtmlElement_mybutton_submitComent_BtnId ="button_submitComment";

const indexedDbName = "furutaniBBS";

const pageconfig={};

//---------------------------------------
let HtmlElement_myTableDiv = null;
async function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    let urlOptionsAry = window.parent.getUrloptions(window.location.search);
    pageconfig.bbsCode = urlOptionsAry["b"];
    pageconfig.threadCode = urlOptionsAry["t"];
    //---------
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint01","home");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint02","bbs");
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint03",pageconfig.bbsCode,{},pageconfig.bbsCode);
    
    //---------

    
    const storeName="BulletinBoardList/"+pageconfig.bbsCode+"/threadList";
    pageconfig.threadDocInfo = await window.parent.getdataFromIndexedDb(indexedDbName ,storeName ,pageconfig.threadCode);
    
    let tgtElem = document.getElementById(HtmlElement_myTitleSpanId);
    if(tgtElem){
        tgtElem.innerHTML = pageconfig.threadDocInfo.title;
    }
    //---------
    
    dispDetails();
    
    dispBBSList();
    dispBBSControllBtn();
    
    //---------
    
    
    
    if(1==2){  mytest(); }
};

function moveFramePage(pagename,commentCode="",threadCode=(pageconfig.threadCode || ""),bbsCode=(pageconfig.bbsCode || "BBS01") ){
    let opt={};
    if(bbsCode)    opt["b"]=bbsCode;
    if(threadCode) opt["t"]=threadCode;
    if(commentCode)opt["c"]=commentCode;
    window.parent.changeIframeTarget_main(pagename,opt);
}


// -------------------------------
const expandDirection = -1; // 0:順方向(古いものから)  -1:逆方向(新しいものから)
const expandNumber = 1;      // 1頁あたりの表示行数
let counterOfPageNumber = 0; // 表示頁数(最初は０)
// -------------------------------
async function dispBBSList(){
    let tgtElem = document.getElementById(HtmlElement_myTableDivId);
    if(!tgtElem){return;}
    
    let strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/discussion";
    
    let dispContents="";
    //----------------
    dispContents+="記事内容<br />";
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
        let tgtdoc = data[keylist[key]];
        dispContents += `<tr myinfo_pos="${keylist[key]}" myinfo_sort="${tgtdoc.sort}">`;
        
        dispContents += `<td>${tgtdoc.threadtype}</td>`;
        const idxPKey=(tgtdoc.primaryKey.split("/"));
        const fsPKey= idxPKey[idxPKey.length-1];
        let strA =`<a href="javascript:moveFramePage('bbs_comment','${fsPKey}')">${tgtdoc.title}</a>`;
        dispContents += `<td>${strA}</td>`;
        dispContents += `<td>${tgtdoc.ownername}</td>`;
        dispContents += `<td>${tgtdoc.overview}</td>`;
        
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



async function dispDetails(){
    let tgtElem = document.getElementById(HtmlElement_myDetailsDivId);
    if(!tgtElem){return;}
    

    
    let dispContents="";
    //----
    
    let strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/contents";
    let data_config = await window.parent.fb_getDataFromFirestoreDb_singleDoc(strdbpath,"_system").catch(function(reject){
        console.log("[Error] getDataFromFirestoreDb_singleDoc : "+strdbpath +" _system : "+ reject);
        return null;
    });
    if(!data_config){ return; }
    
    
    // -----
    dispContents+="<table width=100%>";
    dispContents+="<tr> <th>記事内容</th>  </tr>";
    
    let data = await window.parent.fb_getDataFromFirestoreDb( strdbpath ,0,1000);
    let keylist=Object.keys(data);
    for(let key in keylist){
        let tgtdoc = data[keylist[key]];
        
        dispContents+=`<tr> <td> ${tgtdoc.details}  </td>  </tr>`;
        
    }
    dispContents+="</table>";
    
    
    //----
    tgtElem.innerHTML ="";
    tgtElem.insertAdjacentHTML('beforeend', dispContents );
    //----
    
    //----
}



function dispBBSControllBtn(){
    let tgtElem = document.getElementById(HtmlElement_myControllDivId);
    if(!tgtElem){return;}
    
    let dispContents="";
    //----
    dispContents+=`<input type="button" id="button_expandPageBackward" value="前ページ" onclick="func_expandPageNext(-1);" />`;
    dispContents+=`<input type="button" id="button_expandPageForward"  value="次ページ" onclick="func_expandPageNext(1);" /><br />`;
    
    
    dispContents+=`<input type="button" id="button_createNewComment" value="コメントを追加" onclick="open_createNewComment();" />`;
    
    
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
        tgtElem_newInput.style.display ="block";
    }
    
    let tgtElem_BtnForOpen = document.getElementById("button_createNewComment");
    if(tgtElem_BtnForOpen){
        tgtElem_BtnForOpen.disable;
    }
    
    let tgtElem_BtnForExec = document.getElementById(HtmlElement_mybutton_submitComent_BtnId);
    if(tgtElem_BtnForExec){
        tgtElem_BtnForExec.addEventListener("click",function(ev){ createNewComment_submit(); });
    }

}

function createNewComment_submit(){
    let strMsg="";
    const tgtElem_newInput = document.getElementById(HtmlElement_myNewDetailsTextareaId);
    if(tgtElem_newInput){
        strMsg = tgtElem_newInput.value;
    }
    if(strMsg.trim()==""){
        window.parent.fb_myconsolelog("[Info] 登録処理を中断：内容が入力されていません");
        alert("値を入力してください");
        return 0;
    }
    //------
    let docdata={};

    const loginUser = window.parent.fb_getLoginUser();
    
    const strNewDetails=window.parent.escapeHtml(strMsg);
    docdata.details = strNewDetails;
    docdata.details_old="";
    
    docdata.ownerids = [loginUser.email];
    docdata.ownername = loginUser.displayName;
    
    // ---------- コメントを投稿する
    const strdbpath = "BulletinBoardList/"+pageconfig.bbsCode+"/threadList/"+pageconfig.threadCode+"/discussion";
    if(confirm( "OK?"  )){
        window.parent.fb_addDataToFirestore(strdbpath , docdata);
    }
    // ----------
    let opt={};
    opt["b"]=pageconfig.bbsCode;
    opt["t"]=pageconfig.threadCode;
    window.parent.changeIframeTarget_main("bbs_thread",opt);

}




//---------------------------
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

