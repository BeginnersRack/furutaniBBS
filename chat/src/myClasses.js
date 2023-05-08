// import { c_DataContainer } from "./myClasses.js"; で利用可能になる。
//	※クラス定義は巻き戻しは起こらないので、必ず最初に定義を済ませる事。
//クラス名は大文字で始めるのが慣例。



export let c_DataContainer = class {
    constructor() {    //コンストラクタ
        this.data = null;
        this.isCompressed =false;
        this.ttl=0;
        this.peers=null;
        this.datatype="";
    }
}




















/* サンプル =========================================
let c_DataContainer = class {
    //コンストラクタ
    constructor(z) {
        this.z = z   
    }
    //プロパティ
    get getZ() {
        return this.z
    }
    set setZ(z) {
        this.z = z
    }
    //メソッド
    calc() { 
        return this.x + this.y  // x と y を足した値を返却する 
    }
}
let taro = new c_DataContainer('Zの値');
alert(taro.z)  //  ゲッターなしでも値にはアクセス可能。
*/