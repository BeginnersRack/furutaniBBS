const HtmlElement_myTableDivId ="bbs_ListTable";

//---------------------------------------
let HtmlElement_myTableDiv = null;
function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    window.parent.setEventOfButton_moveFramePage(document,"button_footprint01","home");
    window.parent.setEventOfButton_moveFramePage(document,"button01","bbs01" , {b:"bbs01"} );
    window.parent.setEventOfButton_moveFramePage(document,"button02","bbs02" , {b:"bbs02"} );

    HtmlElement_myTableDiv = document.getElementById(HtmlElement_myTableDivId);



    //---------
    if(1==2){ mytest(); }
};



//***********






//***********

function mytest(){
    // ----------for test--------
    // 名前 , 関数 , エレメントID , mode={0:中の末尾  1:並びの末尾(parentNode指定)  2:並びの次の位置},検索対象Document
    //window.parent.createHtmlElement_button("uuu","mytest()","forTest",0,this.document);
    HtmlElement_myTest = document.getElementById("forTest");
    if(HtmlElement_myTest){
        // 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法,document }
        window.parent.createHtmlElement_button("test","mytest('aaa')","forTest",0,document);
        window.parent.createHtmlElement_button("test01","window.parent.fb_fs_mytest_firestore(1);","forTest",0,document)
        window.parent.createHtmlElement_button("test02","window.parent.fb_fs_mytest_firestore(2);","forTest",0,document)
        window.parent.createHtmlElement_button("test03","window.parent.fb_fs_mytest_firestore(3);","forTest",0,document)
    }
}

//***********  Export ***************

