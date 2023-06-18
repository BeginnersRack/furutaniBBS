// import {} from "./common.js";



let elem_input;
let elem_button;
let elem_table;
let elem_userInfo;

window.addEventListener("load", function(event) {
    elem_input=document.getElementById("date_limit");
    elem_button=document.getElementById("button_datelimit_reflecter");
    elem_table =document.getElementById("div_infoTable");
    elem_userInfo=document.getElementById("span_UserInfo");

    windowOnloadEvent()
});
function fb_onAuthStateChanged_callback(){
   checkUserLogin();
}

// ---------------------------------------

function windowOnloadEvent(){
    
    if(elem_input){
        
        let tgtDate = new Date();
        //tgtDate.setFullYear(tgtDate.getFullYear() - 1);
        tgtDate.setMonth(tgtDate.getMonth() -3);
        //tgtDate.setDate(tgtDate.getDate() - 10);
        
        elem_input.value=changeFormatDate(tgtDate);
        elem_input.disabled = false;
    }
    
    if(elem_button){
        elem_button.addEventListener("click", function(event){
            datelimit_reflect();
        });
        
        setTimeout( function(){
           window.fb_getLoginUser(1);
           checkUserLogin();
        } ,1000);
        
        
        
    }
}
function checkUserLogin(){

    
    let myuser = fb_getcurrentUser();
    if(elem_button){
        if(myuser){
            elem_button.disabled = false;
            if(elem_table){
                 elem_table.innerHTML="";
            }
            if(elem_userInfo){
                elem_userInfo.innerHTML=myuser.uid;
            }
        }else{
            elem_button.disabled = true;
            if(elem_table){
                 elem_table.innerHTML="";
                 elem_table.insertAdjacentHTML('beforeend', 'mail address <input type="text" id="SigninCode"><br/>');
                 elem_table.insertAdjacentHTML('beforeend', 'your password<input type="password" id="SigninPass"><br/>');
                 elem_table.insertAdjacentHTML('beforeend', '<input type="button" value="signin" id="letsSignin" disabled>');
                 
                 let elcode=document.getElementById("SigninCode");
                 let elpass=document.getElementById("SigninPass");
                 let elbtn =document.getElementById("letsSignin");
                 
                 if(elbtn){if(elcode){if(elpass){
                     elbtn.addEventListener("click", function(event){
                         fb_signIn( 1 , elcode.value , elpass.value );
                     });
                     elbtn.disabled = false;
                 }}}
                 
            }
        }
    }
}

let permissionFlg=0;
async function datelimit_reflect(){
    if(!permissionFlg){
        let myuser = fb_getcurrentUser();
        if(myuser){
            checkPermission().then(function(flg){
                if(flg) { permissionFlg = 1; } else {permissionFlg=-1; }
                datelimit_reflect();
            });
            return;
        }else{
            permissionFlg=-1;
        }
    }
    if(permissionFlg){
        if(permissionFlg<0){
            alert("権限がありません");
            if(elem_button){ elem_button.disabled = true; }
        }else{
            //*** データ取得を実行 ***
            if(!logDataAry){
                let errcnt=await getAllLogDatas();
                if(errcnt!=0){
                    alert("処理エラーがあります："+errcnt);
                }
            }
            
            //*** データ表示 ***
            if(elem_table){
                elem_table.innerHTML=createHtmlTable();
            }
        }
    }
}

let logDataAry=null;
async function getAllLogDatas(){  // 返値  <0:取得失敗  >=0:配列に格納できなかった数
    let anserrcnt =-1;
    
    if(!logDataAry){
        let dblogpath = fb_createAryAccessLogDatas_path("");    //    'logs/'
        //const myQuery = {orderByChild:"timestamp",endAt:(fb_getServerTimeFromRTDB()-(1*24*60*60*1000))};
        
        let snapshot=null
        await fb_getRTDBdatas_promise("once", dblogpath   //  ,null,null , myQuery
        ).then(function(snapshot0){
                console.log(`Logデータを取得しました`);
                snapshot=snapshot0;
        }).catch(function(error){
                console.log(`[ERROR]Logデータが取得できませんでした：${error.code}:${error.message}`);
        });
        
        if(snapshot){
            logDataAry={};
            anserrcnt = 0;
            snapshot.forEach(function(snapshot_member) {
                let key_member = snapshot_member.key;
                let oneuser={};
                let username = "";
                snapshot_member.forEach(function(snapshot_log) {
                    let key_log = snapshot_log.key;
                    let logData = snapshot_log.val();
                    
                    let mykey = myDateTimeFormat(logData.timestamp);
                    if(!mykey){ anserrcnt++; console.log('lost data!');
                    }else{
                        //let onedt={};onedt[mykey]=dblogpath + key_member + "/" +key_log;oneuser.push(onedt);
                        oneuser[(dblogpath + key_member + "/" +key_log)] = mykey;
                        
                        if(logData.usercode) username=logData.usercode;
                    }
                });
                if(!username){ console.log('lost data!!'); } else {
                    logDataAry[username]=oneuser;
                }
            });
        }
        
        
    }
    
    return anserrcnt;
}
function getseparateDate(){
    let separateDate=0;
    if(elem_input)separateDate=Date.parse(elem_input.value); //=new Date(elem_input.value).getTime();
    if(isNaN(separateDate))separateDate=0;
    return separateDate;
}

