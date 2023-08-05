const HtmlElemId_displayAreaDiv = "displayArea";
const HtmlElemId_theWorldDiv="main_table-base-theWorld";
const HtmlElemId_MainTableDiv="app-main-table";
const HtmlElemId_MainTableImg = "main_table-backGroundImage";



let HtmlElement_TableTheWorld;
let HtmlElement_MainTable;
// -----------------------
const cameraPositionZ=1000;
const swTableRotateCenterFlg=0; // 1 で 画面中心回転, 2でテーブル中心回転
const debug_infolevel=5;
// -----------------------

let c_config={};  // userid
let TableImage_identifier;  // 現在、テーブルに表示している画像のidentifier


let thisWinId="";
window.addEventListener("load", function(event) {    func_iframeOnload();   });
function func_iframeOnload(){ // iframeの親から、onloadイベントで呼び出される
    thisWinId = window.name;
    if(thisWinId){
        requireWinMessageChannel(thisWinId);
    }
    
};
function myonload2(){  // windowMessageChannel開通後に呼び出される
    console.log("[info] got windowMessageChannel" );
    mypostWinMessageChannel( winMessageChannelPort ,"start");
    setTimeout(check_winParentOpen,5000);
    
    start_thisWindowTask();
    //setTimeout(start_thisWindowTask,10000)
}
async function check_winParentOpen(){
        if(!window.opener){  selfClose();return;  }
        if(window.opener.closed){ selfClose();return;  }
        
        const pingMsg = await getReplyWinMessage("ping","ping2","" ,3000,true);
        if(!pingMsg){ selfClose();return;  }
        
        setTimeout(check_winParentOpen,5000);
}
function selfClose(){
    if(debug_infolevel<100) window.close();
    console.log("[info] Closed!!" );
}





let winMessageChannelPort; // 親ウインドウへのポート
//  Windowメッセージのデータ形式：種別を示す文字列をキーにもつ連想配列
function winMessageChannelAction(event){
    if( (window.location.origin.substring(0,7)!="file://" && window.location.origin!="null" ) && 
        ( event.origin && ((event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin ))  ){   
        console.log("[Error] got illegal Message from : "+ event.target.myId +" : "+event.source );
    }else{
        if (!(event.data instanceof Object) || (event.data instanceof Array)){
            console.log("[Error] got not-regular Message from : "+ event.target.myId );
        }else{
            Object.keys(event.data).forEach(async (onekey) => {
                //console.log("[Info] got window-Message ["+onekey+"] from : "+ (event.source ? event.source.name : "??") );
                switch(onekey){
                  default:
                    console.log("[Error] got unknown Message ["+onekey+"] ");
                    break;
                  case "log":
                    console.log("[Info] got Message : "+ event.data[onekey] );
                    break;
                  case "ping":
                    mypostWinMessageChannel(winMessageChannelPort , "ping2" ,"");
                    //console.log("[Info] got Ping ["+event.data[onekey]+"] ");
                    break;
                  case "ping2":
                    //console.log("[Info] got Ping2 ["+event.data[onekey]+"] ");
                    break;
                  case "config":
                    console.log("[Info] got config ["+event.data[onekey]+"] ");
                    c_config = event.data[onekey];
                    break;
                  
                  case "tabletopObjectInfo":
                    //console.log("[Info] got "+onekey+" ["+event.data[onekey]+"] ");
                    if(event.data[onekey]){
                        const sender = event.data[onekey].from;
                        if(sender){
                            messageFunc_mousepointer(sender , event.data[onekey].data);
                            break;
                        }
                    }
                    console.log("[Error] got Error Message : "+event.data[onekey]+" ");
                    break;
                  
                  case "requestTableImageId":
                    setTableImage:{
                      mypostWinMessageChannel(winMessageChannelPort , "requestedTableImageId" ,TableImage_identifier);
                    }
                    break;
                  
                  case "setTableImage":
                    setTableImage:{
                      if(event.data[onekey]){
                        const sender = event.data[onekey].from;
                        if(sender){
                            messageFunc_setTableImage(sender , event.data[onekey].data);
                            break;
                        }
                      }
                    }
                    console.log("[Error] got Error Message : "+event.data[onekey]+" ");
                    break;
                    
                  case "requestImage":
                    const imageIdentifier = event.data[onekey];
                    const imgFileObj=ImageStorage.instance.get(imageIdentifier);
                    let sendData = {id:imageIdentifier};
                    //const blobPack = window.opener.msgpack_encode(imgFileObj.context.blob);
                    //if(blobPack){  sendData= {id:imageIdentifier,blob:blobPack,blob_length:blobPack.buffer.byteLength}; }
                    
                    let reader = new FileReader();
                    reader.readAsDataURL(imgFileObj.blob);
                    await new Promise(resolve => reader.onload = () => resolve());
                    const blobPack = (reader.result); // .replace(/data:.*\/.*;base64,/, '');
                    
                    //reader.readAsArrayBuffer(imgFileObj.blob);
                    //await new Promise(resolve => reader.onload = () => resolve());
                    //const blobPack = (reader.result);
                    //const blobPack_enc1 = window.opener.msgpack_encode(blobPack);
                    //const blobPack_enc2 = window.btoa(blobPack);
                    
                    if(1==1){ // 復元テスト
                        //const blobPack_test = window.opener.msgpack_decode(blobPack_enc1);
                        //const blob_test = new Blob(  [blobPack]  , {type: imgFileObj.blob.type});
                        //const blob_test2 = new Blob(  new Uint8Array([window.atob(blobPack_enc2)],0,blobPack.length)  , {type: imgFileObj.blob.type});
                        const blob_test = await fetch(blobPack).then(response => response.blob());
                        let i=1;
                        const hashId_test2 = await FileReaderUtil.calcSHA256Async(blob_test);
                        i=2;
                    }
                    
                    //if(blobPack){  sendData.blob=imgFileObj.blob;  sendData.blobBinAry=blobPack; sendData.blobtype=imgFileObj.blob.type;}
                    if(blobPack){ sendData.blobBase64=blobPack; // contain "type"
                                  sendData.blobName = imgFileObj.context.name;
                                  sendData.blobLatModified = imgFileObj.context.lastModified;
                                  sendData.blobLatModifiedDate = imgFileObj.context.lastModifiedDate;
                    }
                    
                    mypostWinMessageChannel(winMessageChannelPort , "requestedImage" ,sendData);
                    break;
                  
                  
                  case "requestedImage":  // {id:imageIdentifier,blob:imgFileObj.context.blob}; }  // function messageFunc_setTableImage()を参照
                  case "requestedTableImageId":
                }

                if(waitMessageChannelCallbackAry){ if(onekey in waitMessageChannelCallbackAry){if(typeof waitMessageChannelCallbackAry[onekey] =="function"){
                    //console.log("[Info] callback window-Message ["+onekey+"] " );
                    waitMessageChannelCallbackAry[onekey](event.data[onekey]);
                    waitMessageChannelCallbackAry[onekey]=null;
                }}}

            });
        }
    }
}

function mypostWinMessageChannel(tgtPort0,key,data=""){
    const sendmsg = {};
    sendmsg[key]=data;
    
    let tgtport=null;
    if(tgtPort0){if(tgtPort0.postMessage){
        tgtport = tgtPort0;
    }}
    
    if(tgtport){
        tgtport.postMessage( sendmsg );
    }else{
        console.log("[Error] no winMessage channel Port : "+ tgtPort0 );
    }
}
//----------- init MessageChannel --------
function requireWinMessageChannel(tgtid , deleteFlg=0){
    if(deleteFlg==0){
        window.addEventListener('message', WinMessageAction );
        mypostWinMessage(window.opener, tgtid ); // 親ウインドウにChannel-portを要求
        setTimeout(function(){getReplyWinMessageInit_suicide("get-ChannelPort");}, 3000);
    }else{
        window.removeEventListener('message', WinMessageAction );
    }
}
function getReplyWinMessageInit_suicide(msg){
    if(!winMessageChannelPort){
        if(msg){
            console.log("[Error] TimeOut.  getReplyWinMessageInit_suicide : "+ msg +" " );
        }
        selfClose();
    }
}
function WinMessageAction(event){
        if( (window.location.origin!="file://" && window.location.origin!="null" ) && 
            ((event.source && event.origin!=event.source.location.origin) || event.origin!=window.location.origin )){   
            console.log("[Error] got illegal Message from : "+ event.source.location.origin );
        }else{
            switch(event.data){
                default:
                    console.log("[Error] got unknown Message ["+onekey+"] from : "+ event.origin );
                    break;
                case "channel":
                    winMessageChannelPort = event.ports[0];
                    winMessageChannelPort.addEventListener("message", winMessageChannelAction );
                    winMessageChannelPort.start();
                    console.log("[Info] get Message-Channel-port from : "+ event.origin );
                    requireWinMessageChannel("",1); //リスナ削除
                    myonload2()
                  break;

            }
            
        }
}
function mypostWinMessage(tgtwin,data="",dataObj=""){
    let origin = window.location.origin;
    if(origin=="file://" || origin=="null") origin="*";
    
    if(tgtwin){if(tgtwin.postMessage){
        if(dataObj=="") { tgtwin.postMessage( data , origin );
        }else { tgtwin.postMessage( data , origin ,dataObj ); 
        }
    }}
}
// ------------------------------
let waitMessageChannelCallbackAry={}; // waitMessageCallbackAry
function getReplyWinMessage(key,returnkey,data="",waittime=5000 , suicideFlg=0){
    if(key){
        let flg=1;
        if(waitMessageChannelCallbackAry){ if(returnkey in waitMessageChannelCallbackAry){if(typeof waitMessageChannelCallbackAry[returnkey] =="function"){
            console.log("[Info] request MessageChannel : key="+ key +"("+returnkey+") is already required." );
            flg=0;
        }}}
        if(flg){
            return new Promise((resolve, reject) => {
                const timerId_suicide = setTimeout(function(){getReplyWinMessage_suicide(key,suicideFlg);}, waittime);
                //console.log("[Info] request Message : ["+ key +"] "+ timerId_suicide.toString() );
                waitMessageChannelCallbackAry[returnkey]=function(dt){
                    clearTimeout(timerId_suicide);
                    //console.log("[Info] got Message : ["+ key +"]>["+returnkey+"] resolve." );
                    resolve(dt);
                }
                mypostWinMessageChannel(winMessageChannelPort, key,data) // 親windowへ情報を要求
            });
        }
    }
}
function getReplyWinMessage_suicide(msg,suicideFlg=0){
    if(msg){
        console.log("[Warning] TimeOut.  getReplyWinMessage_suicide : "+ msg +" " );
    }
     //    if(confirm("windowMessageがTimeoutしました。閉じてください。\n"+msg)){
                if(suicideFlg) selfClose();
     //    }
}
// =========================================================================================



// ---- @udonarium@app directive/input-handler.ts
const MOUSE_IDENTIFIER = -9999;
//export interface PointerCoordinate {
//  x: number;
//  y: number;
//  z: number;
//}
//export interface PointerData extends PointerCoordinate {
//  identifier: number;
//}
//interface InputHandlerOption {
//  readonly capture?: boolean
//  readonly passive?: boolean
//  readonly always?: boolean
//}

class InputHandler {
  onStart ; // : (ev: MouseEvent | TouchEvent) => void;
  onMove ;  // : (ev: MouseEvent | TouchEvent) => void;
  onEnd ;   // : (ev: MouseEvent | TouchEvent)  => void;
  onContextMenu ; // : (ev: MouseEvent | TouchEvent)  => void;

  callbackOnMouse = this.onMouse.bind(this);
  callbackOnTouch = this.onTouch.bind(this);
  callbackOnMenu = this.onMenu.bind(this);

  lastPointers= []; // : PointerData[] 
  primaryPointer = { x: 0, y: 0, z: 0, identifier: MOUSE_IDENTIFIER } // : PointerData 
  get pointer(){ return this.primaryPointer; } //: PointerCoordinate 

  _isDragging = false;
  _isGrabbing = false;
  get isDragging() { return this._isDragging; }
  get isGrabbing() { return this._isGrabbing; }

  _isDestroyed = false;
  get isDestroyed() { return this._isDestroyed; }

  option = null;  // : InputHandlerOption
  target = null;

  constructor( targetElement, option={ capture: false, passive: false, always: false } ) { //option: InputHandlerOption
    this.option = {
      capture: (option.capture === true),
      passive: (option.passive === true),
      always: (option.always === true)
    };
    this.target = targetElement;
    this.initialize();
  }

  initialize() {
    this.target.addEventListener('mousedown', this.callbackOnMouse, this.option.capture);
    this.target.addEventListener('touchstart', this.callbackOnTouch, this.option.capture);
    if (this.option.always) this.addEventListeners();
  }

  destroy() {
    this.cancel();
    this._isDestroyed = true;
    this.target.removeEventListener('mousedown', this.callbackOnMouse, this.option.capture);
    this.target.removeEventListener('touchstart', this.callbackOnTouch, this.option.capture);
    this.removeEventListeners();
  }

  cancel() {
    this._isDragging = this._isGrabbing = false;
    if (!this.option.always) this.removeEventListeners();
  }

  onMouse(e) { // e: MouseEvent
    let mousePointer = { x: e.pageX, y: e.pageY, z: 0, identifier: MOUSE_IDENTIFIER };
    if (this.isSyntheticEvent(mousePointer)) return;
    this.lastPointers = [mousePointer];
    this.primaryPointer = mousePointer;

    this.onPointer(e);
  }

  onTouch(e) { // e: TouchEvent
    let length = e.changedTouches.length;
    if (length < 1) return;
    this.lastPointers = [];
    for (let i = 0; i < length; i++) {
      let touch = e.changedTouches[i];
      let touchPointer = { x: touch.pageX, y: touch.pageY, z: 0, identifier: touch.identifier };
      this.lastPointers.push(touchPointer);
    }

    if (e.type === 'touchstart') {
      this.primaryPointer = this.lastPointers[0];
    } else {
      let changedTouches = Array.from(e.changedTouches);
      let touch = changedTouches.find(touch => (touch.identifier === this.primaryPointer.identifier) );
      if (touch == null) {
        let isTouchContinues = Array.from(e.touches).find(touch => touch.identifier === this.primaryPointer.identifier) != null;
        if (!isTouchContinues) {
          // タッチを追跡できなくなったら終了
          if (this.onEnd) this.onEnd(e);
          this.cancel();
        }
        return;
      }
      let touchPointer = { x: touch.pageX, y: touch.pageY, z: 0, identifier: touch.identifier };
      this.primaryPointer = touchPointer;
    }

    this.onPointer(e);
  }

  onPointer(e) { // e: MouseEvent | TouchEvent
    switch (e.type) {
      case 'mousedown':
      case 'touchstart':
        this._isGrabbing = true;
        this._isDragging = false;
        this.addEventListeners();
        if (this.onStart) this.onStart(e);
        break;
      case 'mousemove':
      case 'touchmove':
        if (this.onMove) this.onMove(e);
        this._isDragging = this._isGrabbing;
        break;
      default:
        if (this.onEnd) this.onEnd(e);
        this.cancel();
        break;
    }
  }

  onMenu(e) {  // e: MouseEvent | TouchEvent
    if (this.onContextMenu) this.onContextMenu(e);
  }

  isSyntheticEvent(mousePointer, threshold= 15) {
    for (let pointer of this.lastPointers) {
      if (pointer.identifier === mousePointer.identifier) continue;
      let distance = (mousePointer.x - pointer.x) ** 2 + (mousePointer.y - pointer.y) ** 2;
      if (distance < threshold ** 2) {
        return true;
      }
    }
    return false;
  }

  addEventListeners() {
    let option = {  // option : AddEventListenerOptions
      capture: this.option.capture,
      passive: this.option.passive
    }
    this.target.ownerDocument.addEventListener('mousemove', this.callbackOnMouse, option);
    this.target.ownerDocument.addEventListener('mouseup', this.callbackOnMouse, option);
    this.target.ownerDocument.addEventListener('touchmove', this.callbackOnTouch, option);
    this.target.ownerDocument.addEventListener('touchend', this.callbackOnTouch, option);
    this.target.ownerDocument.addEventListener('touchcancel', this.callbackOnTouch, option);
    this.target.ownerDocument.addEventListener('contextmenu', this.callbackOnMenu, option);
    this.target.ownerDocument.addEventListener('drop', this.callbackOnMouse, option);
  }

  removeEventListeners() {
    let option = { // option: EventListenerOptions
      capture: this.option.capture
    }
    this.target.ownerDocument.removeEventListener('mousemove', this.callbackOnMouse, option);
    this.target.ownerDocument.removeEventListener('mouseup', this.callbackOnMouse, option);
    this.target.ownerDocument.removeEventListener('touchmove', this.callbackOnTouch, option);
    this.target.ownerDocument.removeEventListener('touchend', this.callbackOnTouch, option);
    this.target.ownerDocument.removeEventListener('touchcancel', this.callbackOnTouch, option);
    this.target.ownerDocument.removeEventListener('contextmenu', this.callbackOnMenu, option);
    this.target.ownerDocument.removeEventListener('drop', this.callbackOnMouse, option);
  }
}


// ----

// @udonarium@app\component\game-table\ table-mouse-gesture.ts
const TableMouseGestureEvent = { // 元は列挙型 enum TableMouseGestureEvent 
    DRAG : 'drag'
  , ZOOM : 'zoom'
  , ROTATE : 'rotate'
  , KEYBOARD : 'keyboard'
}
const KeyboardArrowCode = {
    ArrowLeft : 'ArrowLeft'
  , ArrowUp : 'ArrowUp'
  , ArrowRight : 'ArrowRight'
  , ArrowDown : 'ArrowDown'
}

class TableMouseGesture { 
  currentPositionX = 0;
  currentPositionY = 0;
  buttonCode = 0;
  input = null; // : InputHandler
  parent= null;   //  Takayama 追加   TableMouseGestureからGameTableComponentのプロパティを参照するため
  
  onstart = null; //: Callback
  onend = null; //: Callback
  ontransform = null; //: OnTransformCallback


  get isGrabbing() { return this.input.isGrabbing; }
  get isDragging() { return this.input.isDragging; }

  callbackOnWheel = (e) => this.onWheel(e);
  callbackOnKeydown = (e) => this.onKeydown(e);

  #rootElementRef=null;

  constructor(HTMLElement) {
    this.#rootElementRef = HTMLElement;
    this.initialize();
  }

  initialize() {
    this.input = new InputHandler(this.#rootElementRef, { capture: true });
    this.addEventListeners();
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);
  }

  cancel() {
    this.input.cancel();
  }

  destroy() {
    this.input.destroy();
    this.removeEventListeners();
  }

  onInputStart(ev) {
    this.currentPositionX = this.input.pointer.x;
    this.currentPositionY = this.input.pointer.y;
    this.buttonCode = ev.button;
    if (this.onstart) this.onstart(ev);
  }

  onInputEnd(ev) {
    if (this.onend) this.onend(ev);
  }

  onInputMove(ev) {
    let x = this.input.pointer.x;
    let y = this.input.pointer.y;
    let deltaX = x - this.currentPositionX;
    let deltaY = y - this.currentPositionY;

    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    let event = TableMouseGestureEvent.DRAG;

    if (this.buttonCode === 2) { // 右クリック:回転
        if(swTableRotateCenterFlg){  
            event = TableMouseGestureEvent.ROTATE;
            rotateZ = -deltaX / 5;
            rotateX = -deltaY / 5;
        }
      
      
      
    } else {                     // 左クリック
        
        const u=(cameraPositionZ+Math.abs(this.parent.viewPositionZ))/cameraPositionZ; // Z軸方向：地面との距離(cameraPositionZ)を基準
        
        switch(swTableRotateCenterFlg){  
          case 1:    // 画面中心回転時の補正処理
            
            
            transformX =deltaX*u;
            transformY =deltaY*u;
            transformZ = 0;

            let RotateXdeg = (this.parent.viewRotateX % 360); // reverse
            if (RotateXdeg<0){RotateXdeg+=360;}
            if ((RotateXdeg>90)&&(RotateXdeg<270)){
                transformY=-transformY;
            }

            // 画像移動量
            let dx = transformX;    //X軸方向移動
            let dy = transformY;    //Y軸方向移動
            let dz = transformZ;


            // 回転中心が画像中心からずれているための移動量補正をおこなう
            let ex,ey,ez , bp;
            bp=myMtrx( {x:dx,y:dy,z:dz} ,  0 ,0, this.parent.viewRotateZ ,1);
            ex=bp.x,ey=bp.y,ez=bp.z;
            
            // 回転中心位置を 画面移動量に合わせて修正する
            let zeropos,basepos;
            basepos = {x:ex,y:ey,z:ez,w:1};
            zeropos = {x:0,y:0,z:0,w:1};
            
            dx= basepos.x -zeropos.x;
            dy= basepos.y -zeropos.y;
            dz= basepos.z -zeropos.z;
            
            
            //結果に対する補正処理
            let sz = Math.sin(( this.parent.viewRotateZ )/180*Math.PI);
            let cz = Math.cos(( this.parent.viewRotateZ )/180*Math.PI);
            let ddx = dx*cz - dy*sz;
            let ddy = dx*sz + dy*cz;
            let ssx= Math.sin(( this.parent.viewRotateX )/180*Math.PI);
            ex=dx,ey=dy,ez=dz-ddy*ssx;
            
            transformX = ex;
            transformY = ey;
            transformZ = ez;
            break;
            
          default:     // 通常処理
              transformX = deltaX ;
              transformY = deltaY ;
            break;    
        }
    }

    this.currentPositionX = x;
    this.currentPositionY = y;

    if (this.ontransform) this.ontransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, event, ev);
  }

  onWheel(ev) {  // ev: WheelEvent
    let pixelDeltaY = 0;
    switch (ev.deltaMode) {
      case WheelEvent.DOM_DELTA_LINE:
        pixelDeltaY = ev.deltaY * 16;
        break;
      case WheelEvent.DOM_DELTA_PAGE:
        pixelDeltaY = ev.deltaY * window.innerHeight;
        break;
      default:
        pixelDeltaY = ev.deltaY;
        break;
    }

    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    transformZ = pixelDeltaY * -1.5;
    if (300 ** 2 < transformZ ** 2) transformZ = Math.min(Math.max(transformZ, -300), 300);

    if (this.ontransform) this.ontransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, TableMouseGestureEvent.ZOOM, ev);
  }

  onKeydown(ev) {  // ev: KeyboardEvent
    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    let key = this.getKeyName(ev);
    switch (key) {
      case KeyboardArrowCode.ArrowLeft:
        if (ev.shiftKey) {
          rotateZ = -2;
        } else {
          transformX = 10;
        }
        break;
      case KeyboardArrowCode.ArrowUp:
        if (ev.shiftKey) {
          rotateX = -2;
        } else if (ev.ctrlKey) {
          transformZ = 150;
        } else {
          transformY = 10;
        }
        break;
      case KeyboardArrowCode.ArrowRight:
        if (ev.shiftKey) {
          rotateZ = 2;
        } else {
          transformX = -10;
        }
        break;
      case KeyboardArrowCode.ArrowDown:
        if (ev.shiftKey) {
          rotateX = 2;
        } else if (ev.ctrlKey) {
          transformZ = -150;
        } else {
          transformY = -10;
        }
        break;
    }
    let isArrowKey = KeyboardArrowCode[key] != null;
    if (isArrowKey && this.ontransform)
        this.ontransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, TableMouseGestureEvent.KEYBOARD, ev);
  }

  getKeyName(keyboard) { // keyboard: KeyboardEvent
    if (keyboard.key) return keyboard.key;
    switch (keyboard.keyCode) {
      case 37: return KeyboardArrowCode.ArrowLeft;
      case 38: return KeyboardArrowCode.ArrowUp;
      case 39: return KeyboardArrowCode.ArrowRight;
      case 40: return KeyboardArrowCode.ArrowDown;
      default: return '';
    }
  }

  addEventListeners() {
    this.#rootElementRef.addEventListener('wheel', this.callbackOnWheel, false);
    document.body.addEventListener('keydown', this.callbackOnKeydown, false);
  }

  removeEventListeners() {
    this.#rootElementRef.removeEventListener('wheel', this.callbackOnWheel, false);
    document.body.removeEventListener('keydown', this.callbackOnKeydown, false);
  }
}


