const HtmlElement_myInfoDivId ="myAccount_infoTable";
let HtmlElement_myInfoDiv = null;
function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    HtmlElement_myInfoDiv = document.getElementById(HtmlElement_myInfoDivId);

    if(HtmlElement_myInfoDiv){
        let infoMessage="";
        let loginUser = window.parent.fb_getLoginUser();
        if(!loginUser){
            infoMessage += "???</br>";
        }else{
            if(!loginUser.uid){
                infoMessage += "not signin</br>";
            }else{
                let msg ="ID : "+ loginUser.uid;
                msg += "\n" + "email : "+loginUser.email + "  (";
                if (loginUser.emailVerified){msg+="Verified.)";} else {msg+="not checked.)";}
                msg += "\n" + "Name : "+loginUser.displayName;
                
                infoMessage += msg+"</br>";
            }
        }
        HtmlElement_myInfoDiv.innerHTML =  infoMessage;
    }
    
    
    //---------
    
    window.parent.createHtmlElement_button("AccessLog","dispMyAccessLogs()","forAdditional",0,this.document);
    
    
    // ----------for test--------
    // 名前 , 関数 , エレメントID , mode={0:中の末尾  1:並びの末尾(parentNode指定)  2:並びの次の位置},検索対象Document
    window.parent.createHtmlElement_button("uuu","mytest()","forTest",0,this.document);
};


function dispMyAccessLogs(){
    const loginUser = window.parent.fb_getLoginUser();
    const rtdbpath = window.parent.fb_createAryAccessLogDatas_path(loginUser.uid);
    
    let openWindowOption="width=500,height=300";
    openWindowOption +=",menubar=0,toolbar=0,status=0,location=0,scrollbars=1,resizable=1"; //無効
    let newwin = window.open('', "_blank", openWindowOption );
    if(newwin){
        let dataary=[];
        window.parent.fb_getRTDBdatas_promise("once",rtdbpath,function(snapshot){
            //const dbdata = snapshot.val(); これはソート順が崩れる
            snapshot.forEach((child) => {
                let data = child.val();
                data.key=child.key;
                dataary.push(child.val())
            });
        },null,{orderByKey:"",limitToLast:10}).then(function(snapshot){ // key は時間順
            
            dataary.reverse();
            
            // ---- build HTML Code ----
            newwin.name="myLogPage";
            let htmlTitle="アクセスログ";
            
            let bodyContent="";
            // ---------

            
            bodyContent+= "<br/>test<br/>"

            for(data of dataary){
                let strJst = window.parent.myDateTimeFormat(data.timestamp);
                bodyContent += strJst + " "+data.logmessage +"<br/>";
            }
            
            
            
            //-----------
            newwin.document.open();
            newwin.document.write( window.parent.buildHtmlpageSource(htmlTitle,bodyContent) );
            newwin.document.close();
            //-----------
            
        });
    }
}



