
//*********** my functions ****************

// ＜＜＜なんちゃってUUID生成＞＞＞
function myUuidCreate(){   // 00000000-0000-M000-N000-000000000000   Mの上位4bitとNの上位3bitは予約
    let strPartAry=[];
    strPartAry[0] = myRndStr(8);
    strPartAry[1] = myRndStr( 4);
    strPartAry[2] = myRndStr( 4,0x0FFF,0x4000); // 4bit=0100:Version4
    strPartAry[3] = myRndStr( 4,0x3FFF,0x8000); // 3bit=10? :RFC 4122
    strPartAry[4] = myRndStr(12);
    
    return  strPartAry.join("-");
}



function myRndStr(strLen , maskBit=~0 , addnum=0){
    let num = ( myRndBit( (strLen * 4) ) & maskBit )+addnum;
    return getHexaZeroPaddingStr(num,strLen);
}
function myRndBit(bitCount) {
    if (bitCount < 0 ) { return NaN; }
    
    if (bitCount <= 30) {  // 1回の処理で30bit長(0x40000000)を上限とする
        return Math.random() * (1 << (bitCount) ); 
    }else{
        return ( myRndBit(30) + (myRndBit(bitCount-30)*0x40000000) );
    } 
}
function getHexaZeroPaddingStr(orgnum,paddingSize){
    let ans = orgnum.toString(16);
    while(ans.length<paddingSize){
        ans="0"+ans;
    }
    return ans;
}

//***********  Export ***************

export {  myUuidCreate  };