// =============================================
/**
* 行列演算する
* @param {number} x ,y ,z   ベクタ
* @param {MyMatrix} matrix  行列
* @return {MyAryNum} - 4値ベクタ
*/

//interface MyAryNum {  // {x:0,y:0,z:0,w:1}
//  [index: string]: number
//}
//interface MyMatrix {
//  m11:number; m21:number; m31:number; m41:number;
//  m12:number; m22:number; m32:number; m42:number;
//  m13:number; m23:number; m33:number; m43:number;
//  m14:number; m24:number; m34:number; m44:number;
//}
//interface MyVetcor3 {
//  x:number; y:number; z:number
//}
function myMtrxP(x,y,z,matrix){ // matrix:MyMatrix , 返値は MyAryNum型{x:0,y:0,z:0,w:1}
  let ret={x:0,y:0,z:0,w:1};
  let local = {x:0,y:0,z:0,w:1};
  local.x = x,local.y = y,local.z = z;
  
    ret.x = local.x * matrix.m11 + local.y * matrix.m21 + local.z * matrix.m31 + local.w * matrix.m41;
    ret.y = local.x * matrix.m12 + local.y * matrix.m22 + local.z * matrix.m32 + local.w * matrix.m42;
    ret.z = local.x * matrix.m13 + local.y * matrix.m23 + local.z * matrix.m33 + local.w * matrix.m43;
    ret.w = local.x * matrix.m14 + local.y * matrix.m24 + local.z * matrix.m34 + local.w * matrix.m44;
  
  return ret;
}
// =============================================
/**
* 回転行列演算する
* @param {MyVetcor3} orgpos   ベクタ
* @param {number} rx,ry,rz   回転角
* @return {MyAryNum} - 4値ベクタ
*/
function myMtrx(orgpos, rx, ry, rz, rr=0){ // orgpos:MyVetcor3 , 返値は MyAryNum型{x:0,y:0,z:0,w:1}
  let sx = Math.sin(rx/180*Math.PI);
  let cx = Math.cos(rx/180*Math.PI);
  let sy = Math.sin(ry/180*Math.PI);
  let cy = Math.cos(ry/180*Math.PI);
  let sz = Math.sin(rz/180*Math.PI);
  let cz = Math.cos(rz/180*Math.PI);
  
  let m11 = cy*cz;
  let m12 = sx*sy*cz - cx*sz;
  let m13 = cx*sy*cz + sx*sz;
  let m21 = cy*sz;
  let m22 = sx*sy*sz + cx*cz;
  let m23 = cx*sy*sz - sx*cz;
  let m31 = 0-sy;
  let m32 = sx*cy;
  let m33 = cx*cy;
  
  if(rr){
    let m00=0;
    m00=m12;m12=m21;m21=m00;
    m00=m13;m13=m31;m31=m00;
    m00=m23;m23=m32;m32=m00;
  }
  let ans={x:0,y:0,z:0,w:1};
  ans.x = m11*(orgpos.x) + m12*(orgpos.y) + m13*(orgpos.z);
  ans.y = m21*(orgpos.x) + m22*(orgpos.y) + m23*(orgpos.z);
  ans.z = m31*(orgpos.x) + m32*(orgpos.y) + m33*(orgpos.z);
  return ans;
}


// =============================================
const CSSNumber = {
  relation : function relation(value, relativeSize, defaultValue = 0) {
    if (typeof value === 'number') {
      return value;
    }
    else if (typeof value === 'string') {
      value = (value).trim().toLowerCase();
      if (value.indexOf('%') > 0) return (parse(value.replace('%', ''), defaultValue) / 100) * relativeSize;
      else if (value.indexOf('px') > 0 || value.indexOf('pt') > 0) return CSSNumber.parse(value.replace('px', ''), defaultValue);
      else if (value.indexOf('vw') > 0) return (parse(value.replace('vw', ''), defaultValue) / 100) * window.innerWidth;
      else if (value.indexOf('vh') > 0) return (parse(value.replace('vh', ''), defaultValue) / 100) * window.innerHeight;
      else if (value.indexOf('vm') > 0) return (parse(value.replace('vm', ''), defaultValue) / 100) * Math.min(window.innerWidth, window.innerHeight);
      else if (value.indexOf('em') > 0) return parse(value.replace('em', ''), defaultValue);
      else if (value === 'top' || value === 'left') return 0;
      else if (value === 'center' || value === 'middle') return relativeSize * 0.5;
      else if (value === 'bottom' || value === 'right') return relativeSize;
      return defaultValue;
    }
    return defaultValue;
  }

  ,parse : function parse(value, defaultValue = 0) {
    value = parseFloat(value);
    if (isNaN(value)) return defaultValue;
    return value;
  }
}


class Matrix3D {
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;

  constructor() {
  }

  static create(element, style = null, ret = new Matrix3D()) {
    if (element && element.ownerDocument)
      return ret.setCSS((style || window.getComputedStyle(element)).transform);
    return ret.identity();
  }

  setData(data) {  // data: number[]
    if (data == null)
      return;

    let l = data.length;
    if (l == 16) {
      this.m11 = data[0];
      this.m12 = data[1];
      this.m13 = data[2];
      this.m14 = data[3];
      this.m21 = data[4];
      this.m22 = data[5];
      this.m23 = data[6];
      this.m24 = data[7];
      this.m31 = data[8];
      this.m32 = data[9];
      this.m33 = data[10];
      this.m34 = data[11];
      this.m41 = data[12];
      this.m42 = data[13];
      this.m43 = data[14];
      this.m44 = data[15];
    } else if (l == 6) {
      this.m11 = data[0];
      this.m12 = data[1];
      this.m13 = 0;
      this.m14 = 0;
      this.m21 = data[2];
      this.m22 = data[3];
      this.m23 = 0;
      this.m24 = 0;
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = data[4];
      this.m42 = data[5];
      this.m43 = 0;
      this.m44 = 1;
    } else if (l == 9) {
      this.m11 = data[0];
      this.m12 = data[1];
      this.m13 = 0;
      this.m14 = data[2];
      this.m21 = data[3];
      this.m22 = data[4];
      this.m23 = 0;
      this.m24 = data[5];
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = data[6];
      this.m42 = data[7];
      this.m43 = 0;
      this.m44 = data[8];
    }

    return this;
  }

  identity() {
    this.m11 = 1;
    this.m12 = 0;
    this.m13 = 0;
    this.m14 = 0;
    this.m21 = 0;
    this.m22 = 1;
    this.m23 = 0;
    this.m24 = 0;
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m41 = 0;
    this.m42 = 0;
    this.m43 = 0;
    this.m44 = 1;
    return this;
  }

  scalar(scalar) {
    this.m11 *= scalar;
    this.m12 *= scalar;
    this.m13 *= scalar;
    this.m14 *= scalar;
    this.m21 *= scalar;
    this.m22 *= scalar;
    this.m23 *= scalar;
    this.m24 *= scalar;
    this.m31 *= scalar;
    this.m32 *= scalar;
    this.m33 *= scalar;
    this.m34 *= scalar;
    this.m41 *= scalar;
    this.m42 *= scalar;
    this.m43 *= scalar;
    this.m44 *= scalar;

    return this;
  }

  //based on http://code.metager.de/source/xref/mozilla/B2G/gecko/gfx/thebes/gfx3DMatrix.cpp#651
  unproject(point, ret = { x: 0, y: 0, z: 0, w: 1 }) {
    let x = point.x * this.m11 + point.y * this.m21 + this.m41;
    let y = point.x * this.m12 + point.y * this.m22 + this.m42;
    let z = point.x * this.m13 + point.y * this.m23 + this.m43;
    let w = point.x * this.m14 + point.y * this.m24 + this.m44;

    let qx = x + this.m31;
    let qy = y + this.m32;
    let qz = z + this.m33;
    let qw = w + this.m34;

    if (w == 0) w = 0.0001;
    x /= w;
    y /= w;
    z /= w;

    if (qw == 0) qw = 0.0001;
    qx /= qw;
    qy /= qw;
    qz /= qw;

    let wz = qz - z;
    if (wz == 0) {
      ret.x = x;
      ret.y = y;
      ret.z = z;
      ret.w = z;
      return ret;
    }

    let t = -z / wz;
    x += t * (qx - x);
    y += t * (qy - y);

    ret.x = x;
    ret.y = y;
    ret.z = z;
    ret.w = z;
    return ret;
  }

  project(point, ret = { x: 0, y: 0, z: 0, w: 1 }) {
    let z = point.z;
    let w = point.x * this.m14 + point.y * this.m24 + z * this.m34 + this.m44;
    let x = point.x * this.m11 + point.y * this.m21 + z * this.m31 + this.m41;
    let y = point.x * this.m12 + point.y * this.m22 + z * this.m32 + this.m42;

    if (w == 0) w = 0.0001;

    x /= w;
    y /= w;

    if (w < 0) {
      x -= this.m41;
      y -= this.m42;
      x *= 1 / w;
      y *= 1 / w;
      x += this.m41;
      y += this.m42;
    }

    ret.x = x;
    ret.y = y;
    ret.z = z;
    ret.w = z;
    return ret;
  }

  append(b) {
    return Matrix3D.multiply(this, b, this);
  }

  setPosition(position) {
    this.m41 = position.x;
    this.m42 = position.y;
    this.m43 = position.z;
    return this;
  }

  getPosition(ret = { x: 0, y: 0, z: 0, w: 1 }) {
    ret.x = this.m41;
    ret.y = this.m42;
    ret.z = this.m43;
    return ret;
  }
  static makePosition(position, ret = new Matrix3D()) {
    ret.identity();
    ret.setPosition(position);
    return ret;
  }


  appendPosition(...args) {
    let position;
    if (args.length === 1) {
      position = args[0];
    } else {
      position = { x: args[0], y: args[1], z: args[2], w: 1 };
    }
    return this.append(Matrix3D.makePosition(position, Matrix3D.MATRIX3D));
  }

  static makePerspective(perspective, ret = new Matrix3D()) {
    ret.identity();
    ret.m34 = perspective ? -(1 / perspective) : 0;
    return ret;
  }

  appendPerspective(perspective) {
    if (!perspective)
      return this;
    return this.append(Matrix3D.makePerspective(perspective, Matrix3D.MATRIX3D));
  }

  /**
  * Inverts the matrix.
  * -> based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
  * -> based on https://github.com/mrdoob/three.js/blob/master/src/math/Matrix4.js
  */
  invert(target) {
    target = target || this;
    let data = []; // : number[]

    let n11 = this.m11, n12 = this.m12, n13 = this.m13, n14 = this.m14;
    let n21 = this.m21, n22 = this.m22, n23 = this.m23, n24 = this.m24;
    let n31 = this.m31, n32 = this.m32, n33 = this.m33, n34 = this.m34;
    let n41 = this.m41, n42 = this.m42, n43 = this.m43, n44 = this.m44;

    data[0] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    data[1] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    data[2] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    data[3] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    let det = n11 * data[0] + n21 * data[1] + n31 * data[2] + n41 * data[3];
    if (det == 0) {
      console.warn('Can not invert matrix, determinant is 0');
      return this;
    }

    data[4] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
    data[5] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
    data[6] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
    data[7] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
    data[8] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
    data[9] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
    data[10] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
    data[11] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
    data[12] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
    data[13] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
    data[14] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
    data[15] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

    target.setData(data);
    target.scalar(1 / det);
    return target;
  }

  setCSS(cssString) {
    if (!cssString || cssString == 'none') return this.identity();
    let trans = cssString.replace('matrix3d(', '').replace('matrix(', '').replace(')', '').split(',');
    let l = trans.length;
    for (let i = 0; i < l; ++i) {
      trans[i] = CSSNumber.parse(trans[i]);
    }
    return this.setData(trans);
  }

  appendCSS(cssString, force2D = false) {
    if (!cssString || cssString == 'none') return this;
    if (force2D && cssString.indexOf('matrix3d') >= 0) {
      return this.append(Matrix3D.MATRIX3D.setCSS(cssString).flatten());
    }
    return this.append(Matrix3D.MATRIX3D.setCSS(cssString));
  }

  flatten() {
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m44 = 1;
    this.m14 = 0;
    this.m24 = 0;
    this.m43 = 0;
    return this;
  }

  static multiply(a, b, ret = new Matrix3D()) {
    let m11 = a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31 + a.m14 * b.m41;
    let m12 = a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32 + a.m14 * b.m42;
    let m13 = a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33 + a.m14 * b.m43;
    let m14 = a.m11 * b.m14 + a.m12 * b.m24 + a.m13 * b.m34 + a.m14 * b.m44;
    let m21 = a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31 + a.m24 * b.m41;
    let m22 = a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32 + a.m24 * b.m42;
    let m23 = a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33 + a.m24 * b.m43;
    let m24 = a.m21 * b.m14 + a.m22 * b.m24 + a.m23 * b.m34 + a.m24 * b.m44;
    let m31 = a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31 + a.m34 * b.m41;
    let m32 = a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32 + a.m34 * b.m42;
    let m33 = a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33 + a.m34 * b.m43;
    let m34 = a.m31 * b.m14 + a.m32 * b.m24 + a.m33 * b.m34 + a.m34 * b.m44;
    let m41 = a.m41 * b.m11 + a.m42 * b.m21 + a.m43 * b.m31 + a.m44 * b.m41;
    let m42 = a.m41 * b.m12 + a.m42 * b.m22 + a.m43 * b.m32 + a.m44 * b.m42;
    let m43 = a.m41 * b.m13 + a.m42 * b.m23 + a.m43 * b.m33 + a.m44 * b.m43;
    let m44 = a.m41 * b.m14 + a.m42 * b.m24 + a.m43 * b.m34 + a.m44 * b.m44;

    ret.m11 = m11;
    ret.m12 = m12;
    ret.m13 = m13;
    ret.m14 = m14;
    ret.m21 = m21;
    ret.m22 = m22;
    ret.m23 = m23;
    ret.m24 = m24;
    ret.m31 = m31;
    ret.m32 = m32;
    ret.m33 = m33;
    ret.m34 = m34;
    ret.m41 = m41;
    ret.m42 = m42;
    ret.m43 = m43;
    ret.m44 = m44;

    return ret;
  }

  toString(fractionalDigits = 3) {
    return "m11=" + this.m11.toFixed(fractionalDigits)
      + "\tm21=" + this.m21.toFixed(fractionalDigits)
      + "\tm31=" + this.m31.toFixed(fractionalDigits)
      + "\tm41=" + this.m41.toFixed(fractionalDigits)
      + "\nm12=" + this.m12.toFixed(fractionalDigits)
      + "\tm22=" + this.m22.toFixed(fractionalDigits)
      + "\tm32=" + this.m32.toFixed(fractionalDigits)
      + "\tm42=" + this.m42.toFixed(fractionalDigits)
      + "\nm13=" + this.m13.toFixed(fractionalDigits)
      + "\tm23=" + this.m23.toFixed(fractionalDigits)
      + "\tm33=" + this.m33.toFixed(fractionalDigits)
      + "\tm43=" + this.m43.toFixed(fractionalDigits)
      + "\nm14=" + this.m14.toFixed(fractionalDigits)
      + "\tm24=" + this.m24.toFixed(fractionalDigits)
      + "\tm34=" + this.m34.toFixed(fractionalDigits)
      + "\tm44=" + this.m44.toFixed(fractionalDigits);
  }
  
  static MATRIX3D = new Matrix3D();
}





//  @ app\class\transform \ transform.ts
class classTransform {
  #element;
  #matrix = new Matrix3D();
  #sceneTransform = new Matrix3D();
  #inverseSceneTransform = new Matrix3D();

  #paddingLeft;
  #paddingTop;
  #marginLeft;
  #marginTop;
  #borderLeft;
  #borderTop;

  constructor(element) {
    this.initialize(element);
  }

  clear(){
    this.#element = null;
    this.#matrix.identity();

    return this;  // : classTransform 
  }

