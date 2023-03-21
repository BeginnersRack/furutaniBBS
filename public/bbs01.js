const HtmlElement_myTableDivId ="bbs01_ListTable";
const HtmlElement_myControllDivId ="bbs01_controll";


//---------------------------------------
let HtmlElement_myTableDiv = null;
function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
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
const expandNumber = 1;      // 1頁あたりの表示行数
let counterOfPageNumber = 0; // 表示頁数(最初は０)
// -------------------------------
async function dispBBSList(){
    let tgtElem = document.getElementById(HtmlElement_myTableDivId);
    if(!tgtElem){return;}
    
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
        let tgtdoc = data[keylist[key]];
        dispContents += `<tr myinfo_pos="${keylist[key]}" myinfo_sort="${tgtdoc.sort}">`;
        
        dispContents += `<td>${tgtdoc.threadtype}</td>`;
        //let strA =`<a href="javascript:moveFramePage('bbs_thread','${tgtdoc.primaryKey}')">${tgtdoc.title}</a>`;
        let strA =`<input type="button" value="開く" onclick="moveFramePage('bbs_thread','${tgtdoc.primaryKey}')" />${tgtdoc.title}`
        dispContents += `<td>${strA}</td>`;
        dispContents += `<td>${tgtdoc.ownername}</td>`;
        dispContents += `<td>${tgtdoc.overview}</td>`;
        
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
    
    
    dispContents+=`<input type="button" id="button_createNewThread" value="新規作成" onclick="alert('aaa');" />`;
    
    
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

