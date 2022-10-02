function buttonAuthCheck_Click(){  
    let loginUser = fb_getLoginUser();
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

//***********  Export ***************
window.buttonAuthCheck_Click = buttonAuthCheck_Click;