  initialize(element) {
    if (!element) return;

    this.#element = element;

    let style = window.getComputedStyle(element);

    let parentWidth = 0;
    let parentHeight = 0;
    if (this.#element.parentElement) {
      parentWidth = this.#element.parentElement.clientWidth;
      parentHeight = this.#element.parentElement.clientHeight;
    } else {
      parentWidth = window.innerWidth;
      parentHeight = window.innerHeight;
    }
    this.#paddingLeft = CSSNumber.relation(style.paddingTop, parentWidth);
    this.#paddingTop = CSSNumber.relation(style.paddingTop, parentHeight);
    this.#marginLeft = CSSNumber.relation(style.marginLeft, parentWidth);
    this.#marginTop = CSSNumber.relation(style.marginTop, parentHeight);
    this.#borderLeft = CSSNumber.relation(style.borderLeft, parentWidth);
    this.#borderTop = CSSNumber.relation(style.borderTop, parentHeight);

    this.#matrix.setCSS(style.transform);
    this.#sceneTransform.identity();
    this.extract(this, this.#sceneTransform);
    this.#sceneTransform.invert(this.#inverseSceneTransform);

    return this;
  }

  globalToLocal(x, y, z = 0) {
    let ret = { x: x, y: y, z: z, w: 1 };
    this.#inverseSceneTransform.unproject(ret, ret);
    this.fromBorderBox(ret);
    return ret;  // : IPoint3D
  }

  localToGlobal(x, y, z= 0) {
    let ret = { x: x, y: y, z: z, w: 1 };
    this.#sceneTransform.project(ret, ret);
    this.fromBorderBox(ret);
    return ret;
  }

  takayamaProject(x, y, z= 0) {    //  20230719 takayama追加
    let ret = { x: x, y: y, z: z, w: 1 };
    this.#sceneTransform.project(ret, ret);
    return ret;
  }
  takayamaUnproject(x, y, z= 0) {    //  20230719 takayama追加
    let ret = { x: x, y: y, z: z, w: 1 };
    this.#sceneTransform.unproject(ret, ret);
    return ret;
  }


  localToLocal(x, y, z, to) {
    let local = { x: x, y: y, z: z, w: 1 };
    let transformer = new classTransform(to);
    let matrix = Matrix3D.multiply(this.#sceneTransform, transformer.#inverseSceneTransform);
    let ret = { x: 0, y: 0, z: 0, w: 1 };  // : IPoint3D

    ret.x = local.x * matrix.m11 + local.y * matrix.m21 + local.z * matrix.m31 + local.w * matrix.m41;
    ret.y = local.x * matrix.m12 + local.y * matrix.m22 + local.z * matrix.m32 + local.w * matrix.m42;
    ret.z = local.x * matrix.m13 + local.y * matrix.m23 + local.z * matrix.m33 + local.w * matrix.m43;
    ret.w = local.x * matrix.m14 + local.y * matrix.m24 + local.z * matrix.m34 + local.w * matrix.m44;

    transformer.clear();
    this.toBorderBox(ret);
    return ret;
  }

  extract(transform, matrix) {
    let element = transform.element;
    let node = element;

    while (node) {
      this.extractMatrix(node, matrix);
      if (node && node.style.position === 'fixed') {
        console.warn('fixed領域は計算が不正確');
        matrix.appendPosition(window.pageXOffset, window.pageYOffset, 0);
      }
      node = node.parentElement;
    }
  }

  extractMatrix(node, matrix = null) {
    if (!matrix)
      matrix = new Matrix3D();
    if (!node)
      return matrix;

    let element = node;
    let style = window.getComputedStyle(node);  // style: CSSStyleDeclaration

    if (style.transform != 'none') {
      let origin = style.transformOrigin ? style.transformOrigin.split(' ') : [];
      let originX = CSSNumber.relation(origin[0], element.offsetWidth, element.offsetWidth * 0.5);
      let originY = CSSNumber.relation(origin[1], element.offsetHeight, element.offsetHeight * 0.5);
      let originZ = CSSNumber.relation(origin[2], 0, 0);

      matrix.appendPosition(-originX, -originY, -originZ);
      matrix.appendCSS(style.transform);
      matrix.appendPosition(originX, originY, originZ);
    }

    let position = this.getPosition(node);
    matrix.appendPosition(position.x, position.y, 0);

    let perspective = 0;
    if (node.parentElement) {
      let parentStyle = window.getComputedStyle(node.parentElement);
      perspective = CSSNumber.parse(parentStyle.perspective);
    }

    if (node.parentElement && perspective) {
      let parentStyle = window.getComputedStyle(node.parentElement);
      let perspectiveOrigin = parentStyle.perspectiveOrigin.split(' ');
      let perspectiveOriginX = CSSNumber.relation(perspectiveOrigin[0], element.parentElement.offsetWidth);
      let perspectiveOriginY = CSSNumber.relation(perspectiveOrigin[1], element.parentElement.offsetHeight);

      matrix.appendPosition(-perspectiveOriginX, -perspectiveOriginY, 0);
      matrix.appendPerspective(perspective);
      matrix.appendPosition(perspectiveOriginX, perspectiveOriginY, 0);
    }

    return matrix;
  }

  getPosition(node) {
    let ret = { x: 0, y: 0 };
    ret.x = !node.offsetParent ? node.offsetLeft : node.parentElement === node.offsetParent ? node.offsetLeft : node.parentElement.offsetParent === node.offsetParent ? node.offsetLeft - node.parentElement.offsetLeft : 0;
    ret.y = !node.offsetParent ? node.offsetTop : node.parentElement === node.offsetParent ? node.offsetTop : node.parentElement.offsetParent === node.offsetParent ? node.offsetTop - node.parentElement.offsetTop : 0;

    ret.x += node.offsetParent ? node.offsetParent.clientLeft : 0;
    ret.y += node.offsetParent ? node.offsetParent.clientTop : 0;
    return ret;
  }

  fromBorderBox(point){
    point.x += this.#paddingLeft;
    point.y += this.#paddingTop;
    point.x -= this.#marginLeft;
    point.y -= this.#marginTop;
    point.x -= this.#borderLeft;
    point.y -= this.#borderTop;
  }

  toBorderBox(point){
    point.x -= this.#paddingLeft;
    point.y -= this.#paddingTop;
    point.x += this.#marginLeft;
    point.y += this.#marginTop;
    point.x += this.#borderLeft;
    point.y += this.#borderTop;
  }
}












//export interface PointerCoordinate {
//  x: number;
//  y: number;
//  z: number;
//}

// @ \src\app\service \ coordinate.service.ts
class CoordinateService {
  tabletopOriginElement = document.body;

  constructor(
    pointerDeviceService
  ) { }  // pointerDeviceService: PointerDeviceService

  convertToLocal(pointer, element = document.body){  //  pointer: PointerCoordinate
    let transformer = new classTransform(element);
    let ray = transformer.globalToLocal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }

  convertToGlobal(pointer, element = document.body) {
    let transformer = new classTransform(element);
    let ray = transformer.localToGlobal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }

  convertProject(pointer, element = document.body , revflg=false) {     //  20230719 takayama追加
    let transformer = new classTransform(element);
    let ray
    if(revflg){
      ray = transformer.takayamaUnproject(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    }else{
      ray = transformer.takayamaProject(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    }
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }

  convertLocalToLocal(pointer, from, to) {
    let transformer = new classTransform(from);
    let local = transformer.globalToLocal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    let ray = transformer.localToLocal(local.x, local.y, 0, to);
    transformer.clear();
    return { x: ray.x, y: ray.y, z: ray.z };
  }

  calcTabletopLocalCoordinate(
    coordinate = { x: this.pointerDeviceService.pointers[0].x, y: this.pointerDeviceService.pointers[0].y, z: 0 },
    target = this.pointerDeviceService.targetElement
  ) {
    if (target.contains(this.tabletopOriginElement)) {
      coordinate = this.convertToLocal(coordinate, this.tabletopOriginElement);
      coordinate.z = 0;
    } else {
      coordinate = this.convertLocalToLocal(coordinate, target, this.tabletopOriginElement);
    }
    return { x: coordinate.x, y: coordinate.y, z: 0 < coordinate.z ? coordinate.z : 0 };
  }
}





// @udonarium@app\service\ pointer-device.service.ts
class PointerDeviceService {
  callbackOnPointerDown = (e) => this.onPointerDown(e);
  callbackOnPointerMove = (e) => this.onPointerMove(e);
  callbackOnPointerUp = (e) => this.onPointerUp(e);
  callbackOnContextMenu = (e) => this.onContextMenu(e);

  _isAllowedToOpenContextMenu = false;
  get isAllowedToOpenContextMenu(){ return this._isAllowedToOpenContextMenu; }

  targetElement; //: HTMLElement

  pointers = [{ x: 0, y: 0, z: 0, identifier: -1 }];     //  : PointerData[]
  startPostion= this.pointers[0];
  primaryPointer= this.pointers[0];
  
  get pointer(){ return this.primaryPointer; } // : PointerCoordinate 
  get pointerX(){ return this.primaryPointer.x; }
  get pointerY(){ return this.primaryPointer.y; }

  _isDragging = false; // todo
  get isDragging() { return this._isDragging; }
  set isDragging(isDragging) {
    if (isDragging === this._isDragging) return;
    //this.ngZone.run(() => this._isDragging = isDragging); //Angularでの更新処理（変更検知）
    
  }

  constructor(ngZone) { }

  initialize() {
    this.addEventListeners();
  }

  destroy() {
    this.removeEventListeners();
  }

  onPointerDown(e) {
    this.onPointerMove(e);
    this._isAllowedToOpenContextMenu = true;
    this.startPostion = this.pointers[0];
  }

  onPointerMove(e) {
    if (e.touches) {
      this.onTouchMove(e);
    } else {
      this.onMouseMove(e);
    }
    this.targetElement = e.target;
  }

  onPointerUp(e) {
    this.onPointerMove(e);
  }

  onMouseMove(e) {
    let mousePointer = { x: e.pageX, y: e.pageY, z: 0, identifier: MOUSE_IDENTIFIER };
    if (this.isSyntheticEvent(mousePointer)) return;  // 移動量が小さいうちは無視する
    if (this._isAllowedToOpenContextMenu) this.preventContextMenuIfNeeded(mousePointer);
    this.pointers = [mousePointer];
    this.primaryPointer = mousePointer;
  }

  onTouchMove(e) {
    let length = e.touches.length;
    if (length < 1) return;
    this.pointers = [];
    for (let i = 0; i < length; i++) {
      let touch = e.touches[i];
      let touchPointer = { x: touch.pageX, y: touch.pageY, z: 0, identifier: touch.identifier };
      if (this._isAllowedToOpenContextMenu) this.preventContextMenuIfNeeded(touchPointer);
      this.pointers.push(touchPointer);
    }
    this.primaryPointer = this.pointers[0];
  }

  onContextMenu(e) {
    this._isAllowedToOpenContextMenu = true;
    this.onPointerUp(e);
  }

  preventContextMenuIfNeeded(pointer, threshold = 3) {  // pointer: PointerCoordinate
    let distance = (pointer.x - this.startPostion.x) ** 2 + (pointer.y - this.startPostion.y) ** 2;
    if (threshold ** 2 < distance) this._isAllowedToOpenContextMenu = false;
  }

  isSyntheticEvent(mosuePointer, threshold = 15) {
    for (let pointer of this.pointers) {
      if (pointer.identifier === mosuePointer.identifier) continue;
      let distance = (mosuePointer.x - pointer.x) ** 2 + (mosuePointer.y - pointer.y) ** 2;
      if (distance < threshold ** 2) return true;
    }
    return false;
  }

  addEventListeners() {
    this.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('mousedown', this.callbackOnPointerDown, true);
      document.body.addEventListener('mousemove', this.callbackOnPointerMove, true);
      document.body.addEventListener('mouseup', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchstart', this.callbackOnPointerDown, true);
      document.body.addEventListener('touchmove', this.callbackOnPointerMove, true);
      document.body.addEventListener('touchend', this.callbackOnPointerUp, true);
      document.body.addEventListener('touchcancel', this.callbackOnPointerUp, true);
      document.body.addEventListener('drop', this.callbackOnPointerUp, true);
      document.body.addEventListener('contextmenu', this.callbackOnContextMenu, true);
    });
  }

  removeEventListeners() {
    document.body.removeEventListener('mousedown', this.callbackOnPointerDown, true);
    document.body.removeEventListener('mousemove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('mouseup', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchstart', this.callbackOnPointerDown, true);
    document.body.removeEventListener('touchmove', this.callbackOnPointerMove, true);
    document.body.removeEventListener('touchend', this.callbackOnPointerUp, true);
    document.body.removeEventListener('touchcancel', this.callbackOnPointerUp, true);
    document.body.removeEventListener('drop', this.callbackOnPointerUp, true);
    document.body.removeEventListener('contextmenu', this.callbackOnContextMenu, true);
  }
}


//  @udonarium@app\component\game-table\ game-table.component.ts内   [class GameTableComponent]より改造
class WorldTableComponent {
  viewPositionX= 100;
  viewPositionY= 0; 
  viewPositionZ= 0;
  viewRotateX  = 50;
  viewRotateY  = 0; 
  viewRotateZ  = 10; 
  mouseGesture;
  #isTableTransformMode = false;
  #isTableTransformed = false;
  
  pointerDeviceService;  // @udonarium@app\service\ pointer-device.service.ts
  contextMenuService={}; //dummy
  tableSelecter={}; //dummy
  
  #rootElementRef=null;
  
  constructor(tgtElem){
    this.#rootElementRef = tgtElem;
  }
  initializeTableMouseGesture() {
    this.mouseGesture = new TableMouseGesture(document.body); // this.#rootElementRef または document.body
    this.mouseGesture.onstart = this.onTableMouseStart.bind(this);
    this.mouseGesture.onend = this.onTableMouseEnd.bind(this);
    this.mouseGesture.ontransform = this.onTableMouseTransform.bind(this);
    this.mouseGesture.parent = this;
    
    this.pointerDeviceService = new PointerDeviceService;
  }
  
  onTableMouseStart(e) {      //   this.gameObjects.nativeElement >>> this.#rootElementRef
    if (e.target.contains(this.#rootElementRef) || e.button === 1 || e.button === 2) {
      this.#isTableTransformMode = true;
    } else {
      this.#isTableTransformMode = false;
      this.pointerDeviceService.isDragging = true;
      // this.gridCanvas.nativeElement.style.opacity = 1.0 + '';
    }

    if (!document.activeElement.contains(e.target)) {
      this.removeSelectionRanges();
      this.removeFocus();
    }
  }
  onTableMouseEnd(e) {
    this.cancelInput();
  }
  onTableMouseTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, event, srcEvent) {
    if (!this.isTableTransformMode || document.body !== document.activeElement) return;

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu && this.contextMenuService.isShow) {
        // this.ngZone.run(() => this.contextMenuService.close());
    }

    if (srcEvent.cancelable) srcEvent.preventDefault();  

    //
    //let scale = (cameraPositionZ + Math.abs(this.viewPositionZ)) / cameraPositionZ;
    let scale = Math.abs(cameraPositionZ - this.viewPositionZ) / cameraPositionZ;  // 20230615修正
    transformX *= scale;
    transformY *= scale;

    this.setTransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ);
    this.isTableTransformed = true;
  }
  cancelInput() {
    this.mouseGesture.cancel();
    this.isTableTransformMode = true;
    this.pointerDeviceService.isDragging = false;
    let opacity = this.tableSelecter.gridShow ? 1.0 : 0.0;
    //this.gridCanvas.nativeElement.style.opacity = opacity + '';
  }







  // ----
  setTransform(transformX, transformY, transformZ, rotateX=0, rotateY=0, rotateZ=0) {
    
    if((this.viewPositionZ+transformZ)>=cameraPositionZ) return; //takayama test
    
    if(swTableRotateCenterFlg){
      this.viewRotateX += rotateX;
      this.viewRotateY += rotateY;
      this.viewRotateZ += rotateZ;
    }
    this.viewPositionX += transformX;
    this.viewPositionY += transformY;
    this.viewPositionZ += transformZ;
  
    let strSTF='';
    strSTF +=' perspective('+(cameraPositionZ).toString(10)+'px)';
    //strSTF +=' translateX(-50%) translateY(-50%)';

    switch(swTableRotateCenterFlg){ // =1 で 画面中心回転
      case 1:      // 画面中心回転
        let wch,wcw; // 画像サイズ(MAP拡縮後)
        wch = this.#rootElementRef.clientHeight;
        wcw = this.#rootElementRef.clientWidth;
        let wiw,wih; // ウインドウサイズ
        wiw = window.innerWidth;
        wih = window.innerHeight;
        
        // transformOriginを設定
        let wx =0;
        if(wcw<=wiw){
            wx = wcw/2;
        }else{
            wx = wiw/2;
        }
        
        this.#rootElementRef.style.transformOrigin= ""+(wx-this.viewPotisonX)+"px "+(wch/2-this.viewPotisonY)+"px";
        
        // Styleに反映
        strSTF +=' translateX(' + (this.viewPositionX) + 'px)';
        strSTF +=' translateY(' + (this.viewPositionY) + 'px)';
        strSTF +=' translateZ(' + (this.viewPositionZ) + 'px)';
        strSTF +=' rotateX(' + this.viewRotateX + 'deg)';
        strSTF +=' rotateY(' + this.viewRotateY + 'deg)';
        strSTF +=' rotateZ(' + this.viewRotateZ + 'deg)';
        break; 
      case 2:     // テーブル中心回転
        strSTF +=' translateZ(' + (this.viewPositionZ) + 'px)';
        strSTF +=' translateY(' + (this.viewPositionY) + 'px)';
        strSTF +=' translateX(' + (this.viewPositionX) + 'px)';
        strSTF +=' rotateY(' + this.viewRotateY + 'deg)';
        strSTF +=' rotateX(' + this.viewRotateX + 'deg)';
        strSTF +=' rotateZ(' + this.viewRotateZ + 'deg)';
        break;
      default:  // テーブル回転なし
        strSTF +=' translateZ(' + (this.viewPositionZ) + 'px)';
        strSTF +=' translateY(' + (this.viewPositionY) + 'px)';
        strSTF +=' translateX(' + (this.viewPositionX) + 'px)';
        break;
    }

    
    this.#rootElementRef.style.transform = strSTF; 
        if(debug_infolevel>=2) console.log(strSTF);
  }



  setGameTableGrid(width, height, gridSize = 50, gridType= GridType.SQUARE, gridColor = '#000000e6') {
    this.gameTable.nativeElement.style.width = width * gridSize + 'px';
    this.gameTable.nativeElement.style.height = height * gridSize + 'px';

    let render = new GridLineRender(this.gridCanvas.nativeElement);
    render.render(width, height, gridSize, gridType, gridColor);

    let opacity= this.tableSelecter.gridShow ? 1.0 : 0.0;
    this.gridCanvas.nativeElement.style.opacity = opacity + '';
  }

  removeSelectionRanges() {
    let selection = window.getSelection();
    if (!selection.isCollapsed) {
      selection.removeAllRanges();
    }
  }

  removeFocus() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  trackByGameObject(index, gameObject) {
    return gameObject.identifier;
  }
}

//----------------------------------------------------------------------------------------


// @app/class/core/file-storage/file-reader-util.ts
const FileReaderUtil = {
  readAsArrayBufferAsync : function readAsArrayBufferAsync(blob) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = event => { resolve(reader.result); }
      reader.onabort = reader.onerror = (e) => { reject(e); }
      
      reader.readAsArrayBuffer(blob);
    });
  }

 ,readAsTextAsync : function readAsTextAsync(blob) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = event => { resolve(reader.result); }
      reader.onabort = reader.onerror = (e) => { reject(e); }
      reader.readAsText(blob);
    });
  }


 ,calcSHA256Async : async function calcSHA256Async(arg) {
    if (arg instanceof Blob) {
      return FileReaderUtil._calcSHA256Async(arg);
    } else {
      return FileReaderUtil._calcSHA256(arg);
    }
  }

 ,_calcSHA256Async : async function _calcSHA256Async(blob){
        return FileReaderUtil._calcSHA256(await FileReaderUtil.readAsArrayBufferAsync(blob));
        //return (await FileReaderUtil.readAsArrayBufferAsync(blob));
  }

 ,_calcSHA256 : function _calcSHA256(arrayBuffer){
    if(1==1){
        let wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        return CryptoJS.SHA256(wordArray).toString();
    }else{
        
        // binary>>Base64
        function arrayBufferToBinaryString(arrayBuffer) {
          let binaryString = "";
          const bytes = new Uint8Array(arrayBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binaryString += String.fromCharCode(bytes[i]);
          }
          return binaryString
        }
        return btoa(arrayBufferToBinaryString(arrayBuffer));
        
    }
  }
}
// @src\app\class\core\file-storage\ canvas-util.ts
const CanvasUtil = {
  /**
   * https://github.com/viliusle/Hermite-resize
   * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
   * 
   * @param {HtmlElement} canvas
   * @param {int} width
   * @param {int} height
   * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
   */
  resize : function resize(canvas, width, height, resize_canvas) {
    let width_source = canvas.width;
    let height_source = canvas.height;
    width = Math.round(width);
    height = Math.round(height);

    let ratio_w = width_source / width;
    let ratio_h = height_source / height;
    let ratio_w_half = Math.ceil(ratio_w / 2);
    let ratio_h_half = Math.ceil(ratio_h / 2);

    let ctx = canvas.getContext('2d');
    let img = ctx.getImageData(0, 0, width_source, height_source);
    let img2 = ctx.createImageData(width, height);
    let data = img.data;
    let data2 = img2.data;

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        let x2 = (i + j * width) * 4;
        let weight = 0;
        let weights = 0;
        let weights_alpha = 0;
        let gx_r = 0;
        let gx_g = 0;
        let gx_b = 0;
        let gx_a = 0;
        let center_y = (j + 0.5) * ratio_h;
        let yy_start = Math.floor(j * ratio_h);
        let yy_stop = Math.ceil((j + 1) * ratio_h);
        for (let yy = yy_start; yy < yy_stop; yy++) {
          let dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
          let center_x = (i + 0.5) * ratio_w;
          let w0 = dy * dy; //pre-calc part of w
          let xx_start = Math.floor(i * ratio_w);
          let xx_stop = Math.ceil((i + 1) * ratio_w);
          for (let xx = xx_start; xx < xx_stop; xx++) {
            let dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
            let w = Math.sqrt(w0 + dx * dx);
            if (w >= 1) {
              //pixel too far
              continue;
            }
            //hermite filter
            weight = 2 * w * w * w - 3 * w * w + 1;
            let pos_x = 4 * (xx + yy * width_source);
            //alpha
            gx_a += weight * data[pos_x + 3];
            weights_alpha += weight;
            //colors
            if (data[pos_x + 3] < 255)
              weight = weight * data[pos_x + 3] / 250;
            gx_r += weight * data[pos_x];
            gx_g += weight * data[pos_x + 1];
            gx_b += weight * data[pos_x + 2];
            weights += weight;
          }
        }
        data2[x2] = gx_r / weights;
        data2[x2 + 1] = gx_g / weights;
        data2[x2 + 2] = gx_b / weights;
        data2[x2 + 3] = gx_a / weights_alpha;
      }
    }
    //clear and resize canvas
    if (resize_canvas === true) {
      canvas.width = width;
      canvas.height = height;
    } else {
      ctx.clearRect(0, 0, width_source, height_source);
    }

    //draw
    ctx.putImageData(img2, 0, 0);
  }
}




// @app/class/core/file-storage/image-file.ts';
class ImageFile {
  context = {
    identifier: '',
    name: '',
    blob: null,
    type: '',
    url: '',
    thumbnail: {
      blob: null,
      type: '',
      url: '',
    }
  };

  get identifier(){ return this.context.identifier };
  get name() { return this.context.name };
  get blob() { return this.context.blob ? this.context.blob : this.context.thumbnail.blob; };
  get url(){ return this.context.url ? this.context.url : this.context.thumbnail.url; };
  get thumbnail() { return this.context.thumbnail };

  get state(){  // : ImageState 
    if (!this.url && !this.blob) return ImageState.NULL;
    if (this.url && !this.blob) return ImageState.URL;
    if (this.blob === this.thumbnail.blob) return ImageState.THUMBNAIL;
    return ImageState.COMPLETE;
  }

