



//***********  for Test ***************
//------  権限確認 ------
function buttonAuthCheck_Click(myflg=0){  
    let loginUser = fb_getLoginUser(myflg);
    if(!loginUser){
        alert("???");
    }else{
        if(loginUser.uid){
            let msg ="ID : "+ loginUser.uid;
            msg += "\n" + "email : "+loginUser.email + "  (";
            if (loginUser.emailVerified){msg+="Verified.)";} else {msg+="not checked.)";}
            msg += "\n" + "Name : "+loginUser.displayName;
            alert(msg);
        }else{
            alert("not Signin?")
        }
    }
}
// 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法 }
createHtmlElement_button("check","buttonAuthCheck_Click()","my_auth",1)
window.buttonAuthCheck_Click = buttonAuthCheck_Click;
createHtmlElement_button("u","buttonAuthCheck_Click(1)","my_auth",1)

//------  Logテスト ------
createHtmlElement_button("AccessLog","fb_createAccessLogData(null,'test-log',0)","",0);


//------  signoutテスト ------

function closeBrowserOp(){
        let intCnt=1;
        // 終了するまでの時間稼ぎをする(ただし最大1秒まで) 画面リロードでもトリガされることに注意
        let tgttime = new Date();
        tgttime.setSeconds( tgttime.getSeconds() + 1);
        flg_RTDBwritten=1; // createAccessLogData()処理完了時に0になる
        
        fb_createAccessLogData(null,'QuitBrowser' ,-1); //切断処理
        
        
        while (intCnt>0) {
            let nowtime = new Date();
            if(nowtime>tgttime) intCnt=0;
            if(!flg_RTDBwritten) intCnt=0;
        }
}
createHtmlElement_button("signout-test","closeBrowserOp();alert()","",0);
window.closeBrowserOp = closeBrowserOp;


createHtmlElement_button("clear-localStorage","localStorage.clear();alert()","",0);


//------  iframeテスト ------

// 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法 }
createHtmlElement_button("myAccount","changeIframeTarget_main('myAccount')","my_auth",1)


function buttonChangeIframeTargetTest_Click(caseflg){  
    let tgtPreElem = document.getElementById("iframe_main");
    if(!tgtPreElem){return 0;}

    switch(caseflg){
        case "myAccount":
            tgtPreElem.contentDocument.location.replace("./myAccount.html");
            break;
        case "404":
            tgtPreElem.contentDocument.location.replace("./404.html");
            break;
        default:
            tgtPreElem.contentDocument.location.replace("./"+str_IframeTarget_main_name+".html");
            str_IframeTarget_main_name="404";
    }

}
// 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法 }
createHtmlElement_button("force","changeIframeTargetTest_Click('myAccount')","my_auth",1)
window.changeIframeTargetTest_Click = buttonChangeIframeTargetTest_Click;

createHtmlElement_button("404","changeIframeTargetTest_Click('sghrwt')","my_auth",1)


//------  iframeテスト ------
createHtmlElement_button("Home","changeIframeTarget_main('home')","",0);
createHtmlElement_button("x","changeIframeTarget_main('')","",0);



//------  postMessageテスト ------
function button_test_postMessage_Click(caseflg){  
    let newWinName = prompt("input name of target window",window.name);
    if(newWinName===null){alert("canceled.");return;}
    
    let newWinObj = getOpenedWindow(newWinName);
    if(newWinObj===null){alert("not found.");return;}
    
    newWinObj.postMessage("HELLO! from "+window.name+".",  location.protocol+"//"+location.host );
}

window.button_test_postMessage_Click = button_test_postMessage_Click;
createHtmlElement_button("postMessage","button_test_postMessage_Click()","my_auth",1);

function func_test_postMessage_recieve(event){  
    console.log("A");
    if (event.origin == location.protocol+"//"+location.host ) {
        console.log("postMessage : recieve ["+event.data+"].");
        if(event.data==""){
            console.log("test01");
        }
    }
}
window.addEventListener("message", func_test_postMessage_recieve, false);

// --
function button_test_changeWindowName_Click(caseflg){  
    let newWinName = prompt("input name of this window",window.name);
    if(newWinName===null){alert("canceled.");return;}
    if(newWinName){ window.name = newWinName; }
}
window.button_test_changeWindowName_Click = button_test_changeWindowName_Click;
createHtmlElement_button("rename","button_test_changeWindowName_Click()","my_auth",1);

function getOpenedWindow(name){
	let winobj=window.open('',name,'left=0,top=0,width=0,height=0');
	if(!winobj){ return null; }
	if(winobj.location.href=="about:blank"){
		winobj.close();
		return null;
	}else{
		return winobj;
	}
}





//------  (sample)  ------
function button_test01_Click(caseflg){  
    alert("test01");
    console.log("test01");
}
window.buttonTest01_Click = button_test01_Click;
//<input type="button" value="test01" onclick="func()">を作成
// 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法 }
createHtmlElement_button("test01","buttonTest01_Click()","my_auth",1)