function myLastAccessInfo(){
    let loginUser = window.parent.fb_getLoginUser();
    //let rtdbpath = window.parent.fb_createAryConnectionLogDatas_path(loginUser.uid);
    
    let openWindowOption="width=600,height=300";
    // openWindowOption +=",menubar=no,toolbar=no,status=no,location=no,scrollbars=yes,resizable=yes"; //無効
    let newwin = window.open('', "_blank", openWindowOption );
    if(newwin){
        //window.parent.fb_getRTDBdatas("once",rtdbpath,function(snapshot){
        //    const dbdata = snapshot.val();
        let ConnectionMembersList=window.parent.fb_getConnectionMembersList();
        if(ConnectionMembersList){
            
            const dbdata = ConnectionMembersList[loginUser.email];
            
            
            // ---- build HTML Code ----
            newwin.name="myRecentConnectionLog";
            let htmlTitle="NewOne";
            
            let bodyContent="";
            // ---------
            
            
            bodyContent+= "<br/>直近の接続記録<br/>"
            if(dbdata != null) {
                //Object.keys(dbdata).forEach((key,index,ary) => {
                let keyAry=["name","lasttimestamp","timestamp"];
                
                bodyContent += "<table border='1'>";
                for(let elem of keyAry){
                    const dbval=(elem in dbdata) ? dbdata[elem] : null;
                    let outputStr = "";
                    switch(elem){
                      case "name":
                          outputStr = "<td>ユーザー名</td><td colspan='2'>" + loginUser.email +"</td>";
                          outputStr+= "<td>"+window.parent.escapeHtml( (dbval?dbval:"") ,1)+"</td>";
                        break;
                      case "timestamp":
                         {let strJst = window.parent.myDateTimeFormat(dbval);
                          let dbval2  = ( ("logoff" in dbdata) ? dbdata["logoff"] : null );
                          let strJst2= window.parent.myDateTimeFormat(dbval2);
                          outputStr = '<td>現在の接続</td><td style="border-right: none;">' + strJst+'<br/>('+ (dbval?dbval:"") +')</td>';
                          outputStr+= '<td style="border-left: none; border-right: none;">～</td>';
                          outputStr+= '<td style="border-left: none;">'+strJst2 +'</td>';
                        break;}
                      case "lasttimestamp":
                         {let dbval2  = ( ("lastlogoff" in dbdata) ? dbdata["lastlogoff"] : null );
                          let strJst1= window.parent.myDateTimeFormat(dbval);
                          let strJst2= window.parent.myDateTimeFormat(dbval2);
                          outputStr = '<td>前回の接続</td>';
                          outputStr+= '<td style="border-right: none;">' + strJst1+'<br/>('+(dbval ?dbval :"")+')</td>';
                          outputStr+= '<td style="border-left: none; border-right: none;">～</td>';
                          outputStr+= '<td style="border-left: none;">' + strJst2+'<br/>  ('+(dbval2?dbval2:"")+')</td>';
                        break;}
                      default:
                          outputStr = '<td>'+elem+'</td><td colspan="2">' + (dbval?dbval:"") +'</td>';
                    }
                    
                    bodyContent += "<tr>" + outputStr+"</tr>";
                };
                bodyContent += "</table>";
            }
            
            bodyContent += loginUser.uid;
            
            
            //-----------
            newwin.document.open();
            newwin.document.write( window.parent.buildHtmlpageSource(htmlTitle,bodyContent) );
            newwin.document.close();
            //-----------
            
        }
    }
}

//***********

function mytest(){
    let loginUser = window.parent.fb_getLoginUser();
    let rtdbpath = window.parent.fb_createAryConnectionLogDatas_path(loginUser.uid);
    
    let openWindowOption="width=500,height=300";
    // openWindowOption +=",menubar=no,toolbar=no,status=no,location=no,scrollbars=yes,resizable=yes"; //無効
    let newwin = window.open('', "_blank", openWindowOption );
    if(newwin){
        window.parent.fb_getRTDBdatas("once",rtdbpath,function(snapshot){
            const dbdata = snapshot.val();
            
            
            // ---- build HTML Code ----
            newwin.name="myTestPage";
            let htmlTitle="てすと";
            
            let bodyContent="";
            // ---------
            
            bodyContent+= "<br/>test<br/>"
            
            
            bodyContent += "date型の判定："+Object.prototype.toString.call(new Date());
            
            //-----------
            newwin.document.open();
            newwin.document.write( window.parent.buildHtmlpageSource(htmlTitle,bodyContent) );
            newwin.document.close();
            //-----------
        });
    }
}

async function indexedDB_deleteAll(dbname="furutaniBBS",forceflg=false){
    let exeflg=true;
    if(!forceflg){
        let cntaryPromise = window.parent.indexedDB_countAll();
        let cntary = await cntaryPromise.catch(function(errmsg){alert(errmsg);return false;});
        if(!cntary){exeflg=false;}else{
            let ttl=0;
            for(let em of Object.keys(cntary)){
                ttl+=cntary[em];
            }
            let msg=`indexedデータベース[${dbname}]を削除します。\n宜しいですか？`;
            msg += `\n\n（現在、${Object.keys(cntary).length}件のストアに計${ttl}件のデータが保存されています）`;
            exeflg=confirm(msg)
        }
    }
    if(!exeflg){return;}
    //------------
    let DBDeleteRequest = window.indexedDB.deleteDatabase(dbname);
    DBDeleteRequest.onerror = function(event) {
      console.log(`[Error] indexedデータベース[${dbname}]の削除中にエラーが発生しました。`);
    };
    DBDeleteRequest.onsuccess = function(event) {
      console.log(`[Info] indexedデータベース[${dbname}]が正常に削除されました。`);
    };
}
function localstorage_deleteAll(forceflg=false){
    let exeflg=true;
    if(!forceflg){
        if(localStorage.length==0){
            exeflg=false;
            alert("localstorageにはデータが有りません。");
        }else{
            let msg="localstorageをクリアします。\n宜しいですか？";
            msg += `\n\n （現在、${localStorage.length}件のデータが保存されています）`;
            exeflg=confirm(msg);
        }
    }
    if(!exeflg){return;}
    //------------
    localStorage.clear();
}


//***********  Export ***************