  get isEmpty() { return this.state <= ImageState.NULL; }

  constructor() { }

  static createEmpty(identifier) { //: ImageFile
    let imageFile = new ImageFile();
    imageFile.context.identifier = identifier;

    return imageFile;
  }


  static create(arg) {
    if (typeof arg === 'string') { // arg値は、URLが送られてくる想定。ハッシュ値はダメ？　
      let imageFile = new ImageFile();
      imageFile.context.identifier = arg;
      imageFile.context.name = arg;
      imageFile.context.url = arg;
      return imageFile;
    } else {    // こちらは、連想配列に、設定したいプロパティを記入したものをargで渡している。
      let imageFile = new ImageFile();
      imageFile.apply(arg);
      return imageFile;
    }
  }


  static async createAsync(arg) { //: Promise<ImageFile>
    if (arg instanceof File) {
      return await ImageFile._createAsync(arg, arg.name);
    } else if (arg instanceof Blob) {
      return await ImageFile._createAsync(arg);
    }
  }

  static async _createAsync(blob, name) {
    let arrayBuffer = await FileReaderUtil.readAsArrayBufferAsync(blob);

    let imageFile = new ImageFile();
    imageFile.context.identifier = await FileReaderUtil.calcSHA256Async(arrayBuffer);
    imageFile.context.name = name;
    imageFile.context.blob = new Blob([arrayBuffer], { type: blob.type });
    imageFile.context.url = window.URL.createObjectURL(imageFile.context.blob);
    
    // if(!(imageFile.identifier)) imageFile.identifier = imageFile.context.identifier; // 20230709 takayama追加

    try {
      imageFile.context.thumbnail = await ImageFile.createThumbnailAsync(imageFile.context);
    } catch (e) {
      throw e;
    }

    if (imageFile.context.name != null) imageFile.context.name = imageFile.context.identifier;

    return imageFile;
  }

  destroy() {
    this.revokeURLs();
  }

  apply(context2) {
    if (!this.context.identifier && context2.identifier) this.context.identifier = context2.identifier;
    if (!this.context.name && context2.name) this.context.name = context2.name;
    if (!this.context.blob && context2.blob) this.context.blob = context2.blob;
    if (!this.context.type && context2.type) this.context.type = context2.type;
    if (!this.context.url && context2.url) {
      if (this.state !== ImageState.URL) window.URL.revokeObjectURL(this.context.url);
      this.context.url = context2.url;
    }
    if (!this.context.thumbnail.blob && context2.thumbnail.blob) this.context.thumbnail.blob = context2.thumbnail.blob;
    if (!this.context.thumbnail.type && context2.thumbnail.type) this.context.thumbnail.type = context2.thumbnail.type;
    if (!this.context.thumbnail.url && context2.thumbnail.url) {
      if (this.state !== ImageState.URL) window.URL.revokeObjectURL(this.context.thumbnail.url);
      this.context.thumbnail.url = context2.thumbnail.url;
    }
    this.createURLs();
  }

  toContext() { // : ImageContext
    return {
      identifier: this.context.identifier,
      name: this.context.name,
      blob: this.context.blob,
      type: this.context.type,
      url: this.context.url,
      thumbnail: {
        blob: this.context.thumbnail.blob,
        type: this.context.thumbnail.type,
        url: this.context.thumbnail.url,
      }
    }
  }

  createURLs() {
    if (this.state === ImageState.URL) return;
    if (this.context.blob && this.context.url === '') this.context.url = window.URL.createObjectURL(this.context.blob);
    if (this.context.thumbnail.blob && this.context.thumbnail.url === '') this.context.thumbnail.url = window.URL.createObjectURL(this.context.thumbnail.blob);
  }

  revokeURLs() {
    if (this.state === ImageState.URL) return;
    window.URL.revokeObjectURL(this.context.url);
    window.URL.revokeObjectURL(this.context.thumbnail.url);
  }

  static createThumbnailAsync(context) {  // : Promise<ThumbnailContext>
    return new Promise((resolve, reject) => {
      let image = new Image();   // image: HTMLImageElement
      image.onload = (event) => {
        let scale = Math.min(128 / Math.max(image.width, image.height), 1.0);
        let dstWidth = image.width * scale;
        let dstHeight = image.height * scale;

        let canvas = document.createElement('canvas'); // : HTMLCanvasElement
        let render = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;

        render.drawImage(image, 0, 0);
        CanvasUtil.resize(canvas, dstWidth, dstHeight, true);

        canvas.toBlob(blob => {
          let thumbnail = { // : ThumbnailContext
            type: blob.type,
            blob: blob,
            url: window.URL.createObjectURL(blob),
          };
          resolve(thumbnail);
        }, context.blob.type);
      };
      image.onabort = image.onerror = () => {
        reject();
      }
      image.src = context.url;
    });
  }

  static Empty = ImageFile.createEmpty('null');
}





//----------------------------------------------------------------------------------------

// @app\class\core\system\util\ zero-timeout.ts
const queueFunction={
    i: 0
   ,timeouts : new Map()
   ,channel : new MessageChannel()
   
   ,setZeroTimeout : function setZeroTimeout(fn) {
        if (queueFunction.i === 0x100000000) { // max queue size
            queueFunction.i = 0;
        }
        if (++(queueFunction.i) in queueFunction.timeouts) throw new Error('setZeroTimeout queue overflow.');
        queueFunction.timeouts.set(queueFunction.i, fn);
        queueFunction.channel.port2.postMessage(queueFunction.i);
        return queueFunction.i;
    }
   ,clearZeroTimeout : function clearZeroTimeout(id) {
        queueFunction.timeouts.delete(id);
    }
}
queueFunction.channel.port1.onmessage = function (ev) {
  const fn = queueFunction.timeouts.get(ev.data);
  queueFunction.timeouts.delete(ev.data);
  if (fn) fn();
}
queueFunction.channel.port1.start();
// queueFunction.channel.port2.start();



//----------------------------------------------------------------------------------------



// @ src\app\class\core\synchronize-object

class ObjectStore {
  static #_instance; //: ObjectStore
  static get instance() {
    if (!ObjectStore.#_instance) ObjectStore.#_instance = new ObjectStore();
    return ObjectStore.#_instance;
  }

  identifierMap = new Map(); // : Map<ObjectIdentifier, GameObject>
  aliasNameMap = new Map(); // : Map<ObjectAliasName, Map<ObjectIdentifier, GameObject>> 
  garbageMap = new Map(); //: Map<ObjectIdentifier, TimeStamp>

  queueMap = new Map(); // : Map<ObjectIdentifier, ObjectContext> 
  updateInterval= null;
  garbageCollectionInterval = null; // : NodeJS.Timer
  updateCallback = () => { this.updateQueue(); }

  constructor() { console.log('ObjectStore ready...'); };

  add(object, shouldBroadcast = true) {  // object: GameObject
    if (this.get(object.identifier) != null || this.isDeleted(object.identifier)) return null;
    this.identifierMap.set(object.identifier, object);
    let objectsMap = this.aliasNameMap.has(object.aliasName) ? this.aliasNameMap.get(object.aliasName) : this.aliasNameMap.set(object.aliasName, new Map()).get(object.aliasName);
    objectsMap.set(object.identifier, object);
    object.onStoreAdded();
    if (shouldBroadcast) this.update(object.toContext());
    return object;
  }

  remove(object) { // object: GameObject
    if (!this.identifierMap.has(object.identifier)) return null;

    this.identifierMap.delete(object.identifier);
    let objectsMap = this.aliasNameMap.get(object.aliasName);
    if (objectsMap) objectsMap.delete(object.identifier);
    object.onStoreRemoved();
    return object;
  }

  delete(arg, shouldBroadcast = true) {
    let object = null; //  object: GameObject
    let identifier = null;
    if (typeof arg === 'string') {
      object = this.get(arg);
      identifier = arg;
    } else {
      object = arg;
      identifier = arg.identifier;
    }
    this.markForDelete(identifier);
    return object == null ? null : this._delete(object, shouldBroadcast);
  }

  _delete(object, shouldBroadcast) {
    if (this.remove(object) === null) return null;
    if (shouldBroadcast) EventSystem.instance.call('DELETE_GAME_OBJECT', { aliasName: object.aliasName, identifier: object.identifier });

    return object;
  }

  markForDelete(identifier) {
    this.garbageMap.set(identifier, performance.now());
    this.garbageCollection(10 * 60 * 1000);
  }

  get (identifier )  {
    return this.identifierMap.has(identifier) ? this.identifierMap.get(identifier) : null;
  }

  getObjects(arg )  { // : T[] <T extends GameObject>
    if (arg == null) {
      return Array.from(this.identifierMap.values());
    }
    let aliasName = '';
    if (typeof arg === 'string') {
      aliasName = arg;
    } else {
      aliasName = arg.aliasName;
    }

    return this.aliasNameMap.has(aliasName) ? Array.from(this.aliasNameMap.get(aliasName).values()) : [];
  }


  update(arg) {
    let context = null; //: ObjectContext
    if (typeof arg === 'string') {
      let object = this.get(arg);  //object: GameObject
      if (object) context = object.toContext();
    } else {
      context = arg;
    }
    if (!context) return;

    if (this.queueMap.has(context.identifier)) {
      let queue = this.queueMap.get(context.identifier);
      for (let key in context) {
        queue[key] = context[key];
      }
      return;
    }
    EventSystem.instance.call('UPDATE_GAME_OBJECT', context);  // *************
    this.queueMap.set(context.identifier, context);
    if (this.updateInterval === null) {
      this.updateInterval = queueFunction.setZeroTimeout(this.updateCallback);
    }
  }

  updateQueue() {
    this.queueMap.clear();
    this.updateInterval = null;
  }

  isDeleted(identifier) {
    let timeStamp = this.garbageMap.get(identifier);
    return timeStamp != null;
  }

  getCatalog() {
    let catalog = []; // : CatalogItem[]
    for (let object of this.identifierMap.values()) {
      catalog.push({ identifier: object.identifier, version: object.version });
    }
    return catalog;
  }

  clearDeleteHistory() {
    this.garbageMap.clear();
  }


  garbageCollection(arg) {  //garbage: ObjectContext
    if (typeof arg === 'number') {
      if (this.garbageCollectionInterval === null) {
        this.garbageCollectionInterval = setTimeout(() => { this.garbageCollectionInterval = null }, 1000);
        this._garbageCollection(arg);
      }
    } else {
      this.garbageMap.delete(arg.identifier);
    }
  }

  _garbageCollection(ms) {
    let nowDate = performance.now();

    let checkLength = this.garbageMap.size - 100000;
    if (checkLength < 1) return;

    let entries = this.garbageMap.entries();
    while (checkLength < 1) {
      checkLength--;
      let item = entries.next();
      if (item.done) break;

      let identifier = item.value[0];
      let timeStamp = item.value[1];

      if (timeStamp + ms < nowDate) continue;
      this.garbageMap.delete(identifier);
    }
  }
}


//@app\class\core\system\util\ resettable-timeout.ts
class ResettableTimeout {
  #callback; // : TimerCallback
  #timerMilliSecond = 0;
  #timeoutDate = 0;
  #timeoutTimer; // : NodeJS.Timer
  #isStopped = false;

