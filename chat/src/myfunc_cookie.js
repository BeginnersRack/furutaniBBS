
function getCookie(name){
    let strValue;
    const strCookiename = encodeURIComponent(name);
    
    let cookies = document.cookie.split(';');
    cookies.forEach(function(value) {
        let content = value.split('=');
        if((content[0].trim())==strCookiename){
            strValue = (content[1].trim());
        }
    });
    return strValue;
}
function setCookie(strName,strValue,expireDay =3){
    let adddata;
    
    adddata = encodeURIComponent(strName) + "=" + encodeURIComponent(strValue);
    
    let expireTime =0;
    expireTime = 60*60*24; //１日の秒数
    expireTime *= expireDay;
    adddata =adddata + ";max-age=" + (expireTime.toString());
    
    adddata =adddata + ";SameSite=Strict;Secure";
    
    document.cookie = adddata;

}


export { getCookie , setCookie };
