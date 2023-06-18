
// -----------------------------------------
let myconsolelog;
(function(){
    if(!myconsolelog) if(window.fb_myconsolelog) myconsolelog=window.fb_myconsolelog;
    if(!myconsolelog) if(window.parent.fb_myconsolelog) myconsolelog=window.parent.fb_myconsolelog;
    
    if(!myconsolelog) myconsolelog=function(msg){console.log(msg);}
});


// ===========================
export function myTypeof(obj){
    return Object.prototype.toString.call(obj);
}


//---- 配列整形 ----
//------ 引数１が文字列の場合は、改行、カンマ、ｾﾐｺﾛﾝで区切る
//------ 空白は削除、重複も削除する。
export function myAryNormalize(orgdata){
    let ansAry=[];
    
    let tgtAry0;
    if(Object.prototype.toString.call(orgdata)=="[object Array]"){
        tgtAry0=orgdata;
    }else if(typeof orgdata=="string"){
        tgtAry0 = orgdata.split(/\n|\r|,|;/);
    }
    if(!tgtAry0){ return ansAry; }
    
    //--正規化--
    for (const elem0 of tgtAry0) { 
        let elem=elem0.trim();
        if(elem){if(typeof elem=="string"){
            let notdup=1;
            for (const exst of ansAry) { if(exst==elem) notdup=0; }
            if(notdup){
                ansAry.push(elem);
            }
        }}
    }
    // ---
    return ansAry;
}
//---- 配列比較 ---- 一致すれば０を返す
//------ 引数１が引数２と一致しているかを検査する（重複や順序は無視）。
export function myAryCmp(orgary,cmpary){
    let ans=-1;
    //--一致チェック
    if(!orgary || Object.prototype.toString.call(orgary)!="[object Array]"){ return ans; }
    if(!cmpary || Object.prototype.toString.call(cmpary)!="[object Array]"){ return ans; }
    
    ans=1;
    if(orgary.length!=cmpary.length){ return ans; }
    
    ans=0;
    for (const elem of orgary) { 
        if(cmpary.indexOf(elem)<0){return 0;}
    }
    for (const elem of cmpary) { 
        if(orgary.indexOf(elem)<0){return 0;}
    }
    // ---
    return ans;
}



// -----------------------------------------
export function createHtmlElement_button(strValue,strFunc,strPreElemIdName,flgPreElemPos=0,baseDocument=null){
//strValue : ボタン名
//strFunc  : 実行JSコード
//strPreElemIdName: ボタン挿入位置の基準エレメントID
//flgPreElemPos   : 0:中の末尾  1:並びの末尾(parentNode指定)　　2:並びの次の位置
    //<input type="button" value="check" onclick="func_Click()">
    let new_element = document.createElement('input');
    
    let attrnode1 = document.createAttribute('type');
    attrnode1.value="button";
    new_element.setAttributeNode(attrnode1);
    let attrnode2 = document.createAttribute('value');
    attrnode2.value=strValue;
    new_element.setAttributeNode(attrnode2);
    let attrnode3 = document.createAttribute('onclick');
    attrnode3.value=strFunc;
    new_element.setAttributeNode(attrnode3);
    
    // add
    let tgtPreElem=null;
    if(strPreElemIdName){if(strPreElemIdName!=""){
        if(baseDocument){
            tgtPreElem = baseDocument.getElementById(strPreElemIdName);
        }
        if(!tgtPreElem){
            tgtPreElem = document.getElementById(strPreElemIdName);
        }
    }}
    if(!tgtPreElem){
        tgtPreElem = document.body;
    }
    switch(flgPreElemPos){
            case 2:
                tgtPreElem.after(new_element);
                break;
            case 1:
                tgtPreElem.parentNode.appendChild(new_element);
                break;
            default:
                tgtPreElem.appendChild(new_element);
    }
    
}