  get isActive() { return this.#timeoutTimer != null; }

  constructor(callback, ms) {
    this.#callback = callback;
    this.#timerMilliSecond = ms;
    this.reset();
  }

  stop() {
    this.#isStopped = true;
  }

  clear() {
    this.#callback = null;
    this.#timerMilliSecond = 0;
    this.#timeoutDate = 0;
    if (this.#timeoutTimer) clearTimeout(this.#timeoutTimer);
    this.#timeoutTimer = null;
    this.#isStopped = false;
  }

  //reset()
  //reset(ms: number)
  //reset(callback: TimerCallback, ms: number)
  reset(...args) {
    if (args.length === 1) {
      this.#timerMilliSecond = args[0];
    } else if (1 < args.length) {
      this.#callback = args[0];
      this.#timerMilliSecond = args[1];
    }
    this.#isStopped = false;

    let oldTimeoutDate = this.#timeoutDate;
    this.#timeoutDate = performance.now() + this.#timerMilliSecond;

    if (this.#timeoutTimer && oldTimeoutDate <= this.#timeoutDate) return;
    this.#setTimeout();
  }

  #setTimeout() {
    if (this.#timeoutTimer) clearTimeout(this.#timeoutTimer);
    this.#timeoutTimer = null;
    if (!this.#callback) return;

    this.#timeoutTimer = setTimeout(() => {
      this.#timeoutTimer = null;
      if (this.#isStopped) return;

      if (performance.now() < this.#timeoutDate) {
        this.#setTimeout();
      } else {
        if (this.#callback) this.#callback();
      }
    }, this.#timeoutDate - performance.now());
  }
}


// @\app\class\core\file-storage\ image-storage.ts
const ImageState = { // export enum ImageState {}
  NULL : 0,
  THUMBNAIL : 1,
  COMPLETE : 2,
  URL : 1000,
}
class ImageStorage {
  static #_instance; // : ImageStorage
  static get instance() {
    if (!ImageStorage.#_instance) ImageStorage.#_instance = new ImageStorage();
    return ImageStorage.#_instance;
  }

  #imageHash = {};  // : { [identifier: string]: ImageFile }

  get images() {  // : ImageFile[]
    let images = [];
    for (let identifier in this.#imageHash) {
      images.push(this.#imageHash[identifier]);
    }
    return images;
  }

  #lazyTimer; // : ResettableTimeout

  constructor() {
    console.log('ImageStorage ready...');
  }

  destroy() {
    for (let identifier in this.#imageHash) {
      this.delete(identifier);
    }
  }


  async addAsync(arg) {
    let image = await ImageFile.createAsync(arg);
    return this._add(image);
  }


  add(arg) {
    let image;
    if (typeof arg === 'string') {
      image = ImageFile.create(arg);
    } else if (arg instanceof ImageFile) {
      image = arg;
    } else {
      if (this.update(arg)) return this.#imageHash[arg.identifier];
      image = ImageFile.create(arg);
    }
    return this._add(image);
  }

  _add(image) {
    if (ImageState.COMPLETE <= image.state) this.lazySynchronize(100);
    if (this.update(image)) return this.#imageHash[image.identifier];
    this.#imageHash[image.identifier] = image;
    console.log('add Image: ' + image.identifier);
    return image;
  }



  update(image) {
    let context; // : ImageContext
    if (image instanceof ImageFile) {
      context = image.toContext();
    } else {
      context = image;
    }
    let updatingImage = this.#imageHash[image.identifier];
    if (updatingImage) {
      updatingImage.apply(image);
      return true;
    }
    return false;
  }

  delete(identifier) {
    let deleteImage = this.#imageHash[identifier];
    if (deleteImage) {
      deleteImage.destroy();
      delete this.#imageHash[identifier];
      return true;
    }
    return false;
  }

  get(identifier) {
    let image = this.#imageHash[identifier];
    if (image) return image;
    return null;
  }

  synchronize(peer) {
    if (this.#lazyTimer) this.#lazyTimer.stop();
    //  EventSystem.instance.call('SYNCHRONIZE_FILE_LIST', this.getCatalog(), peer);  // ****************
  }

  lazySynchronize(ms, peer) {
    if (this.#lazyTimer == null) this.#lazyTimer = new ResettableTimeout(() => this.synchronize(peer), ms);
    this.#lazyTimer.reset(ms);
  }

  getCatalog() {  // type CatalogItem = { readonly identifier: string, readonly state: number };
    let catalog = []; // : CatalogItem[]
    for (let image of this.images) {
      if (ImageState.COMPLETE <= image.state) {
        catalog.push({ identifier: image.identifier, state: image.state });
      }
    }
    return catalog;
  }
}




// app\class\core\system\util\  uuid.ts
const UUID = {
  lut : [] 
  //for (let i = 0; i < 256; i++) {
  //  lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
  //}
 ,generateUuid : function generateUuid(){
    const dvals = new Uint32Array(4);
    window.crypto.getRandomValues(dvals);
    const d0 = dvals[0];
    const d1 = dvals[1];
    const d2 = dvals[2];
    const d3 = dvals[3];
    const lut = UUID.lut;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
      lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
      lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
  }
};
(function(){
  for (let i = 0; i < 256; i++) {
    UUID.lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
  }
})();





// @app\class\core\synchronize-object\ object-factory.ts
class ObjectFactory {
  static _instance
  static get instance() {
    if (!ObjectFactory._instance) ObjectFactory._instance = new ObjectFactory();
    return ObjectFactory._instance;
  }

  constructorMap = new Map(); // : Map<string, Type<GameObject>>
  aliasMap = new Map(); // : Map<Type<GameObject>, string>

  constructor() { console.log('ObjectFactory ready...'); };

  register(constructor, alias) {
    if (!alias) alias = constructor.name ?? (constructor.toString().match(/function\s*([^(]*)\(/)?.[1] ?? '');
    if (this.constructorMap.has(alias)) {
      console.error('その alias<' + alias + '> はすでに割り当て済みじゃねー？');
      return;
    }
    if (this.aliasMap.has(constructor)) {
      console.error('その constructor はすでに登録済みじゃねー？', constructor);
      return;
    }
    console.log('addGameObjectFactory -> ' + alias);
    this.constructorMap.set(alias, constructor);
    this.aliasMap.set(constructor, alias);
  }

  create(alias, identifer) {
    let classConstructor = this.constructorMap.get(alias);
    if (!classConstructor) {
      console.error(alias + 'という名のＧameObjectクラスは定義されていません');
      return null;
    }
    let gameObject= new classConstructor(identifer);
    return gameObject;
  }

  getAlias(constructor){
    return this.aliasMap.get(constructor) ?? '';
  }
}


// @app/class/core/synchronize-object/game-object
class GameObject {
  context = { //: ObjectContext
    aliasName: (this.constructor).aliasName,
    identifier: '',
    majorVersion: 0,
    minorVersion: 0,
    syncData: {}
  }

  static get aliasName() { return ObjectFactory.instance.getAlias(this); }
  get aliasName() { return this.context.aliasName; }
  get identifier() { return this.context.identifier; }
  get version() { return this.context.majorVersion + this.context.minorVersion; }

  constructor(identifier = UUID.generateUuid()) {
    this.context.identifier = identifier;
  }

  initialize() {
    ObjectStore.instance.add(this);
  }

  destroy() {
    ObjectStore.instance.delete(this);
  }

  // GameObject Lifecycle
  onStoreAdded() { }

  // GameObject Lifecycle
  onStoreRemoved() { }

  update() {
    this.#versionUp();
    ObjectStore.instance.update(this.identifier);
  }

  #versionUp() {
    this.context.majorVersion += 1;
    this.context.minorVersion = Math.random();
  }

  apply(context) { // : ObjectContext
    if (context !== null && this.identifier === context.identifier) {
      this.context.majorVersion = context.majorVersion;
      this.context.minorVersion = context.minorVersion;
      this.context.syncData = context.syncData;
    }
  }

  clone() {
    let xmlString = this.toXml();
    return ObjectSerializer.instance.parseXml(xmlString);
  }

  toContext() {
    return {
      aliasName: this.context.aliasName,
      identifier: this.context.identifier,
      majorVersion: this.context.majorVersion,
      minorVersion: this.context.minorVersion,
      syncData: deepCopy(this.context.syncData)
    }
  }

  toXml(){
    return ObjectSerializer.instance.toXml(this);
  }
}

function deepCopy(obj) {
  if (obj == null) return obj;
  let clone = Array.isArray(obj) ? [] : {};
  let keys = Object.getOwnPropertyNames(obj);
  for (let key of keys) {
    let type = typeof obj[key];
    if (obj[key] != null && type === 'object') {
      clone[key] = deepCopy(obj[key]);
    } else if (type !== 'function') {
      clone[key] = obj[key];
    }
  }
  return clone;
}

// @/app\class\core\synchronize-object \ object-serializer.ts
//export interface XmlAttributes extends GameObject {
//  toAttributes(): Attributes;
//  parseAttributes(attributes: NamedNodeMap);
//}
//export interface InnerXml extends GameObject {
//  innerXml(): string;
//  parseInnerXml(element: Element);
//}

const objectPropertyKeys = Object.getOwnPropertyNames(Object.prototype);
const arrayPropertyKeys = Object.getOwnPropertyNames(Array.prototype);

class ObjectSerializer {
  static #_instance; // : ObjectSerializer
  static get instance() {
    if (!ObjectSerializer.#_instance) ObjectSerializer.#_instance = new ObjectSerializer();
    return ObjectSerializer.#_instance;
  }

  constructor() {
    console.log('ObjectSerializer ready...');
  };

  toXml(gameObject) {
    let xml = '';
    let attributes = 'toAttributes' in gameObject ? (gameObject).toAttributes() : ObjectSerializer.toAttributes(gameObject.toContext().syncData);
    let tagName = gameObject.aliasName;

    let attrStr = '';
    for (let name in attributes) {
      let attribute = XmlUtil.encodeEntityReference(attributes[name] + '');
      if (attribute == null) continue;
      attrStr += ' ' + name + '="' + attribute + '"';
    }
    xml += `<${tagName + attrStr}>`;
    xml += 'innerXml' in gameObject ? (gameObject).innerXml() : '';
    xml += `</${tagName}>`;
    return xml;
  }

  static toAttributes(syncData){
    let attributes = {};
    for (let syncVar in syncData) {
      let item = syncData[syncVar];
      let key = syncVar;
      let childAttr = ObjectSerializer.make2Attributes(item, key);
      for (let name in childAttr) {
        attributes[name] = childAttr[name];
      }
    }
    return attributes;
  }

  static make2Attributes(item, key) {
    let attributes = {};
    if (Array.isArray(item)) {
      let arrayAttributes = ObjectSerializer.array2attributes(item, key);
      for (let name in arrayAttributes) {
        attributes[name] = arrayAttributes[name];
      }
    } else if (typeof item === 'object') {
      let objAttributes = ObjectSerializer.object2attributes(item, key);
      for (let name in objAttributes) {
        attributes[name] = objAttributes[name];
      }
    } else {
      attributes[key] = item;
    }
    return attributes;
  }

  static object2attributes(obj, rootKey) {  // : ObjectSerializer
    let attributes = {};
    for (let objKey in obj) {
      let item = obj[objKey];
      let key = rootKey + '.' + objKey;
      let childAttr = ObjectSerializer.make2Attributes(item, key);
      for (let name in childAttr) {
        attributes[name] = childAttr[name];
      }
    }
    return attributes;
  }

  static array2attributes(array, rootKey) {
    let attributes = {};
    let length = array.length;
    for (let i = 0; i < length; i++) {
      let item = array[i];
      let key = rootKey + '.' + i;
      let childAttr = ObjectSerializer.make2Attributes(item, key);
      for (let name in childAttr) {
        attributes[name] = childAttr[name];
      }
    }
    return attributes;
  }

  parseXml(xml) {  // parseXml : GameObject
    let xmlElement = null;
    if (typeof xml === 'string') {
      xmlElement = XmlUtil.xml2element(xml);
    } else {
      xmlElement = xml;
    }
    if (!xmlElement) {
      console.error('xmlElementが空です');
      return null;
    }

    let gameObject = ObjectFactory.instance.create(xmlElement.tagName);
    if (!gameObject) return null;

    if ('parseAttributes' in gameObject) {
      (gameObject).parseAttributes(xmlElement.attributes);
    } else {
      let context = gameObject.toContext();
      ObjectSerializer.parseAttributes(context.syncData, xmlElement.attributes);
      gameObject.apply(context);
    }

    gameObject.initialize();
    if ('parseInnerXml' in gameObject) {
      (gameObject).parseInnerXml(xmlElement);
    }
    return gameObject;
  }

  static parseAttributes(syncData, attributes) {   // attributes: NamedNodeMap
    let length = attributes.length;
    for (let i = 0; i < length; i++) {
      let value = attributes[i].value;
      value = XmlUtil.decodeEntityReference(value);

      let split = attributes[i].name.split('.');
      let key = split[0];
      let obj = syncData;

      let pollutionKey = split.find(splitKey => objectPropertyKeys.includes(splitKey));
      if (pollutionKey != null) {
        console.log(`skip invalid key (${pollutionKey})`);
        continue;
      }

      if (1 < split.length) {
        ({ obj, key } = ObjectSerializer.attributes2object(split, obj, key));
        if (key == null) continue;
      }

      let type = typeof obj[key];
      if (type !== 'string' && obj[key] != null) {
        value = JSON.parse(value);
      }
      obj[key] = value;
    }
    return syncData;
  }

  //static attributes2object(split, obj, key) {
  //  // 階層構造の解析 foo.bar.0="abc" 等
  //  // 処理として実装こそしているが、xmlの仕様としては良くないので使用するべきではない.
  //  let parentObj = null;
  //  let length = split.length;
  //  for (let i = 0; i < length; i++) {
  //    let index = parseInt(split[i]);
  //    if (parentObj && !Number.isNaN(index) && !Array.isArray(obj) && Object.keys(parentObj).length) {
  //      parentObj[key] = [];
  //      obj = parentObj[key];
  //    }
  //    key = Number.isNaN(index) ? split[i] : index;
  //
  //    if (Array.isArray(obj) && typeof key !== 'number') {
  //      console.warn('Arrayにはindexの挿入しか許可しない');
  //      return { obj, key: null };
  //    }
  //    if (i + 1 < length) {
  //      if (obj[key] == null)
  //        obj[key] = typeof key === 'number' ? [] : {};
  //      parentObj = obj;
  //      obj = obj[key];
  //    }
  //  }
  //  return { obj, key };
  //}
  //
  //static parseInnerXml(element) {
  //  return null;
  //}
  
}


//  @\app\class\core\system\util \ xml-util.ts
const XmlUtil = {
   encodePattern : /&|<|>|"|'/g
  ,encodeMap  :{
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    '\'': '&apos;',
   }

  ,decodePattern : /&amp;|&lt;|&gt;|&quot;|&apos;/g
  ,decodeMap : {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '\"',
    '&apos;': '\'',
   }

  ,sanitizePattern : /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g

  ,xml2element : function(xml){
    let domParser = new DOMParser();
    let xmlDocument= null;
    try {
      xml = sanitizeXml(xml);
      xmlDocument = domParser.parseFromString(xml, 'application/xml');
      let parsererror = xmlDocument.getElementsByTagName('parsererror');
      if (parsererror.length) {
        console.error('XMLのパースに失敗しました', xmlDocument.documentElement);
        xmlDocument = null;
      }
    } catch (error) {
      console.error(error);
    }
    return xmlDocument ? xmlDocument.documentElement : null;
   }

  ,encodeEntityReference : function encodeEntityReference(string) {
    return string.replace(XmlUtil.encodePattern, XmlUtil.encodeReplacer);
  }

  ,decodeEntityReference : function decodeEntityReference(string){
    return string.replace(XmlUtil.decodePattern, XmlUtil.decodeReplacer);
  }

  ,sanitizeXml : function sanitizeXml(xml){
    return xml.replace(XmlUtil.sanitizePattern, '').trim();
  }

  ,encodeReplacer : function encodeReplacer(char){
    return XmlUtil.encodeMap[char];
  }

  ,decodeReplacer : function decodeReplacer(entity){
    return XmlUtil.decodeMap[entity];
  }
}












// @/core/synchronize-object/object-node';
class ObjectNode extends GameObject  { // implements XmlAttributes, InnerXml
  //@SyncVar() value: number | string = '';
  //@SyncVar() protected attributes: Attributes = {};
  //@SyncVar() private parentIdentifier: string = '';
  //@SyncVar() protected majorIndex: number = 0;
  //@SyncVar() protected minorIndex: number = Math.random();
  value = '';
  attributes={};
  parentIdentifier='';
  majorIndex =0;
  minorIndex=Math.random();
  

  get index() { return this.majorIndex + this.minorIndex; }
  set index(index) {
    this.majorIndex = index | 0;
    this.minorIndex = index - this.majorIndex;
    if (this.parent) this.parent.needsSort = true;
  }

  get parent(){ return ObjectStore.instance.get(this.parentIdentifier); } //: ObjectNode 
  get parentId() { return this.parentIdentifier; }
  get parentIsAssigned() { return 0 < this.parentIdentifier.length; }
  get parentIsUnknown() { return this.parentIsAssigned && ObjectStore.instance.get(this.parentIdentifier) == null; }
  get parentIsDestroyed() { return this.parentIsAssigned && ObjectStore.instance.isDeleted(this.parentIdentifier); }

  _children = []; // : ObjectNode[]
  get children() {
    if (this.needsSort) {
      this.needsSort = false;
      this._children.sort((a, b) => a.index - b.index);
    }
    return this._children.concat();
  }

  // TODO 名前　親Nodeの存在が未知の状態であるNode
  static unknownNodes = {};    // : { [identifier: string]: ObjectNode[] }
  needsSort = true;

  // override
  destroy() {
    super.destroy();
    for (let child of this._children.concat()) {
      child.destroy();
    }
    this._children = [];
  }

  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    this.initializeChildren();
  }

  // GameObject Lifecycle
  onStoreRemoved() {
    super.onStoreRemoved();
    if (this.parent) this.parent.removeChild(this);
  }

  // ObjectNode Lifecycle
  onChildAdded(child) { }

  // ObjectNode Lifecycle
  onChildRemoved(child) { }

  #_onChildAdded(child) {
    let node = this;
    while (node) {
      node.onChildAdded(child);
      node = node.parent;
      if (node === this) break;
    }
  }

  _onChildRemoved(child) {
    let node = this;
    while (node) {
      node.onChildRemoved(child);
      node = node.parent;
      if (node === this) break;
    }
  }

  initializeChildren() {
    if (ObjectNode.unknownNodes[this.identifier] == null) return;
    let objects = ObjectNode.unknownNodes[this.identifier];
    for (let object of objects) {
      if (object.parent === this) this.updateChildren(object);
    }
    if (ObjectNode.unknownNodes[this.identifier]) {
      delete ObjectNode.unknownNodes[this.identifier];
    }
  }

  updateChildren(child = this) {
    let index = this._children.indexOf(child);
    let isAdded = false;
    let isMyChild = child.parent === this;

    if (index < 0 && isMyChild) {
      this._children.push(child);
      index = this._children.length - 1;
      isAdded = true;
    } else if (0 <= index && !isMyChild) {
      this._children.splice(index, 1);
      this._onChildRemoved(child);
      return;
    } else if (index < 0 && !isMyChild) {
      return;
    }

    let childrenLength = this._children.length;
    if (!childrenLength) return;
    let prevIndex = index - 1 < 0 ? 0 : index - 1;
    let nextIndex = childrenLength - 1 < index + 1 ? childrenLength - 1 : index + 1;

    if (this._children[prevIndex].index > child.index || child.index > this._children[nextIndex].index) this.needsSort = true;
    if (isAdded) this.#_onChildAdded(child);
  }

  updateIndexs() {
    let children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].majorIndex = i;
      children[i].minorIndex = Math.random();
    }
  }

  appendChild(child){  //  :T
    if (child.contains(this)) return null;
    if (child.parent && child.parent !== this) child.parent.removeChild(child);

    let lastIndex = 0 < this.children.length ? this.children[this.children.length - 1].majorIndex + 1 : 0;

    child.parentIdentifier = this.identifier;
    child.majorIndex = lastIndex;
    child.minorIndex = Math.random();

    this.updateChildren(child);

    return child;
  }

  insertBefore(child, reference){
    if (child.contains(this)) return null;
    if (child === reference && child.parent === this) return child;

    if (child.parent && child.parent !== this) child.parent.removeChild(child);

    let index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);

    child.parentIdentifier = this.identifier;

    let prevIndex = 0 < index ? this.children[index - 1].index : 0;
    let diff = reference.index - prevIndex;
    let insertIndex = prevIndex + diff * (0.45 + 0.1 * Math.random());
    child.majorIndex = insertIndex | 0;
    child.minorIndex = insertIndex - child.majorIndex;

    this.updateChildren(child);
    if (diff < 1e-7) {
      this.updateIndexs();
    }

    return child;
  }

  removeChild(child) {
    let children = this.children;
    let index = children.indexOf(child);
    if (index < 0) return null;

    child.parentIdentifier = '';
    child.majorIndex = 0;
    child.minorIndex = Math.random();

    this.updateChildren(child);
    return child;
  }

  contains(child){
    let parent = child.parent;
    while (parent) {
      if (parent === child) {
        console.error('[Error] 循環参照発生 ', child);
        return false;
      }
      if (parent === this) return true;
      parent = parent.parent;
    }
    return false;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
    this.update();
  }

  getAttribute(name){
    if (this.attributes[name] == null) {
      return '';
    }
    return this.attributes[name];
  }

  removeAttribute(name) {
    delete this.attributes[name];
    this.update();
  }

  toAttributes() { // : Attributes
    return ObjectSerializer.toAttributes(this.attributes);
  };

  parseAttributes(attributes) {
    ObjectSerializer.parseAttributes(this.attributes, attributes);
  };

  innerXml() {
    let xml = '';
    xml += XmlUtil.encodeEntityReference(this.value + '');
    for (let child of this.children) {
      xml += ObjectSerializer.instance.toXml(child);
    }
    return xml;
  };

  parseInnerXml(element) {
    let children = element.children;
    let length = children.length;
    if (0 < length) {
      for (let i = 0; i < length; i++) {
        let child = ObjectSerializer.instance.parseXml(children[i]);
        if (child instanceof ObjectNode) this.appendChild(child);
      }
    } else {
      this.value = XmlUtil.decodeEntityReference(element.innerHTML);
    }
  };

  // override
  apply(context) {
    let oldParent = this.parent;
    super.apply(context);
    if (oldParent && this.parent !== oldParent) oldParent.updateChildren(this);
    if (this.parent) {
      this.parent.updateChildren(this);
    } else if (this.parentIsAssigned) {
      if (!(this.parentIdentifier in ObjectNode.unknownNodes)) {
        ObjectNode.unknownNodes[this.parentIdentifier] = [];
      }
      ObjectNode.unknownNodes[this.parentIdentifier].push(this);
    }
  }
}


// @ src\app\class\ data-element.ts
class DataElement extends ObjectNode {

  get isNumberResource() { return this.type != null && this.type === 'numberResource'; }
  get isNote() { return this.type != null && this.type === 'note'; }

  static create(name, value = '', attributes = {}, identifier= '') {
    let dataElement; // : DataElement
    if (identifier && 0 < identifier.length) {
      dataElement = new DataElement(identifier);
    } else {
      dataElement = new DataElement();
    }
    dataElement.attributes = attributes;
    dataElement.name = name;
    dataElement.value = value;
    dataElement.initialize();

    return dataElement;
  }

  getElementsByName(name){ 
    let children = []; // : DataElement[] 
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (child.getAttribute('name') === name) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByName(name));
      }
    }
    return children;
  }

  getElementsByType(type) {
    let children = []; // : DataElement[] 
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (child.getAttribute('type') === type) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByType(type));
      }
    }
    return children;
  }

  getFirstElementByName(name) {
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (child.getAttribute('name') === name) return child;
        let match = child.getFirstElementByName(name);
        if (match) return match;
        if(child.name === name) return child; // 20230611 追加test
      }
    }
    return null;
  }
}



// @udonarium-1.12.0\src\app\class　　　tabletop-object.ts
class TabletopObject extends ObjectNode {
  //@SyncVar() location: TabletopLocation = {
  //  name: 'table',
  //  x: 0,
  //  y: 0
  //};
  //@SyncVar() posZ: number = 0;
  location = {
    name: 'table',
    x: 0,
    y: 0
  }
  posZ=0;
  visibility="";


  get isVisibleOnTable() { return this.location.name === 'table'; }

  #_imageFile = ImageFile.Empty;
  #_dataElements = {};  // _dataElements: { [name: string]: string }

  // GameDataElement getter/setter
  get rootDataElement() {
    for (let node of this.children) {
      if (node.getAttribute('name') === this.aliasName) return node;
    }
    return null;
  }

  get imageDataElement() { return this.getElement('image'); }
  get commonDataElement() { return this.getElement('common'); }
  get detailDataElement() { return this.getElement('detail'); }

  get imageFile() {
    if (!this.imageDataElement) return this.#_imageFile;
    let imageIdElement = this.imageDataElement.getFirstElementByName('imageIdentifier');
    if (imageIdElement && this.#_imageFile.identifier !== imageIdElement.value) {
      let file = ImageStorage.instance.get(imageIdElement.value);
      this.#_imageFile = file ? file : ImageFile.Empty;
    }
    return this.#_imageFile;
  }

  createDataElements() {
    this.initialize();  // インスタンスを作成して ObjectStoreに登録する(処理は class GameObject内で定義)
    let aliasName = this.aliasName;
    if (!this.rootDataElement) {
      let rootElement = DataElement.create(aliasName, '', {}, aliasName + '_' + this.identifier);
      this.appendChild(rootElement);
    }

    if (!this.imageDataElement) {
      this.rootDataElement.appendChild(DataElement.create('image', '', {}, 'image_' + this.identifier));
      this.imageDataElement.appendChild(DataElement.create('imageIdentifier', '', { type: 'image' }, 'imageIdentifier_' + this.identifier));
    }
    if (!this.commonDataElement) this.rootDataElement.appendChild(DataElement.create('common', '', {}, 'common_' + this.identifier));
    if (!this.detailDataElement) this.rootDataElement.appendChild(DataElement.create('detail', '', {}, 'detail_' + this.identifier));
  }

  getElement(name, from = this.rootDataElement) {
    if (!from) return null;
    let element = this.#_dataElements[name] ? ObjectStore.instance.get(this.#_dataElements[name]) : null;
    if (!element || !from.contains(element)) {
      element = from.getFirstElementByName(name);
      this.#_dataElements[name] = element ? element.identifier : null;
    }
    return element;
  }

  getCommonValue(elementName, defaultValue) {
    let element = this.getElement(elementName, this.commonDataElement);
    if (!element) return defaultValue;

    if (typeof defaultValue === 'number') {
      let number =+element.value;
      return (Number.isNaN(number) ? defaultValue : number);
    } else {
      return (element.value + '');
    }
  }

  setCommonValue(elementName, value) {
    let element = this.getElement(elementName, this.commonDataElement);
    if (!element) { return; }
    element.value = value;
  }

  getImageFile(elementName) {
    if (!this.imageDataElement) return null;
    let image = this.getElement(elementName, this.imageDataElement);
    return image ? ImageStorage.instance.get(image.value) : null;
  }

  setImageFile(elementName, imageFile) {
    let image = imageFile ? this.getElement(elementName, this.imageDataElement) : null;
    if (!image) return;
    image.value = imageFile.identifier;
  }

  setLocation(location) {
    this.location.name = location;
    this.update();
  }
}

// ===============Event================
//   @app\class\core\system\event \ listener.ts
class Listener{
  #_subject; // : Subject
  #_key;
  #_eventName;
  #_priority = 0;
  #_callback;
  #_isOnlyOnce;
  #_isRegistered= false;

  get subject() { return this.#_subject; }
  get key() { return this.#_key; }
  get eventName() { return this.#_eventName; }
  get priority() { return this.#_priority; }
  get callback() { return this.#_callback; }
  get isOnlyOnce() { return this.#_isOnlyOnce; }
  get isRegistered() { return this.#_isRegistered; }

  constructor(subject, key) {
    this.#_subject = subject;
    this.#_key = key;
  }

  on(...args){
    this.#_isOnlyOnce = false;
    if (args.length === 2) {
      return this.#register(args[0], 0, args[1]);
    } else {
      return this.#register(args[0], args[1], args[2]);
    }
  }

  once(...args) {
    let listener = this.on.apply(this, args);
    this.#_isOnlyOnce = true;
    return listener;
  }

  #register(eventName, priority, callback) {
    if (this.isRegistered) this.unregister();
    this.#_eventName = eventName ? eventName : '*';
    this.#_priority = priority;
    this.#_callback = callback;

    this.subject.registerListener(this);
    this.#_isRegistered = true;
    return new Listener(this.subject, this.key);
  }

  unregister() {
    this.subject.unregisterListener(this);
    this.#_callback = null;
    this.#_isRegistered = false;
    return this;
  }

  trigger(event) {
    if (this.callback && this.isRegistered) {
      this.callback.apply(this.key, [event, this]);
      if (this.isOnlyOnce) this.unregister();
    }
  }

  isEqual(key, eventName, callback) {
    let matchTarget = (key == null || key === this.key);
    let matchEventName = (eventName == null || eventName === this.eventName);
    let matchCallback = (callback == null || callback === this.callback);

    return matchTarget && matchEventName && matchCallback;
  }
}


//   @app\class\core\system\event \ event.ts
class Event{
  isSendFromSelf = false; // readonly 

//  constructor( eventName,  data, sendFrom = Network.instance.peerId) {  
//        this.isSendFromSelf = this.sendFrom === Network.instance.peerId;
//  }
  constructor( eventName,  data, sendFrom = "") {     // **********************
        this.isSendFromSelf = this.sendFrom === "";     // **********************
  }                                                     // **********************


  toContext() {
    return {
      sendFrom: this.sendFrom,
      eventName: this.eventName,
      data: this.data,
    };
  }
}


//   @app\class\core\system\event \ event-system.ts
class EventSystem {
  static #_instance
  static get instance() {
    if (!EventSystem.#_instance) {
      EventSystem.#_instance = new EventSystem();
      EventSystem.#_instance.#initializeNetworkEvent();
    }
    return EventSystem.#_instance;
  }
  #listenerMap = new Map(); // #listenerMap: Map<EventName, Listener[]>
  
  constructor() {
    console.log('EventSystem ready...');
  }

  register(key){
    let listener = new Listener(this, key);
    return listener;
  }


  unregister(...args){
    if (args.length === 1) {
      this.#_unregister(args[0], null, null);
    } else if (args.length === 2) {
      if (typeof args[1] === 'string') {
        this.#_unregister(args[0], args[1], null);
      } else {
        this.#_unregister(args[0], null, args[1]);
      }
    } else {
      this.#_unregister(args[0], args[1], args[2]);
    }
  }

  #_unregister(key = this, eventName, callback) {
    let listenersIterator = this.#listenerMap.values();
    for (let listeners of listenersIterator) {
      for (let listener of listeners.concat()) {
        if (listener.isEqual(key, eventName, callback)) {
          listener.unregister();
        }
      }
    }
  }

  registerListener(listener) {
    let listeners = this.#getListeners(listener.eventName);

    listeners.push(listener);
    listeners.sort((a, b) => b.priority - a.priority);
    this.#listenerMap.set(listener.eventName, listeners);
    return listener;
  }

  unregisterListener(listener){
    let listeners = this.#getListeners(listener.eventName);
    let index = listeners.indexOf(listener);
    if (index < 0) return null;
    listeners.splice(index, 1);
    listener.unregister();
    if (listeners.length < 1) this.#listenerMap.delete(listener.eventName);
    return listener;
  }

  call(...args){
    if (typeof args[0] === 'string') {
      this.#_call(new Event(args[0], args[1]), args[2]);
    } else {
      this.#_call(args[0], args[1]);
    }
  }

  #_call(event, sendTo) {
    let context = event.toContext();
    //  Network.instance.send(context, sendTo);   // ********************************
  }

  trigger(...args) {
    if (args.length === 2) {
      this.#_trigger(new Event(args[0], args[1]));
    } else if (args[0] instanceof Event) {
      return this.#_trigger(args[0]);
    } else {
      return this.#_trigger(new Event(args[0].eventName, args[0].data, args[0].sendFrom));
    }
  }

  #_trigger(event){
    let listeners = this.#getListeners(event.eventName).concat(this.#getListeners('*'));
    for (let listener of listeners) {
      listener.trigger(event);
    }
    return event;
  }

  #getListeners(eventName) {
    return this.#listenerMap.has(eventName) ? this.#listenerMap.get(eventName) : [];
  }

  #initializeNetworkEvent() {
    
    return; // 20230715 takayama   //**********************************************
    
    let callback = Network.instance.callback;

    callback.onOpen = (peerId) => {
      this.trigger('OPEN_NETWORK', { peerId: peerId });
    }
    callback.onClose = (peerId) => {
      this.trigger('CLOSE_NETWORK', { peerId: peerId });
    }

    callback.onConnect = (peerId) => {
      this.#sendSystemMessage('<' + peerId + '> connect <DataConnection>');
      this.trigger('CONNECT_PEER', { peerId: peerId });
    }

    callback.onDisconnect = (peerId) => {
      this.#sendSystemMessage('<' + peerId + '> disconnect <DataConnection>');
      this.trigger('DISCONNECT_PEER', { peerId: peerId });
    }

    callback.onData = (peerId, data) => {  // data: EventContext<never>[]
      for (let event of data) {
        this.trigger(event);
      }
    }

    callback.onError = (peerId, errorType, errorMessage, errorObject) => {
      this.#sendSystemMessage('<' + peerId + '> ' + errorMessage);
      this.trigger('NETWORK_ERROR', { peerId: peerId, errorType: errorType, errorMessage: errorMessage, errorObject: errorObject });
    }
  }

  #sendSystemMessage(message) {
    console.log(message);
  }
}


