// import { HtmlElements_comment,createHtmlElem_commentForEdit } from "./bbs_comment_m.js";

export const HtmlElements_comment={};
HtmlElements_comment.myNewDetailsTextareaId ="bbsComment_NewDetailsText";
HtmlElements_comment.myNewTitleTextId ="bbsComment_NewTitleText";

// ------------- コメントの更新登録画面 ---------------

export function createHtmlElem_commentForEdit(pageconfig){
    //--- 更新処理用HTMLを生成
        let dispContents="";
        
        const ttlary= (!pageconfig) ? "" : (!pageconfig.threadConfig) ? "" : pageconfig.threadConfig.post_titles;
        const ttl_defaultVal= (!pageconfig) ? "" : (!pageconfig.postData) ? "" : 
               (pageconfig.postData.titlecategory ? pageconfig.postData.titlecategory : "");
        
        //タイトル/区分 選択肢
        let dspTitleInput=-1;
        let defaultvalue=-1;
        let sel_defaultVal="";
        if((ttlary)&&(ttlary.length>0)){
            if(ttlary.length==1){
                if(ttlary[0]==""){
                    dspTitleInput=1;
                }
            }else{
                if(ttl_defaultVal!=""){
                    for(let i=0;i<ttlary.length;i++){
                        if(ttl_defaultVal == (ttlary[i]?ttlary[i]:"")){
                            defaultvalue=i;
                        }
                    }
                }
                if(defaultvalue<0){
                    for(let i=0;i<ttlary.length;i++){
                        if("" == (ttlary[i]?ttlary[i]:"")){
                            defaultvalue=i;
                        }
                    }
                }
                if(defaultvalue<0){defaultvalue=0;}
                
                let strscr = `let tgtelm=document.getElementById("`+HtmlElements_comment.myNewTitleTextId+`");`;
                strscr += `if(tgtelm){tgtelm.value=this.options[this.value].text;}`;
                
                dispContents+=`<select id="`+HtmlElements_comment.myNewTitleTextId+`_selector"`;
                dispContents+=` onchange='`+strscr+`'>`;
                for(let i=0;i<ttlary.length;i++){
                    let tgtopt = ttlary[i]?ttlary[i]:"";
                    dispContents+=`<option value="`+i.toString()+`"`;
                    if(tgtopt==""){
                        dspTitleInput=i;
                    }
                    if(i==defaultvalue){
                            dispContents+=` selected>`+tgtopt+`</option>`;
                            sel_defaultVal = tgtopt;
                    }else{
                            dispContents+=`>`+tgtopt+`</option>`;
                    }
                }
                dispContents+=`</select>`;
            }
        }
        
        //タイトル
        let text_defaultVal=ttl_defaultVal; // タイトル初期値
        if(dspTitleInput<0){if(sel_defaultVal!=""){
            if(text_defaultVal != sel_defaultVal ){
                window.parent.fb_myconsolelog("[Info] コメントの件名を自動変更します：["+text_defaultVal+"]→["+sel_defaultVal+"]");
                text_defaultVal = sel_defaultVal;
            }
        }}
        
        dispContents+=`<input type="text" id="`+HtmlElements_comment.myNewTitleTextId+`" name="name" minlength="4" maxlength="80" size="10"`;
        dispContents+=` value="`+text_defaultVal+`"`;
        if(dspTitleInput>=0){
                dispContents+=`>`;
        }else{
                dispContents+=` style="display:none;">`;
        }
        
        // コメント本文
        dispContents+=`<textarea id="`+HtmlElements_comment.myNewDetailsTextareaId+`" style="width:100%; height:80px;">`;
        dispContents+= ( (!pageconfig) ? "" : (!pageconfig.postData) ? "" :  pageconfig.postData.details ) +`</textarea>`;
        
    // ----
    return  dispContents;
}
