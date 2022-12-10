
// -----------------------------------------
let myconsolelog;
(function(){
    if(!myconsolelog) if(window.fb_myconsolelog) myconsolelog=window.fb_myconsolelog;
    if(!myconsolelog) if(window.parent.fb_myconsolelog) myconsolelog=window.parent.fb_myconsolelog;
    
    if(!myconsolelog) myconsolelog=function(msg){console.log(msg);}
});



// -----------------------------------------
function createHtmlElement_button(strValue,strFunc,strPreElemIdName,flgPreElemPos=0,baseDocument=null){
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