//   @app\class\core\system\event \ event-system.ts
class GameObjectInventoryService {
  get summarySetting() { return DataSummarySetting.instance; }

  get sortTag() { return this.summarySetting.sortTag; }
  set sortTag(sortTag) { this.summarySetting.sortTag = sortTag; }
  get sortOrder(){ return this.summarySetting.sortOrder; }
  set sortOrder(sortOrder) { this.summarySetting.sortOrder = sortOrder; }
  get dataTag() { return this.summarySetting.dataTag; }
  set dataTag(dataTag) { this.summarySetting.dataTag = dataTag; }
  get dataTags() { return this.summarySetting.dataTags; }

  tableInventory = new ObjectInventory(object => { return object.location.name === 'table'; });
//  commonInventory: ObjectInventory = new ObjectInventory(object => { return !this.#isAnyLocation(object.location.name); });
//  privateInventory: ObjectInventory = new ObjectInventory(object => { return object.location.name === Network.peerId; });
//  graveyardInventory: ObjectInventory = new ObjectInventory(object => { return object.location.name === 'graveyard'; });

  #locationMap = new Map();  // : Map<ObjectIdentifier, LocationName>
  #tagNameMap = new Map();   // : Map<ObjectIdentifier, ElementName> 

  newLineString = '/';   //  readonly 
  newLineDataElement = DataElement.create(this.newLineString);   // readonly 

  constructor() {
    this.initialize();
  }

  initialize() {
    EventSystem.register(this)
      .on('OPEN_NETWORK', event => { this.#refresh(); })
      .on('CONNECT_PEER', event => { this.#refresh(); })
      .on('DISCONNECT_PEER', event => { this.#refresh(); })
      .on('UPDATE_GAME_OBJECT', event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!object) return;

        if (object instanceof GameCharacter) {
          let prevLocation = this.#locationMap.get(object.identifier);
          if (object.location.name !== prevLocation) {
            this.#locationMap.set(object.identifier, object.location.name);
            this.#refresh();
          }
        } else if (object instanceof DataElement) {
          if (!this.#containsInGameCharacter(object)) return;

          let prevName = this.#tagNameMap.get(object.identifier);
          if ((this.dataTags.includes(prevName) || this.dataTags.includes(object.name)) && object.name !== prevName) {
            this.#tagNameMap.set(object.identifier, object.name);
            this.#refreshDataElements();
          }
          if (this.sortTag === object.name) {
            this.#refreshSort();
          }
          if (0 < object.children.length) {
            this.#refreshDataElements();
            this.#refreshSort();
          }
          this.#callInventoryUpdate();
        } else if (object instanceof DataSummarySetting) {
          this.#refreshDataElements();
          this.#refreshSort();
          this.#callInventoryUpdate();
        }
      })
      .on('DELETE_GAME_OBJECT', event => {
        this.#locationMap.delete(event.data.identifier);
        this.#tagNameMap.delete(event.data.identifier);
        this.#refresh();
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        if (event.isSendFromSelf) this.#callInventoryUpdate();
      });
  }

  #containsInGameCharacter(element){
    let parent = element.parent;
    let aliasName = GameCharacter.aliasName;
    while (parent) {
      if (parent.aliasName === aliasName) return true;
      parent = parent.parent;
    }
    return false;
  }

  #refresh() {
    this.#refreshObjects();
    this.#refreshDataElements();
    this.#refreshSort();
    this.#callInventoryUpdate();
  }

  #refreshObjects() {
    this.tableInventory.refreshObjects();
//    this.commonInventory.refreshObjects();
//    this.privateInventory.refreshObjects();
//    this.graveyardInventory.refreshObjects();
  }

  #refreshDataElements() {
    this.tableInventory.refreshDataElements();
//    this.commonInventory.refreshDataElements();
//    this.privateInventory.refreshDataElements();
//    this.graveyardInventory.refreshDataElements();
  }

  #refreshSort() {
    this.tableInventory.refreshSort();
//    this.commonInventory.refreshSort();
//    this.privateInventory.refreshSort();
//    this.graveyardInventory.refreshSort();
  }

  #callInventoryUpdate() {
    EventSystem.trigger('UPDATE_INVENTORY', null);
  }

  #isAnyLocation(location) {
    if (location === 'table' || location === Network.peerId || location === 'graveyard') return true;
    for (let conn of Network.peerContexts) {
      if (conn.isOpen && location === conn.peerId) {
        return true;
      }
    }
    return false;
  }
}

class ObjectInventory {
  newLineString= '/';
  
  #newLineDataElement = DataElement.create(this.newLineString);
  
  get summarySetting() { return DataSummarySetting.instance; }
  get sortTag(){ return this.summarySetting.sortTag; }
  set sortTag(sortTag) { this.summarySetting.sortTag = sortTag; }

  get sortOrder(){ return this.summarySetting.sortOrder; }
  set sortOrder(sortOrder) { this.summarySetting.sortOrder = sortOrder; }

  get dataTag(){ return this.summarySetting.dataTag; }
  set dataTag(dataTag) { this.summarySetting.dataTag = dataTag; }

  get dataTags(){ return this.summarySetting.dataTags; }

  #_tabletopObjects= [];
  get tabletopObjects() {
    if (this.#needsRefreshObjects) {
      this.#_tabletopObjects = this.#searchTabletopObjects();
      this.#needsRefreshObjects = false;
    }
    if (this.#needsSort) {
      this.#_tabletopObjects = this.#sortTabletopObjects(this.#_tabletopObjects);
      this.#needsSort = false;
    }
    return this.#_tabletopObjects;
  }

  get length() {
    if (this.#needsRefreshObjects) {
      this.#_tabletopObjects = this.#searchTabletopObjects();
      this.#needsRefreshObjects = false;
    }
    return this.#_tabletopObjects.length;
  }

  #_dataElementMap = new Map(); // #_dataElementMap: Map<ObjectIdentifier, DataElement[]>
  get dataElementMap() {
    if (this.#needsRefreshElements) {
      this.#_dataElementMap.clear();
      let caches = this.tabletopObjects;
      for (let object of caches) {
        if (!object.rootDataElement) continue;
        let elements = this.dataTags.map(tag => tag === this.newLineString ? this.#newLineDataElement : object.rootDataElement.getFirstElementByName(tag));
        this.#_dataElementMap.set(object.identifier, elements);
      }
      this.#needsRefreshElements = false;
    }
    return this.#_dataElementMap;
  }

  #needsRefreshObjects = true;
  #needsRefreshElements = true;
  #needsSort = true;

  constructor(   // readonly classifier: (object) => boolean  // object: TabletopObject
    classifier
  ) { } 

  refreshObjects() {
    this.#needsRefreshObjects = true;
  }

  refreshDataElements() {
    this.#needsRefreshElements = true;
  }

  refreshSort() {
    this.#needsSort = true;
  }

  #searchTabletopObjects() {  // #searchTabletopObjects(): TabletopObject[] 
    let objects = ObjectStore.instance.getObjects(GameCharacter);
    let caches= []; // : TabletopObject[] 
    for (let object of objects) {
      if (this.classifier(object)) caches.push(object);
    }
    return caches;
  }

  #sortTabletopObjects(objects) {  // objects: TabletopObject[]
    let sortTag = this.sortTag.length ? this.sortTag.trim() : '';
    let sortOrder = this.sortOrder === 'ASC' ? -1 : 1;
    if (sortTag.length < 1) return objects;

    objects.sort((a, b) => {
      let aElm = a.rootDataElement?.getFirstElementByName(sortTag);
      let bElm = b.rootDataElement?.getFirstElementByName(sortTag);
      if (!aElm && !bElm) return 0;
      if (!bElm) return -1;
      if (!aElm) return 1;

      let aValue = this.#convertToSortableValue(aElm);
      let bValue = this.#convertToSortableValue(bElm);
      if (aValue < bValue) return sortOrder;
      if (aValue > bValue) return sortOrder * -1;
      return 0;
    });
    return objects;
  }

  #convertToSortableValue(dataElement) {
    let value = dataElement.isNumberResource ? dataElement.currentValue : dataElement.value;
    let resultStr = StringUtil.toHalfWidth((value + '').trim());
    let resultNum = +resultStr;
    return Number.isNaN(resultNum) ? resultStr : resultNum;
  }
}


class ObjectInventory_tabletopClass { // 20230723 takayama
  #_tabletopObjects= [];
  #_ObjectsIndex1= {};

  constructor(   // readonly classifier: (object) => boolean  // object: TabletopObject
    classifier
  ) { } 

  get tabletopObjects() {
    return this.#_tabletopObjects;
  }

  get ObjectsIndex1() {
    return this.#_ObjectsIndex1;
  }
  
  get length() {
    return this.#_tabletopObjects.length;
  }