function createHtmlTable(){
    let ans="";
    if(!logDataAry)return ans;
    
    let separateDate=getseparateDate();
    let cnt1ttl=0;
    let cnt2ttl=0;
    
    let tbldt="";
    for(let memberKey of Object.keys(logDataAry) ){
        let oneuser=logDataAry[memberKey];
        let cnt1=0;
        let cnt2=0;
        for(let logKey of Object.keys(oneuser) ){
            let logKeyVal=Date.parse(oneuser[logKey]);
            if(isNaN(logKeyVal))logKeyVal=0;
            if(logKeyVal<separateDate){
                cnt1++; // 指定日より前
            }else{
                cnt2++; // 指定日以後
            }
        }
        tbldt+="<tr><td>"+memberKey+"</td><td>"+cnt1.toString()+"</td><td>"+cnt2.toString()+"</td></tr>";
        cnt1ttl+=cnt1;
        cnt2ttl+=cnt2;
    }
    
    let btnElem = "<input type='button' value='削除実行' onclick='execDeleteLogs()'>";
    
    ans+="<table border='1'>";
    ans+="<tr><th>User</th><th>指定日より前のLog数<br/>"+btnElem+"</th><th>指定日以後のLog数</th></tr>";
    ans+="<tr><td>総計</td><td>"+cnt1ttl.toString()+"</td><td>"+cnt2ttl.toString()+"</td></tr>";
    ans+=tbldt;
    ans+="</table>";
    
    return ans;
}
function execDeleteLogs(){
    if(!logDataAry){
        alert("データがありません");
        return ans;
    }
    
    let pw = prompt("実行パスを入力してください");
    if(!pw){alert("処理を中断しました。");return 0;}
    if(pw!="exec"){alert("処理を中断しました。");return 0;}
    
    //----------------
    const updates = {};  // 書き込みデータの格納用  keyが保存先のDBパス
    const separateDate=getseparateDate();
    
    for(let memberKey of Object.keys(logDataAry) ){
        let oneuser=logDataAry[memberKey];
        for(let logKey of Object.keys(oneuser) ){
            let logKeyVal=Date.parse(oneuser[logKey]);
            if(isNaN(logKeyVal))logKeyVal=0;
            if(logKeyVal<separateDate){ // 指定日より前
                updates[logKey]=null; //削除を指定 (logKeyはデータパス)
            }
        }
    }
    
    let cnt1= Object.keys(updates).length;
    let msg="("+cnt1.toString()+")件のデータを削除しようとしています。\n実行しますか？";
    let ret=confirm(msg);
    if(!ret){return 0;}
    
    //----------------
    // DB更新の実行

    //firebaseRTDB_update( firebaseRTDB_ref(firebaseRTDB_database) , updates )
    window.fb_firebaseRTDB_update( updates ).then(() => {
          alert("削除しました！");
          logDataAry=null;
          datelimit_reflect();
    }).catch((error) => {
          alert(`[ERROR]データベースへの接続に失敗しました：${error.code}:${error.message}`);
    });
}



async function checkPermission(){
    let ans=false;
    
    let myuser = fb_getcurrentUser();
    let flg=0;
    if(myuser){
        flg=1;
        if(!myuser.uid)flg=0;
        if( myuser.isAnonymous)flg=0;
        if(!myuser.emailVerified)flg=0;
    }
    
    if(flg){
        let dblogpath = "adminusers/";
        const myQuery = {orderByKey:"",equalTo:myuser.uid};
        
        let snapshot=await fb_getRTDBdatas_promise("once", dblogpath ,null,null,myQuery
        ).then(function(snapshot){
                console.log(`admin権限を確認：${myuser.uid}`);
                ans=true;
        }).catch(function(error){
                console.log(`[ERROR]Logデータが取得できませんでした：${error.code}:${error.message}`);
        });
        
        if(snapshot){
            let adminflg = snapshot.val();
            if(adminflg){
                ans=true;
            }
        }
        
    }
    
    return ans;
}


//*************** functions *********************
function changeFormatDate(tgtDate0){
    let tgtDate=tgtDate0;
    if(!tgtDate){   tgtDate = new Date();  }
    
    let yyyy = tgtDate.getFullYear().toString();
    let mm = ("0"+(tgtDate.getMonth()+1).toString()).slice(-2);
    let dd = ("0"+tgtDate.getDate().toString()).slice(-2);
    
    return yyyy+'-'+mm+'-'+dd;
}


// ******* Export *********
window.execDeleteLogs = execDeleteLogs;