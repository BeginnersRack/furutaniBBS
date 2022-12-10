// import "./my_authentication.js";
import {getServerTimeFromRTDB} from "./myfunc_getlog.js";
import {myDateTimeFormat} from "./myfunc_common.js";


let g_session_id="";
let g_session_num=-1;

//*********** my functions ****************

function getMySessionNumber(){
    if((typeof g_session_num!="number") || (g_session_num<0)){
        g_session_num=-1;
        
        const myssid=getSessionID();
        if(myssid){
            const lsdbtbl = getSessonIdList(-1);
            if(lsdbtbl){if(myssid in lsdbtbl){
                let temp = lsdbtbl[myssid].sessionnumber;
                if(temp){
                    temp=Number(temp);
                    if(typeof temp=="number"){
                        g_session_num = temp;
                    }
                }
            }}
        }
    }
    return g_session_num;
}

function getSessionID(mode=0){  // mode=0だとメモリから値を取得する。mode=1だと、必ずsessionStorageから取得する
    let sid=g_session_id;
    if(mode==1){sid=0}
    if(!sid){
        sid=sessionStorage.getItem('sessionid');
    }
    if(!sid)sid="";
    g_session_id = sid;
    
    return sid;
}
function setSessionID(strId){
    sessionStorage.setItem('sessionid', strId );
    g_session_id = strId;
}

//****
//  localStorageにあるセッションリストを返す。同時に自分のデータを更新する
function getSessonIdList(suppressOverwrite=-1){ // suppressOverwrite=0だと更新後のデータを返す。1だと更新前を返す。-1だと更新しない。
    let strData = localStorage.getItem('sessionids');
    let objData ={};
    try {
        objData = JSON.parse(strData);
    }catch(error){
        myconsolelog(`[error] Can not getSessonIdList! (${error.code}:${error.message})`);
        objData ={};
    }
    if(!objData)objData={};
    if(suppressOverwrite>=0){
       if(suppressOverwrite==0){
           objData = updateSessonIdList(objData);
       }else{
           updateSessonIdList(objData);
       }
    }
    if(!objData)objData={};
    return objData;
}
function updateSessonIdList(objData0=null , deleteid=null){
    let objData = objData0;
    if(objData===null){ objData = getSessonIdList(-1); }
    
    let sid = getSessionID();
    if(!sid){return null;}
    
    let nowtime = getServerTimeFromRTDB();
    
    // 保存データの生成
    let mydata=objData[sid];
    if(!mydata){  // 初期値生成
        if(deleteid!=sid){
            g_session_num = getNewSessionNumber();
            mydata= {   sessionnumber: g_session_num
                      , starttime   : nowtime
                      , starttimestr: myDateTimeFormat(nowtime)
                      , lasttime    : 0
                      , lasttimestr : ""
                    };
        }
    }
    //データの更新
    if(mydata){if(deleteid!=sid){
        mydata.lasttime = nowtime;
        mydata.lasttimestr = myDateTimeFormat(nowtime);
    }}
    
    //古すぎるデータの削除
    let keys=Object.keys(objData);
    for(let i=keys.length-1;i>=0;i--){
        let tgttime = 0;
        if(deleteid!=keys[i]){
            tgttime = objData[keys[i]].lasttime;
            if(!tgttime){tgttime = 0;}
        }
        if( (nowtime - tgttime)>86400000){ // 1日x24Hx60minx60sec*1000 = 86400000/日.
            //delete objData[keys[i]]; objData=objData.filter(Boolean);
            //objData.splice(i,1); //deleteの代わり
            delete objData[keys[i]];
        }
    }
    
    //更新したデータの登録
    if(deleteid!=sid){ objData[sid] = mydata; }
    let strData = JSON.stringify(objData);
    localStorage.setItem('sessionids' , strData);
    
    return objData;
}

function getNewSessionNumber(){
    let snum=localStorage.getItem('sessionidcounter');
    if(!snum){snum=0;}else{snum=Number(snum);}
    
    localStorage.setItem('sessionidcounter' , snum+1 );
    
    return snum;
}








//*********** my functions ****************

// if (storageAvailable('localStorage')) {
// if (storageAvailable('sessionStorage')){
function storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}




//***********  Export ***************
export { getSessionID , setSessionID , getSessonIdList,updateSessonIdList ,getMySessionNumber };