  add(obj,strIndex=""){
      if(strIndex){
          const keys = Object.keys(this.#_ObjectsIndex1);
          if(keys.indexOf(strIndex)>=0){
              return 1;
          }
      }
      let testGameCharaId = (!obj ? null : !obj.context ? null : obj.context.identifier);
      if(testGameCharaId){
          let flg=0;
          for(let i=this.#_tabletopObjects.length-1;i>=0;i--){
              let cmpid = (!this.#_tabletopObjects[i] ? null : !this.#_tabletopObjects[i].context ? null : this.#_tabletopObjects[i].context.identifier);
              if(cmpid == testGameCharaId){flg=1;break;}
          }
          if(flg) return 1;
      }
      
      // ---add---
      const newlength = this.#_tabletopObjects.push(obj);
      if(strIndex){
          this.#_ObjectsIndex1[strIndex] = newlength-1;
      }
      return 0;
  }
  
  searchById(strid){
      if(!this.#_tabletopObjects) return null;
      
      let ans=[];
      this.#_tabletopObjects.forEach( function(element, index, array){
          if(element.identifier){
              if(element.identifier == strid){
                  ans.push(index);
              }
          }
      });
      return ans;
  }
  searchByIndex1(strid){
      if(!this.#_tabletopObjects) return null;
      if(!this.#_ObjectsIndex1) return null;
      
      return this.#_ObjectsIndex1[strid];
  }

}
let ObjectInventory_tabletop = new ObjectInventory_tabletopClass;











// ====================================================================================
let WTCobj;
let cds;


function start_thisWindowTask(){
    console.log("A");
    
    HtmlElement_TableTheWorld = createTableTheWorld();
    if(!HtmlElement_TableTheWorld){  return 0;  }
    const wtc = new WorldTableComponent(HtmlElement_TableTheWorld); // 回転世界を設定
    wtc.initializeTableMouseGesture();
    wtc.setTransform(0,0,0);
    
    WTCobj = wtc;
    //cds = new CoordinateService;
    //cds = new classTransform(HtmlElement_TableTheWorld);
    
    let ImageStorageInstance = ImageStorage.instance;
    
    
    
    // -------Table を用意する------
    HtmlElement_MainTable = document.getElementById(HtmlElemId_MainTableDiv);
    if(!HtmlElement_MainTable){
        console.log("[Error] Not found Elements["+HtmlElemId_MainTableDiv+"] in Html." );
        return 0;
    }
    
    
    // -------Mouseイベント を作成する------
    console.log("B");
    function setFileDandDListener(){
        const tgtelem=document.body;
        if(tgtelem){
            tgtelem.addEventListener("dragenter", function(e){
                e.stopPropagation(); e.preventDefault(); }, false);
            tgtelem.addEventListener("dragover", function(e){
                e.stopPropagation(); e.preventDefault(); }, false);
            tgtelem.addEventListener("drop", function(e){
                e.stopPropagation(); e.preventDefault(); 
                const dt = e.dataTransfer;
                const files = dt.files;
                
                getDandDFiles(files);
                
            }, false);
            
            if(debug_infolevel>10){
              tgtelem.addEventListener("click", function(e){
                let tgtelem=document.getElementById(HtmlElemId_MainTableDiv);
                const dogsStyle = window.getComputedStyle(tgtelem);
                const dogsTransform = dogsStyle.getPropertyValue('transform');
                console.log("test for debug : " + dogsTransform);
                let dmy=0;
              }, false);
            }
        }
    }
    //let tgtelem=document.getElementById("myimg_temporaly");
    //if(!tgtelem){
    //    const strtg=`<img id="myimg_temporaly" />`; //  height="300px"
    //    HtmlElement_TableTheWorld.insertAdjacentHTML('afterend', strtg);
    //}
    
    
    setFileDandDListener();
    
    
    
    
    // ---マウス移動の追跡 ---
    //document.body.addEventListener('mousemove', traceMouseAction("mousemove") );
    
    if(1==1){
        let baseElem=document.getElementById("forControll");
        if(baseElem){
            traceMouseAction.setControlBtn(baseElem);
            //traceMouseAction.setMode(0);
        }
    }
    
    
    // ---テーブル画像の設定 ---
    let mypromise=getReplyWinMessage("requestTableImageId","requestedTableImageId","",5000);
    if(mypromise){
        (async function(){
            const msgData = await mypromise;
            if(msgData){
                TableImage_identifier = msgData.data;
                messageFunc_setTableImage(msgData.from,TableImage_identifier);
            }
        })();
    }
    
    
    // -------Canvas を作成する------
    console.log("C");
    if(1==2){
        const canvasElem01 = createCanvasElement(null,"yellow");
        if(!canvasElem01){ return 0; }
        const canvasContext01 = canvasElem01.getContext("2d");//2次元描画
        //canvasContext.transform(1, 0.1, 0, 1, 50, 50);
        
        var image = new Image();
        image.src = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
        image.addEventListener('load', function() {
            canvasContext01.drawImage(image, 0, 0, 150, 100);
        }, false);
        canvasContext01.strokeRect(220,20,250,50);
    }
    
    // ---- ダイスを配置 ----
    console.log("D");
    if(1==2){
        setTimeout( function(){
            let elmDice = createDiceElement("",-50,-100,200);
            elmDice.addEventListener('click', dicedice);
        } ,3000);
        
        setTimeout( function(){
            const diceObj = new TabletopObject;
            diceObj.createDataElements();   // objectStoreに登録
            
            const pelem=diceObj.rootDataElement;
            
            const dice01 = new DataElement()
            
            pelem.appendChild(dice01);
            //src="./img/dice_d6_01.png"
        } ,6000);
    }
    

    // -----クリップボード-----
    console.log("E");
    if(1==1){
        let baseElem=document.getElementById("forControll");
        if(baseElem){
            getImageFromClipboard.setControlBtn(baseElem);
        }
    }







    // -test--
    console.log("F");



    
    // ---- Btn ----
    console.log("Y");
    if(1==2){
        let baseElem=document.getElementById("forTest");
        if(baseElem){
            let strElm="";
            strElm +=`<input type="button" id="button_test01" value="test01" />`;
            baseElem.insertAdjacentHTML('beforeend', strElm);
            //--
            let tgtElem=document.getElementById("button_test01");
            if(tgtElem){
                tgtElem.addEventListener('click', function(){

                    let character = GameCharacter.create('サイコロ', 1, '');
                    
                    character.location.x = -25;  //  position.x - 25;
                    character.location.y = -25;  // position.y - 25;
                    character.posZ = 10; // position.z;

                    character.createDOM(50);
                    character.appendDOM_image(50, "translateZ( 23px) rotateZ(0deg)" , "./img/dice_d6_01.png");
                    character.appendDOM_image(50, "translateZ(-23px) rotateX(180deg) " , "./img/dice_d6_06.png");
                    character.appendDOM_image(50, "translateX( 23px) rotateY( 90deg) " , "./img/dice_d6_03.png");
                    character.appendDOM_image(50, "translateX(-23px) rotateY(-90deg) " , "./img/dice_d6_04.png");
                    character.appendDOM_image(50, "translateY( 23px) rotateX(-90deg) " , "./img/dice_d6_02.png");
                    character.appendDOM_image(50, "translateY(-23px) rotateX( 90deg) " , "./img/dice_d6_05.png");
                    
                    //---
                    
                    const animeElem = myGetElementByName( character.getDomElement , "setup-animate");
                    if(animeElem){ 
                        let keyframes = {transform:["rotateX(0deg)","rotateX(360deg)"]};
                        let options = {  duration: 5000, easing:"linear" , iterations: Infinity };
                        
                        animeElem.animate(keyframes , options);
                        
                        
                        keyframes = {transform:["rotate3d(2,1,1,0deg)","rotate3d(2,1,1,360deg)"]};
                        options = {  duration: 5000, easing:"linear" , iterations: Infinity };
                        setTimeout( function(){animeElem.animate(keyframes , options);},5000);
                    }
                    
                    
                    
                    //---
                    return character;
                });
            }
        }
    }
    
    if(1==2){
        let baseElem=document.getElementById("forTest");
        if(baseElem){
            let strElm="";
            strElm +=`<input type="button" id="button_test02" value="test02" />`;
            baseElem.insertAdjacentHTML('beforeend', strElm);
            //--
            let tgtElem=document.getElementById("button_test02");
            if(tgtElem){
                tgtElem.addEventListener('click', function(){

                    let character = GameCharacter.create('新しいキャラクター', 1, '');
                    //testGameCharaId = character.context.identifier;
                    
                    character.location.x = 0;  //  position.x - 25;
                    character.location.y = 0;  // position.y - 25;
                    character.posZ = 0; // position.z;
                    
                    character.createDOM(50);
                    character.appendDOM_image(50, "translateZ(-2px)" , "./img/dice_d6_01.png");
                    
                    
                    
                });
            }
        }
    }
    
    
    
    if(1==2){
        let baseElem=document.getElementById("forTest");
        if(baseElem){
            let strElm="";
            strElm +=`<input type="button" id="button_test10" value="test10" />`;
            baseElem.insertAdjacentHTML('beforeend', strElm);
            let tgtElem=document.getElementById("button_test10");
            if(tgtElem){
                tgtElem.addEventListener('click', function(){
                    //-----------
                    if(tgtElem.value=="restart"){
                        tgtElem.value="stop";
                        document.body.addEventListener('mousemove', traceMouseAction.onMouseMove );
                    }else{
                        tgtElem.value="restart";
                        document.body.removeEventListener('mousemove', traceMouseAction.onMouseMove );
                    }
                });
            }
        }
    }
    
    // ---- END ----
    console.log("Z");
}


const repaint = async () => {
    for (let i = 0; i < 2; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
};



class GameCharacter extends TabletopObject {
  //@SyncVar() rotate: number = 0;
  //@SyncVar() roll: number = 0;

  #domElementId="";  // 20230722 takayama ここから
  get getDomElement(){   
    if(this.#domElementId) {
        return document.getElementById(this.#domElementId);
    }
    return null;
  }                  // 20230722 takayama ここまで
  
  constructor( strId ){
      super(); // 親の呼び出し
      ObjectInventory_tabletop.add(this,strId);
  }
  
  get name(){ return this.getCommonValue('name', ''); }
  get size(){ return this.getCommonValue('size', 1); }

  get chatPalette(){   //  : ChatPalette 
    for (let child of this.children) {
      if (child instanceof ChatPalette) return child;
    }
    return null;
  }

  static create(name, size, imageIdentifier ,strId){ // : GameCharacter 
    let gameCharacter = new GameCharacter(strId);
    gameCharacter.createDataElements();
    gameCharacter.initialize();
    gameCharacter.createInitGameDataElement(name, size, imageIdentifier);

    return gameCharacter;
  }

  createInitGameDataElement(name, size, imageIdentifier) {
    //this.createDataElements();


    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }
    

    let nameElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement = DataElement.create('size', size, {}, 'size_' + this.identifier);

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);

    let resourceElement = DataElement.create('リソース', '', {}, 'リソース' + this.identifier);
    let hpElement = DataElement.create('HP', 200, { 'type': 'numberResource', 'currentValue': '200' }, 'HP_' + this.identifier);
    let mpElement = DataElement.create('MP', 100, { 'type': 'numberResource', 'currentValue': '100' }, 'MP_' + this.identifier);

    this.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(hpElement);
    resourceElement.appendChild(mpElement);

    //TEST
    let testElement = DataElement.create('情報', '', {}, '情報' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('説明', 'ここに説明を書く\nあいうえお', { 'type': 'note' }, '説明' + this.identifier));
    testElement.appendChild(DataElement.create('メモ', '任意の文字列\n１\n２\n３\n４\n５', { 'type': 'note' }, 'メモ' + this.identifier));


    //let domParser = new DOMParser();
    //let gameCharacterXMLDocument = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    //let palette = new ChatPalette('ChatPalette_' + this.identifier);
    //palette.setPalette(`チャットパレット入力例：`);
    //palette.initialize();
    //this.appendChild(palette);
  }



  createDOM(intCharSize=50, imageIdentifier){  // 20230722 takayama ここから
    const myId = this.context.identifier;
    if(!myId){return ull;}
    
    if(!HtmlElement_MainTable) return null;
    
    if(this.#domElementId){ return this.getDomElement; }
    
    //------
    const testGameCharaId = myId;
    
    //const centerbaseStyle= `top:50%;left:50%; width:100%;height:100%; transform:translate(-50%, -50%)`; // position:absolute;
    const centerbaseStyle= `width:100%;height:100%;`; // position:absolute;    
    
       let strCharElm1=""; // <game-character>
       let strCharElm2="";
       
       strCharElm1+=`<game-character id="${testGameCharaId}">`;
       strCharElm2+="</game-character>";
       
       //----
       strCharElm1 +=`<div name="setup-position" class="is-3d is-grab is-pointer-events-none is-centerBase"`; 
       strCharElm2 = `</div>`+strCharElm2; 
       strCharElm1 +=` style="width:1px;height:1px; transform:translateZ(1px) translate3d(0px, 0px, 0px);`;
       strCharElm1 +=` transition: all 100ms 0s ease;`;
       strCharElm1 +=`">`;


       strCharElm1 +=`<button name="setup-event" class="is-3d is-centerBase" style="pointer-events:auto;`;
       strCharElm1 +=` background:transparent; border-color:transparent; opacity:0.5; `;
       strCharElm1 +=` width:${intCharSize}px; height:${intCharSize}px; transform:translate(-50%, -50%);`;
       strCharElm1 +=`">`;
       strCharElm1 += `</button>`;  
       
       strCharElm1 +=`<div class="is-3d is-centerBase" style="`;
       strCharElm1 +=` width:${intCharSize}px; height:${intCharSize}px; transform:translate(-50%, -50%);`;
       strCharElm1 +=`">`;
       strCharElm2 = `</div>`+strCharElm2; 

       strCharElm1 +=`<div  name="setup-rotate" class="is-3d is-grab is-pointer-events-none"`; // class="component"
       strCharElm2 = `</div>`+strCharElm2; 
       strCharElm1 +=` style="${centerbaseStyle}`; //   position: absolute; width:${intCharSize}px;height:${intCharSize}px;
       strCharElm1 +=` transform:rotateX(0deg) rotateY(0deg);`;
       strCharElm1 +=` transition: all 100ms 0s ease;`;
       strCharElm1 +=`">`;
       strCharElm1 +=`<div name="setup-animate" class="is-3d" style="width:${intCharSize}px;height:${intCharSize}px;">`;
       strCharElm2 = `</div>`+strCharElm2; 
       
       strCharElm1 +=`<div class="is-3d" bounceInOut="'in'" style="${centerbaseStyle};">`; // class="component-content" 
       strCharElm2 = `</div>`+strCharElm2;
       strCharElm1 +=`<div class="is-3d is-pointer-events-auto" appRotable style="${centerbaseStyle};">`; // class="component-content" 
       strCharElm2 = `</div>`+strCharElm2;
       
       strCharElm1 +=`<div class="pedestal-inner"></div> <div class="pedestal-outer"></div>`;
       
       //---- message plate
       strCharElm1 +=`<div class="is-3d is-centerBase pedestal-grab rotate-grab"><div class="pedestal-grab-border">`;
       strCharElm1 +=`<div name="setup-msgplates" class="is-3d is-centerBase">`;
       
       //strCharElm1 +=`<div class="material-icons of-back" style="position: absolute; backface-visibility: hidden; transform:rotateZ(18deg) translateX(10px);">`;
       //strCharElm1 +=`Hellp!</div>`;
       
       strCharElm1 +=`</div></div></div>`;
       
       //--- image ---
       strCharElm1 +=`<div class="upright-transform is-fit-width is-3d is-centerBase">`;
       strCharElm2 = `</div>`+strCharElm2;
       strCharElm1 +=`<div class="rotate-frame is-3d" style="${centerbaseStyle} transform:rotateX(0deg);">`;
       strCharElm2 = `</div>`+strCharElm2;
       strCharElm1 +=`<div class="is-3d is-centerBase" >`; // style="animation: rotateW 10s linear infinite;"
       strCharElm2 = `</div>`+strCharElm2;
       strCharElm1 +=`<div name="setup-images" class="is-3d is-centerBase">`;
       strCharElm2 = `</div>`+strCharElm2;
       
       let testimgtag = `<div class="is-centerBase is-3d" style="width:100%;height:100%; transform:translateZ(${intCharSize/2-2}px)">`;
       testimgtag += `<img class="image chrome-smooth-image-trick is-centerBase" style="width: ${intCharSize}px; height: ${intCharSize}px;"`;
       testimgtag += ` src="" alt="">`;
       testimgtag += `</div>`;
       //strCharElm1 += testimgtag;
       
       //---
       
       
       HtmlElement_MainTable.insertAdjacentHTML('beforeend', strCharElm1+strCharElm2 );
       this.#domElementId = testGameCharaId;
       return this.getDomElement;
       
  }
  appendDOM_image(intCharSize=50, strTransform , imageIdentifier){
    const topElem = this.getDomElement;
    const parentElem = myGetElementByName( topElem , "setup-images");
    if(parentElem){
        let imageurl=imageIdentifier;
        const ImageList=ImageStorage.instance.images;
        if(imageIdentifier in ImageList){
            imageurl = ImageList[imageIdentifier].url;
        }
        
        let testimgtag = `<div class="is-3d is-centerBase">`;
        if(1==1){
          testimgtag += `<div class="is-3d" `;  // top:0px left:0px;
          testimgtag += ` style="width:${intCharSize}px;height:${intCharSize}px;`;
          testimgtag += ` transform:perspective(${cameraPositionZ}px) ${strTransform};">`;
          testimgtag += `<img style="display:inline-block; width: ${intCharSize}px; height: ${intCharSize}px;"`;
          testimgtag += ` src="${imageurl}">`;
          testimgtag += `</div>`;
        }else{
          testimgtag += `<img class="is-centerBase" style="width: ${intCharSize}px; height: ${intCharSize}px; display: inline-block;`;
          testimgtag += ` transform:translate(-50%, -50%) ${strTransform};"`;
          testimgtag += ` src="${imageurl}">`;
        }
        testimgtag += `</div>`;
        
        parentElem.insertAdjacentHTML('beforeend', testimgtag );
    }
  }
  
  
  
  updateDOM(){
      if(!this.getDomElement) return null;
      const thisElem = this.getDomElement;
      
      let testelemPos = myGetElementByName(thisElem,"setup-position");
      if(testelemPos){
          myReplaceTransform(testelemPos,"translate3d" , `${this.location.x}px, ${this.location.y}px, ${this.posZ}px` );
      }
      
      let testelemRot =  myGetElementByName(testelemPos,"setup-rotate");
      if(testelemRot){
          //testelemRot.style.rotateZ ="30deg";
      }
      
      if(this.visibility){
          thisElem.style.visibility = this.visibility;
      }
      
  }                       // 20230722 takayama ここまで
  
  
  sendMessage(){
        //const baseMatrix = {m11:1,m12:0,m13:0,m14:0,m21:0,m22:1,m23:0,m24:0,m31:0,m32:0,m33:1,m34:0,m41:0,m42:0,m43:0,m44:1};
                     //  m41=translateX, m42=translateY, m43=translateZ
        let paramMatrixAry = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        paramMatrixAry[12]= this.location.x; // m41  // locaton の定義場所は TabletopObject
        paramMatrixAry[13]= this.location.y; // m42
        paramMatrixAry[14]= this.posZ;       // m43
        //let testMatrix = new DOMMatrix(paramMatrixAry);
        
        let sendData = {};
        sendData.quaternion=paramMatrixAry;
        sendData.visibility=this.visibility;
        mypostWinMessageChannel(winMessageChannelPort , "tabletopObjectInfo" , sendData );
        
  }
  
  
  static searchObjectByKey(strUserId){  // takayama追加 20230730
        let pointerObj = ObjectInventory_tabletop.searchById(strUserId)
        if(pointerObj && pointerObj.length>0){ pointerObj = pointerObj[0]; }
        
        if(!pointerObj || pointerObj.length==0){
            pointerObj=null;
            let indxNum = ObjectInventory_tabletop.searchByIndex1(strUserId);
            if(typeof indxNum =="number"){if(indxNum>=0){
                const ttObjs = ObjectInventory_tabletop.tabletopObjects;
                if(ttObjs){
                    pointerObj = ttObjs[indxNum];
                }
            }}
        }
        
        return pointerObj;
  }
  
}

// 20230722 takayama ここから
function myGetElementByName(elem,strName,strTag="div",childOnly=false){ // 最初に見つけた要素1つを返す
    let children;
    if(childOnly){
        children = elem.childNodes; //直下の子要素のみ検索
    }else{
        children = elem.getElementsByTagName(strTag);  //配下の全要素を検索
    }
    for (let i=0; i< children.length; i++) {
        if(children[i].nodeType == 1) { //タグ要素のみ実行
            if(children[i].attributes.name){
                if(children[i].attributes.name.nodeValue == strName) { 
                    return children[i];
                }
            }
        }
    }
    return null;
}
function myReplaceTransform(elem,tgtname,tgtvalue){
    let orgTransform = elem.style.transform;
    let posStart= orgTransform.indexOf(tgtname+"(");
    let newvl ="";
    if(posStart>=0){
        let posEnd= orgTransform.indexOf(")",posStart);
        newvl = orgTransform.substring(0,posStart)+" "+tgtname+"("+tgtvalue+")";
        newvl += orgTransform.substring(posEnd+1);
    }else{
        newvl = orgTransform + " "+tgtname+"("+tgtvalue+")";
    }
    elem.style.transform = newvl;
}
// 20230722 takayama ここまで





function dicedice(ev){
    this.removeEventListener('click', dicedice);
    
        let ary = this.style.transform.split(" ");
        let tgtnum=-1;
        let nowval=0;
        for(let i=0;i<ary.length;i++){
            if( ary[i].substring(0,8) == "rotateX("){
              tgtnum=i;
            }
        }
        if(tgtnum>=0){
            let target = Math.random() * 360;
            diceRole(this,tgtnum,"rotateX(","deg)",nowval,target,360,3000);
        }
}
function diceRole(tgtelem,transformNo,strstt,strend,nowval,target,span,speedPerSec){
    const interval=0.2; // per second
    const speed0 = speedPerSec * interval;
    let speed;
    if(speedPerSec>0){
        speed=(speed0>10 ? speed0 : 10);
        if(speed<(span/3)){ if (nowval+speed>target) speed = 0; }
    }else{
        speed=(speed0<-10 ? speed0 : -10);
        if(0-speed<(span/3)){ if (nowval+speed<target) speed = 0; }
    }
    let newval;
    if(speed==0){
        newval = target
    }else{
        newval = nowval+speed;
    }
    
    newval=Math.floor(newval);
    let ary = tgtelem.style.transform.split(" ");
    ary[transformNo] = strstt+ newval.toString() +strend;
    tgtelem.style.transform = ary.join(" ");

    if(speed!=0){
        speed = speed*0.9;
        setTimeout( function(){
            diceRole(tgtelem,transformNo,strstt,strend,newval,target,span,speed)
        } ,1000*interval );
    }else{
        tgtelem.addEventListener('click', dicedice);
    }
}


//  ---- D&D
async function getDandDFiles(files){
    let cnt=0;
    let tgtfile=null;
    for (file of files) {
        if (!file.type.startsWith('image/')){ continue }
        
        cnt++;
        tgtfile = file;
    }
    if(cnt<=0){
        alert("画像ファイルだと認識できませんでした。");
        return;
    }
    if(cnt>1){
        alert("画像ファイルは1つづつ入力してください。");
        return;
    }
    
    
    // ---
    let dmy00="";
    if(tgtfile instanceof Blob){
        dmy00 = await FileReaderUtil.calcSHA256Async(tgtfile);
    }
    
    // -------------------------------------------------------
    //const uid = UUID.generateUuid();
    
    let ImageStorageInstance=ImageStorage.instance;
    
    //重複確認
    let imageSt;
       //let imageSt = ImageStorageInstance.get(URL.createObjectURL(tgtfile))
       // createObjectURL は同じ内容でもべつのURLが生成されていまう。
    const hashId = await FileReaderUtil.calcSHA256Async(tgtfile); // tgtfile はBlog
    const storedImgs = ImageStorageInstance.images;
    for(let key in storedImgs){
        if(storedImgs[key].context){if(storedImgs[key].context.identifier == hashId ){
            imageSt = storedImgs[key];   // ImageStorage既存のデータを使用
        }}
    }
    if (!imageSt) { // 新規に追加登録
        //imageSt = ImageStorageInstance.add(URL.createObjectURL(tgtfile));
        if(1==1){ // サムネイル作成しない場合
            const newimg={};
            newimg.identifier = hashId;
            newimg.thumbnail={};
            newimg.blob = tgtfile;
            newimg.name = tgtfile.name;
            imageSt = ImageFile.create(newimg);
        }else{
            imageSt = await ImageFile.createAsync(tgtfile); // ImageFileクラスを作成
        }
        ImageStorageInstance.add(imageSt); // ImageStorageに追加登録
    }

        //    diceSymbol.imageDataElement.getFirstElementByName(face).value = imageSt.identifier;
        //let imageFile = new ImageFile();
        //imageFile.context.identifier = await FileReaderUtil.calcSHA256Async(arrayBuffer);
        //imageFile.context.name = name;
        //imageFile.context.blob = new Blob([arrayBuffer], { type: blob.type });
        //imageFile.context.url = window.URL.createObjectURL(imageFile.context.blob);

    
    
    if(1==2){
        let tgtElem;
        tgtElem = document.getElementById(HtmlElemId_MainTableImg);
        if(tgtElem){
            if(tgtElem.tagName=="IMG"){
                    const bairitu=1;
                    if(bairitu!=1){
                        const strUrl = URL.createObjectURL(tgtfile);
                        const tgtsize=await getImageSizeFromUrl(strUrl);
                        if(tgtsize && tgtsize.width && tgtsize.height){
                            tgtElem.setAttribute('width' , (tgtsize.width *bairitu).toString()+"px" );
                            tgtElem.setAttribute('height', (tgtsize.height*bairitu).toString()+"px" );
                        }
                    }
                    tgtElem.src= imageSt.url;  // = URL.createObjectURL(tgtfile);
                    
                    
            }
        }
    }
    
    mypostWinMessageChannel(winMessageChannelPort , "setTableImage" , imageSt.identifier );
    TableImage_identifier = imageSt.identifier;
    
    // ----------------------test--------------------
    //    var image = new Image();
    //    image.src = URL.createObjectURL(tgtfile);
    
    
    if(1==2){
        let test = new TabletopObject;
        test.createDataElements();
        test.setImageFile("aaa", imageSt);
    }
    
    
    if(1==2){
        let tgtElem;
        //tgtElem = HtmlElement_MainTable;
        
        tgtElem = document.getElementById(HtmlElemId_MainTableImg);
        
        if(!tgtElem){
            tgtElem=createCanvasElement(null,"yellow");
        }
        if(!tgtElem){
            
            switch (tgtElem.tagName){
              case 'CANVAS':
                const canvasContext = tgtElem.getContext("2d");
                if(canvasContext){
                    canvasContext.clearRect(0, 0, 150, 100);
                    
                    //let image = ImageStorageInstance.add( URL.createObjectURL(tgtfile) );
                    let image = new Image();
                    image.addEventListener('load', function() {
                        canvasContext.drawImage(image, 0, 0, 150, 100);
                    }, false);
                    image.src = URL.createObjectURL(tgtfile);
                    
                }
                break;
              case 'DIV':
                tgtElem.style.backgroundImage = "url( "+ URL.createObjectURL(tgtfile) +" )";
                break;
              case 'IMG':
                const bairitu=1;
                if(bairitu!=1){
                    const strUrl = URL.createObjectURL(tgtfile);
                    const tgtsize=await getImageSizeFromUrl(strUrl);
                    if(tgtsize && tgtsize.width && tgtsize.height){
                        tgtElem.setAttribute('width' , (tgtsize.width *bairitu).toString()+"px" );
                        tgtElem.setAttribute('height', (tgtsize.height*bairitu).toString()+"px" );
                    }
                }
                tgtElem.src= URL.createObjectURL(tgtfile);
                break;
            }
            
        }
        
    }
    
    

    
    let dummy=0;
    
    
}
function getImageSizeFromUrl(strUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function(){
        const size = {
            width: img.naturalWidth,
            height: img.naturalHeight,
        };
        URL.revokeObjectURL(img.src);
        resolve(size);
    };
    img.onerror = function(error){
      reject(error);
    };
    img.src = strUrl;
  });
}

async function convertUrlToBlob(dataUrl) { 
  return await (await fetch(dataUrl)).blob();
}
async function convertUrlToBlob_x(strurl){
    const blob_img = await convertUrlToBlob(strurl);
    
    let test = ImageFile.createAsync(blob_img);
    
}



function createTableTheWorld(){
    // -------Tableを作成する------
    const elemTable = document.getElementById(HtmlElemId_theWorldDiv);
    if(!elemTable){
        console.log("[Error] Not found Elements["+HtmlElemId_theWorldDiv+"] in Html." );
        return 0;
    }
    
    return elemTable;
}





// ===================以下、テスト用====================

function createCanvasElement(strid,strBGColor="blue"){
    if(!HtmlElement_MainTable){  return 0;  }
    // -------Canvas を作成する------
    let strNewElemId = createUniqueElementId("myCanvas");
    
    const strCanvasHtml=`<canvas id="${strNewElemId}" class="is-centerBase" style="background-color:${strBGColor}; z-index:1;">`
                     +`ERROR:キャンバスがサポートされていないブラウザです</canvas>`;
    HtmlElement_MainTable.insertAdjacentHTML('beforeend', strCanvasHtml);
    const elemCanvas = document.getElementById(strNewElemId);
    if(!elemCanvas){
        console.log("[Error] fault to create Elements["+strNewElemId+"] in Html." );
        return 0;
    }
    // キャンバスの描画サイズをでセット(HTMLのwidth,height)
    elemCanvas.setAttribute( "width" , 500 );
    elemCanvas.setAttribute( "height" , 500 );
    // キャンバスの表示サイズをセット
    elemCanvas.style.width = "300px";
    elemCanvas.style.height = "300px";
    
    if (!elemCanvas.getContext) {
        console.log("[Error] fault to create CanvasContext." );
        return 0;
    }
    return elemCanvas; 
}
function createUniqueElementId(strid){
    // -------ID を作成する------
    if(!strid) strid="myElement";
    let num=0; const baseid=strid;
    let dmy=document.getElementById(strid);
    while (dmy){
        num++;
        strid=baseid+"_"+num.toString();
        dmy = document.getElementById(strid);
    }
    return strid;
}

// ---------- Dice
function createDiceElement(strid="myDice",posx=0,posy=0,posz=0){
    if(!HtmlElement_MainTable){  return null;  }
    // -------ID を作成する------
    const strNewElemId = createUniqueElementId(strid);

    //----
    let strDiceElem1 ="<dice-symbol>";
    let strDiceElem2 ="</dice-symbol>";
    
    strDiceElem1 += `<div id="${strNewElemId}" class="is-3d is-centerBase"`;
    strDiceElem1 += ` style="transition: transform 132ms linear 0s; z-index:${posz};`;
    strDiceElem1 += ` transform: perspective(1000px) translateZ(${posz}px) translateY(${posy}px) translateX(${posx}px) rotateY(-45deg) rotateX(20deg) rotateZ(30deg);">`;
    strDiceElem2 = "</div>"+strDiceElem2;
    
    strDiceElem1 += `<div class="is-3d">`;
    strDiceElem2 = "</div>"+strDiceElem2;
    
    const platesize=50;
    const platestyle= `width: ${platesize}px; height: ${platesize}px;`;
    const platelength=`${platesize/2-2}`
    
    strDiceElem1 += `<div class="is-3d" dicenum="1">`;
    strDiceElem1 += `<div class="is-3d is-centerBase" style="transform: translateX(${platelength}px) rotateY(90deg);">`;
    strDiceElem1 += `<img src="./img/dice_d6_01.png" class="is-centerBase" style="${platestyle}">`;
    strDiceElem1 += "</div></div>";
    
    strDiceElem1 += `<div class="is-3d" dicenum="6">`;
    strDiceElem1 += `<div class="is-3d is-centerBase" style="transform: translateX(-${platelength}px) rotateY(-90deg);">`;
    strDiceElem1 += `<img src="./img/dice_d6_06.png" class="is-centerBase" style="${platestyle}">`;
    strDiceElem1 += "</div></div>";
    
    strDiceElem1 += `<div class="is-3d" dicenum="2">`;
    strDiceElem1 += `<div class="is-3d is-centerBase" style="transform: translateY(${platelength}px) rotateX(-90deg);">`;
    strDiceElem1 += `<img src="./img/dice_d6_02.png" class="is-centerBase" style="${platestyle}">`;
    strDiceElem1 += "</div></div>";
    
    strDiceElem1 += `<div class="is-3d" dicenum="5">`;
    strDiceElem1 += `<div class="is-3d is-centerBase" style="transform: translateY(-${platelength}px) rotateX(90deg);">`;
    strDiceElem1 += `<img src="./img/dice_d6_05.png" class="is-centerBase" style="${platestyle}">`;
    strDiceElem1 += "</div></div>";
    
    strDiceElem1 += `<div class="is-3d" dicenum="4">`;
    strDiceElem1 += `<div class="is-3d is-centerBase" style="transform: translateZ(${platelength}px) rotateX(0deg);">`;
    strDiceElem1 += `<img src="./img/dice_d6_04.png" class="is-centerBase" style="${platestyle}">`;
    strDiceElem1 += "</div></div>";
    strDiceElem1 += `<div class="is-3d" dicenum="3">`;
    strDiceElem1 += `<div class="is-3d is-centerBase" style="transform: translateZ(-${platelength}px) rotateX(180deg);">`;
    strDiceElem1 += `<img src="./img/dice_d6_03.png" class="is-centerBase" style="${platestyle}">`;
    strDiceElem1 += "</div></div>";

    
    
    HtmlElement_MainTable.insertAdjacentHTML('beforeend', (strDiceElem1+strDiceElem2) );
    
    const elemDice = document.getElementById(strNewElemId);
    if(!elemDice){
        console.log("[Error] fault to create Elements["+strNewElemId+"] in Html." );
        return 0;
    }
    
    return elemDice; 
}

function createImageElement(strId){
    if(!HtmlElement_TableTheWorld){  return 0;  }
    // -------Image を作成する------
    const strNewElemId = createUniqueElementId(strId);
    
    const strHtml=`<img id="${strNewElemId}" class="is-centerBase" style="z-index:1;" src="" alt="">`;
    
    HtmlElement_TableTheWorld.insertAdjacentHTML('beforeend', strHtml);
    const elemObj = document.getElementById(strNewElemId);
    if(!elemObj){
        console.log("[Error] fault to create Elements["+strNewElemId+"] in Html." );
        return 0;
    }
    
    return elemObj; 
}



function getCenterPositionOfElement(elem){
    let ans = {x:0,y:0};
    if(elem){
        const dspArea = document.getElementById(HtmlElemId_displayAreaDiv);
        
        // 要素の画面上の位置を取得
        let clientRect = elem.getBoundingClientRect() ;
        let positionX = window.pageXOffset + (( clientRect.left + clientRect.right)/2);
        let positionY = window.pageYOffset + (( clientRect.top + clientRect.bottom)/2);
        
        ans.x=positionX;
        ans.y=positionY;
    }
    return ans;
}

// -------------MouseMoveの追跡 ------
// WorldTableComponent.pointerDeviceService


class traceMouseAction {
  //static #_instance;
  static pointerObj;
  static pointerMode;
  static delayMoveEventId;
  
  static traceMouseMove_primaryPointer;
  static traceMouseMove_primaryPointerTime;
  constructor( ) {
      this.traceMouseMove_primaryPointer = {x:0 , y:0 , z:0 };
  }
  
  static SyntheticEventDistance(mousePointer) {
      if(!this.traceMouseMove_primaryPointer){return 99999;}
      let distance = (mousePointer.x - this.traceMouseMove_primaryPointer.x) ** 2;
      distance += (mousePointer.y - this.traceMouseMove_primaryPointer.y) ** 2;
      return (distance);
  }
  
  //-------
  static onMouseMove(ev,execflg=0) {
        if(traceMouseAction.delayMoveEventId) { clearTimeout(traceMouseAction.delayMoveEventId); traceMouseAction.delayMoveEventId=0; }
        let mousePointer = { x: ev.pageX, y: ev.pageY, z: 0 };
        // 発火条件
        let flg=execflg;
        const moveDistance = traceMouseAction.SyntheticEventDistance(mousePointer);
        if (moveDistance<(5**2) && flg==0) {return;}  // 移動量が小さいうちは無視する
        if (moveDistance>(15**2)) {flg=1;}  // 移動量がある程度あるなら処理する
        const nowtimeUTCms = (new Date()).getTime();
        if(traceMouseAction.traceMouseMove_primaryPointerTime){
            if( nowtimeUTCms-traceMouseAction.traceMouseMove_primaryPointerTime > 100 ) flg=1; // 前回から指定時間以上経過していれば処理する
        }
        if(flg==0) {  // 処理を保留
            traceMouseAction.delayMoveEventId = setTimeout( function(){ traceMouseAction.onMouseMove(ev,1); } , 100);
            return;
        }
        //----
        traceMouseAction.traceMouseMove_primaryPointer = mousePointer;
        traceMouseAction.traceMouseMove_primaryPointerTime = nowtimeUTCms;
        //--
        
        if(!cds){
            cds = new classTransform(HtmlElement_TableTheWorld);
        }
        
        const dspArea = document.getElementById(HtmlElemId_displayAreaDiv);
        const centerpos = getCenterPositionOfElement(dspArea);

        const tgtStyle = window.getComputedStyle(HtmlElement_TableTheWorld);  // これは自動追従
        const dogsTransform = tgtStyle.getPropertyValue('transform');
        const matrix = new DOMMatrix(dogsTransform);
        
        
        //cds.ini
        //let aaa = cds.convertToLocal(mousePointer, HtmlElement_TableTheWorld );  //  HtmlElement_TableTheWorld , HtmlElement_MainTable
        //let aaa = cds.convertLocalToLocal(mousePointer, HtmlElement_MainTable , document.body );
        //let p1=cds.convertProject({x:0,y:0,z:0}, HtmlElement_TableTheWorld );
        //let p2=cds.convertProject({x:0,y:0,z:0}, HtmlElement_TableTheWorld ,true);
        
        //let aaa=cds.takayamaProject(mousePointer.x,mousePointer.y,mousePointer.z);
        //let p1=cds.takayamaProject(0,0,0);
        //let p2=cds.takayamaUnproject(0,0,0);

        const zpos = mousePointer.z ;  // +WTCobj.viewPositionZ //  cameraPositionZ+WTCobj.viewPositionZ
        const wdscale = Math.abs(cameraPositionZ - WTCobj.viewPositionZ) / cameraPositionZ;
        const xpos = (mousePointer.x-centerpos.x)* wdscale;
        const ypos = (mousePointer.y-centerpos.y)* wdscale;

        let pos3d = myMtrxP( xpos , ypos ,  zpos  , matrix.inverse() );  // matrix.inverse()

        //console.log(`[info]  ${mousePointer.x},${mousePointer.y},${mousePointer.z}/${centerpos.x},${centerpos.y} >> ${pos3d.x},${pos3d.y},${pos3d.z} `);
        
        
        let gamecharaObj = GameCharacter.searchObjectByKey(c_config.userid);
        if(gamecharaObj){                          //let gamecharaObj = ObjectStore.instance.get(testGameCharaId);
        
                gamecharaObj.location.x = pos3d.x ;
                gamecharaObj.location.y = pos3d.y ;
                gamecharaObj.posZ = pos3d.z;
                
                if(1==2){ // 送信前に、自分だけは更新する場合
                    if(gamecharaObj){
                            gamecharaObj.updateDOM();
                    }
                }
                
                gamecharaObj.sendMessage();
                
        }else{
                mypostWinMessageChannel(winMessageChannelPort , "tabletopObjectInfo" , {} );
        }

        
//        //const baseMatrix = {m11:1,m12:0,m13:0,m14:0,m21:0,m22:1,m23:0,m24:0,m31:0,m32:0,m33:1,m34:0,m41:0,m42:0,m43:0,m44:1};
//                     //  m41=translateX, m42=translateY, m43=translateZ
//        let paramMatrixAry = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
//        paramMatrixAry[12]=pos3d.x; // m41
//        paramMatrixAry[13]=pos3d.y; // m42
//        paramMatrixAry[14]=pos3d.z; // m43
//        //let testMatrix = new DOMMatrix(paramMatrixAry);
        
        
  };
  
  static setControlBtn(parentElement) {
    const btnId="button_ctrl10";
    
    if(parentElement){
            let strElm="";
            strElm +=`<input type="button" id="${btnId}" value="----" />`;
            parentElement.insertAdjacentHTML('beforeend', strElm);
            let tgtElem=document.getElementById(btnId);
            if(tgtElem){
                tgtElem.addEventListener('click', function(){
                    //-----------
                    switch(traceMouseAction.pointerMode ? traceMouseAction.pointerMode : 0){
                      case 0:
                        traceMouseAction.setMode(1);
                        break;
                      case 1:
                        traceMouseAction.setMode(2);
                        break;
                      case 2:
                        traceMouseAction.setMode(0);
                        break;
                    }
                    //-----------
                });
            }
    }
  }

  static onMouseClick(ev) {
    //console.log("clicked!!!")
    switch(traceMouseAction.pointerMode){
      case 0:
        break;
        
      case 1:
        traceMouseAction.setMode(2);
        break;
        
      case 2:
        traceMouseAction.setMode(1);
        break;
    }
  }

  static setMode(mode=0) {
    const btnId="button_ctrl10";
    let btnElem=document.getElementById(btnId);
    // ---
    let pointerObj = traceMouseAction.pointerObj;
    if(!pointerObj){
        pointerObj = GameCharacter.searchObjectByKey(c_config.userid);  // 自分のポインタ
        if(!pointerObj){
            messageFunc_mousepointer(  c_config.userid  ); // 新規作成
            pointerObj = GameCharacter.searchObjectByKey(c_config.userid);
        }
    }

    if(!pointerObj) return;
    //---
    const elemTgtobj = pointerObj.getDomElement;
    const elemForEvent = myGetElementByName(elemTgtobj,"setup-event","button");
    
    //--------------------
    if(!mode){
        mode = ( traceMouseAction.pointerMode ? traceMouseAction.pointerMode : 0) +1;
    }
    mode = mode % 3;
    traceMouseAction.pointerMode=mode;
    
    switch(mode){
      case 0:
                        if(btnElem){
                            btnElem.value="Pointer:display";
                            btnElem.removeAttribute("disabled");
                        }
                        document.body.removeEventListener('mousemove', traceMouseAction.onMouseMove );
                        if(elemForEvent){
                          setTimeout(function(){
                            elemForEvent.removeEventListener('click', traceMouseAction.onMouseClick );
                          },5000);
                        }
                        
                        pointerObj.visibility ="hidden";  //  elemTgtobj.style.visibility ="hidden";
        break;
        
      case 1:
                        if(btnElem){
                            btnElem.value="Pointer:Fixed";
                            //btnElem.setAttribute("disabled", true);
                        }
                        document.body.addEventListener('mousemove', traceMouseAction.onMouseMove );
                        if(elemForEvent){
                            elemForEvent.addEventListener('click', traceMouseAction.onMouseClick );
                        }
                        pointerObj.visibility ="visible";  //  elemTgtobj.style.visibility ="visible";
        break;
        
      case 2:
                        if(btnElem){
                            btnElem.value="Pointer:Delete";
                            btnElem.removeAttribute("disabled");
                        }
                        document.body.removeEventListener('mousemove', traceMouseAction.onMouseMove );
                        if(elemForEvent){
                            elemForEvent.addEventListener('click', traceMouseAction.onMouseClick );
                        }
                        pointerObj.visibility ="visible";  //  elemTgtobj.style.visibility ="visible";
        break;
    }
    if(debug_infolevel>0) console.log(`[Info] set traceMouse mode = ${mode}`);
    pointerObj.sendMessage();
  }
  
}


function messageFunc_mousepointer(strSenderId,dataary){
    if(!strSenderId) return;
    
    let pointerObj = GameCharacter.searchObjectByKey(strSenderId);
    if(!pointerObj){
        pointerObj = GameCharacter.create('マウスポインタ', 1 , null , strSenderId );
             // pointerId = GameCharacter.context.identifier; または   ObjectInventory_tabletop.searchByIndex1
        
        pointerObj.createDOM(50);
        pointerObj.appendDOM_image(50, "translateZ(2px)" , "./mousepointer01.png");
    }
    
    if(dataary){
        const keys = Object.keys(dataary);
        keys.forEach(function(element, index, array){
            switch(element){
                case "quaternion" :
                    const mtrx4 = dataary.quaternion;
                    pointerObj.location.x = mtrx4[12];  // m41
                    pointerObj.location.y = mtrx4[13];  // m42
                    pointerObj.posZ = mtrx4[14]; // m43
                    break;
                    
                case "visibility" :
                    pointerObj.visibility = dataary.visibility;
                    break;
                default:
                    console.log(`[Warning] unknown parameter: ${element} `);
                    break;
            }
        });
        
    }
    
    pointerObj.updateDOM();
}





// -------- Table画像の差し替え -------
    
function messageFunc_setTableImage(strSenderId,imageIdentifier){
    if(!strSenderId) return;
    if(!imageIdentifier) return;
    
    // -----
    let strUrl;
    
    const ImageStorageInstance=ImageStorage.instance;
    
    if(imageIdentifier.indexOf(":")>=0){
        strUrl = imageIdentifier;
    }else{
        const imgFileObj=ImageStorageInstance.get(imageIdentifier);
        if(imgFileObj){
            strUrl = imgFileObj.context.url;
            if(!strUrl){
                const tgtfile = imgFileObj.context.blob;
                strUrl = URL.createObjectURL(tgtfile);
            }
        }else{
            // 親に要求
            
            (async function(){   // requestedImage : {id:imageIdentifier,blob:imgFileObj.context.blob}; 
                let mypromise=getReplyWinMessage("requestImage","requestedImage",{to:strSenderId,id:imageIdentifier},5000);
                if(mypromise){ 
                    const msgobj = await mypromise; // {from:(userId),data:{id:(imageIdentifier),blob:(filedata)}}
                    //const tgtfile = msgobj.data.blob;
                    //const blob_test = new Blob(  msgobj.data.blobBinAry  , {type: msgobj.data.blobtype})
                    //const blob_pkg = new Uint8Array(msgobj.data.blob, 0, msgobj.data.blob_length);
                    //const tgtfile = window.opener.msgpack_decode(blob_pkg);
                    
                    let tgtfile = await fetch(msgobj.data.blobBase64).then(response => response.blob());
                    tgtfile.name = msgobj.data.blobName;
                    tgtfile.lastModified = msgobj.data.blobLatModified;
                    tgtfile.lastModifiedDate = msgobj.data.blobLatModifiedDate;
                    
                    const hashId = await FileReaderUtil.calcSHA256Async(tgtfile); // tgtfile はBlog
                    if(hashId!=imageIdentifier || hashId!=msgobj.data.id ){
                        console.log("[Error] Image hash Error!!!");
                    }else{
                        let imageSt; //let imageSt = ImageStorageInstance.get(URL.createObjectURL(tgtfile))
                        if(1==1){ // サムネイル作成しない場合
                            const newimg={};
                            newimg.identifier = hashId;
                            newimg.thumbnail={};
                            newimg.blob = tgtfile;
                            newimg.name = tgtfile.name;
                            imageSt = ImageFile.create(newimg);
                        }else{
                            imageSt = await ImageFile.createAsync(tgtfile); // ImageFileクラスを作成
                        }
                        ImageStorageInstance.add(imageSt); // ImageStorageに追加登録
                        
                        const imgFileCheck=ImageStorageInstance.get(imageIdentifier);
                        if(imgFileCheck){
                            let strUrl2 = imgFileCheck.context.url;
                            if(!strUrl2){
                                const tgtfile2 = imgFileCheck.context.blob;
                                strUrl2 = URL.createObjectURL(tgtfile2);
                            }
                            if(strUrl2){
                                messageFunc_setTableImage_setDom(strUrl2);
                                return "ok";
                            }
                        }
                        
                    }
                    return;
                    console.log("[Error] no image");
                }
            })();
            
        }
    }
    // ----- DOMに反映 (strUrl)
    messageFunc_setTableImage_setDom(strUrl);
    
}
async function messageFunc_setTableImage_setDom(strUrl,bairitu=1){
    let tgtElem = document.getElementById(HtmlElemId_MainTableImg);
    if(tgtElem){
        if(tgtElem.tagName=="IMG"){
                if(bairitu!=1){
                    const tgtsize=await getImageSizeFromUrl(strUrl);
                    if(tgtsize && tgtsize.width && tgtsize.height){
                        tgtElem.setAttribute('width' , (tgtsize.width *bairitu).toString()+"px" );
                        tgtElem.setAttribute('height', (tgtsize.height*bairitu).toString()+"px" );
                    }
                }
                tgtElem.src= strUrl;  // = URL.createObjectURL(tgtfile);
        }
    }
}



// -------------クリップボードの画像を取得 ------

class getImageFromClipboard {
  constructor( ) {}

    static setControlBtn(parentElement) {
      const btnId="button_ctrl20";
      
      if(parentElement){
              let strElm="";
              strElm +=`<input type="button" id="${btnId}" value="get Image from ClipBoard" />`;
              parentElement.insertAdjacentHTML('beforeend', strElm);
              let tgtElem=document.getElementById(btnId);
              if(tgtElem){
                  tgtElem.addEventListener('click', function(){
                      //-----------
                      getImageFromClipboard.getImgFromClipboard();
                      //-----------
                  });
              }
      }
    }

    static async getImgFromClipboard(){
      const tgtfile= await getImageFromClipboard.getDataFromClipboard("image/png");

      if(!tgtfile){  // tgtfile はBlog
          alert("画像データが認識できませんでした。");
      }else{
          //--------------------------------
          let ImageStorageInstance=ImageStorage.instance;
          
          //重複確認
          let imageSt; //let imageSt = ImageStorageInstance.get(URL.createObjectURL(tgtfile))
          const hashId = await FileReaderUtil.calcSHA256Async(tgtfile); // tgtfile はBlog
          const storedImgs = ImageStorageInstance.images;
          for(let key in storedImgs){
              if(storedImgs[key].context){if(storedImgs[key].context.identifier == hashId ){
                  imageSt = storedImgs[key];   // ImageStorage既存のデータを使用
              }}
          }
          if (!imageSt) { // 新規に追加登録
              //imageSt = ImageStorageInstance.add(URL.createObjectURL(tgtfile));
              if(1==1){ // サムネイル作成しない場合
                  const newimg={};
                  newimg.identifier = hashId;
                  newimg.thumbnail={};
                  newimg.blob = tgtfile;
                  newimg.name = tgtfile.name;
                  imageSt = ImageFile.create(newimg);
              }else{
                  imageSt = await ImageFile.createAsync(tgtfile); // ImageFileクラスを作成
              }
              ImageStorageInstance.add(imageSt); // ImageStorageに追加登録
          }
          
          
          
          mypostWinMessageChannel(winMessageChannelPort , "setTableImage" , imageSt.identifier );
          TableImage_identifier = imageSt.identifier;
          
          //--------------------------------
          
      }
    }

    static getDataFromClipboard(strType){
        if(document.hasFocus()){
            return getImageFromClipboard.getDataFromClipboard_async(strType);
        }
        alert("クリックしてください");
        // フォーカスが移動し終わってから処理を実行する
        const myPromise = new Promise( async function(resolve, reject){
            setTimeout( function(){
                resolve( getImageFromClipboard.getDataFromClipboard_async(strType) );
            }, 100);
        });
    //    .then(function(ans){    return ans;    });

        return myPromise;
    }
    
    
    static async getDataFromClipboard_async(strType){
        //  strType { "image/png", }
        // https://developer.mozilla.org/ja/docs/Web/API/ClipboardItem
        // https://developer.mozilla.org/ja/docs/Web/HTTP/Basics_of_HTTP/MIME_types
        
        let blob =null;
        let typelist={};
        
        try {
            const permission = await navigator.permissions.query({ name: 'clipboard-read' });
            if (permission.state === 'denied') {
                console.log("Not allowed to read clipboard.");
                return null;
            }
          
            // Clipboardの内容リストを取得  (documentにフォーカスがある必要がある：開発者ツールでも不可)
            if(!document.hasFocus()){alert("クリックしてください");}
            const cbContents = await navigator.clipboard.read();
        
            // Clipboardの内容を調査
            for (const cbitem of cbContents) {
                //const cbitem = cbContents[i]; // ClipboardItem オブジェクト
                for(let typ of cbitem.types){  typelist[typ]=1;  }
                
                // 指定されたデータタイプのデータが存在するか確認
                if (cbitem.types.includes(strType)) {
                    blob = await cbitem.getType(strType);
                }
            }
        }catch (error) {
            console.error(error.message);
        }
        
        
        if(!blob){
            console.log( "not found "+strType+" data in Clipboard.");
            let strvl="";
            for (let key in typelist) strvl += key+", ";
            console.log( "( Clipboard data : "+ strvl +")");
        }
        return blob;
    }
}


