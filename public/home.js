

// 引数 { <input>ボタンのValue値、onclick値、挿入位置基準ElementID、挿入方法 }
//createHtmlElement_button("Home","window.parent.changeIframeTarget_main('home')","",0);


function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される

    window.parent.setEventOfButton_moveFramePage(document,"button01","bbs");
    
    window.parent.setEventOfButton_moveFramePage(document,"button02","meetingroom_lobby");

    // ---------
    firstLoop(); // display Menu
};
window.func_iframeOnload = func_iframeOnload;


function firstLoop(cnt=0){
    let loginUser = window.parent.fb_getLoginUser(1);
    if(loginUser){if(loginUser.uid){
            changeDisplay()
    }else{
        if(cnt<10){
            setTimeout(  firstLoop ,200 , cnt+1);
        }else{
            console.log(`[Info] cannot find Signin User.`);
        }
    }}
}
function changeDisplay(){
    let loginUser = window.parent.fb_getLoginUser(1);
    if((!loginUser)||(!loginUser.uid)){
        return;
    }
    //-----
    changeButtonElemEnabled("button01");
    changeButtonElemEnabled("button02");
    
    let tgtelem = document.getElementById("welcome_message");
    if(tgtelem){
        changeWelcomeMessage(loginUser , tgtelem);
    }
}
function changeButtonElemEnabled(ElemId){
        let tgtelem = document.getElementById(ElemId);
        if(tgtelem){
            tgtelem.removeAttribute("disabled");
        }
}



function changeWelcomeMessage(loginUser , tgtelem=null){
    if(!tgtelem){
        tgtelem = document.getElementById("welcome_message");
    }
    if(!tgtelem){ return; }
    
    if((!loginUser)||(!loginUser.uid)){
        tgtelem.innerHTML="サインインしてください。";
        return;
    }
    
    //--------------------
    const nowTime = new Date()
    const nowHour = nowTime.getHours(); // 0～23
    const nowMinute = nowTime.getMinutes();
    
    let wcmsg="いらっしゃいませ！";
    if(1==1){
        let msgary=[];
        msgary.push( {probability:2   , msg:"へいっ！らっしゃい！"} );
        msgary.push( {probability:0.5 , msg:"お帰りなさいませ！ご主人様！"} );
        if(nowHour>3 && nowHour<15)msgary[msgary.length-1].probability=0;
        msgary.push( {probability:20 , msg:"ＺＺＺzzzz....."} );
        if(nowHour<3 || nowHour>=6)msgary[msgary.length-1].probability=0;
        
        const dice100 = Math.random() * 100;
        let probs=0;
        let indx=-1;
        while (++indx < msgary.length) {
            probs += msgary[indx].probability;
            if(dice100<probs){
                wcmsg = msgary[indx].msg;
                break;
            }
        }
        if(indx >= msgary.length){
            //-----標準-----
            if(dice100>70){
                if(nowHour<=2  || nowHour>=23) wcmsg="遅くまでお疲れ様です！";
                if(nowHour>=5  && nowHour<=9)  wcmsg="おはようございます！";
                if(nowHour>=10 && nowHour<=16) wcmsg="こんにちは！";
                if(nowHour>=18 && nowHour<=22) wcmsg="こんばんは！";
            }
        }
    }
    tgtelem.innerHTML=wcmsg;
    //--------------------
}