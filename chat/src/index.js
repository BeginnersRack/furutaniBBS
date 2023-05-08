
import "./udonChatHTML.js";

// import {myStart} from "./test.js"; 


const expr = 0;
switch (expr) {
  case 0:
      
      // 先頭に import "./udonChatHTML.js"; が必要
      
  break;
  case 1:
      let myImportModuleName;
      import("./udonChatHTML.js").then((module)=>{
          // myImportModuleName = module.myImportModuleName;
      });
      
  break;
  case 10:  // テスト関数　静的import
      // 先頭に import {myStart} from "./test.js"; が必要
      myStart();
      
  break;
  case 11:  // テスト関数　動的import
      let myStart;
//      import("./test.js").then((module)=>{
//          myStart = module.myStart;
//          myStart();
//      });
      
  break;
  default:
    console.log(`Sorry, we are out of ${expr}.`);
}




/* 

	udonChatHTML.js
      +--	udonChatHTML_elements.js
      +--	udonChatHTML_VoiceRecognition.js
	  | 	  +--	udonTextMessageChat.js
	  | 	  +--	udonMediaStream.js
	  |
	  |
	  +--	udonMediaStream.js
	  |		  +--	udonWebRTC.js
	  |   			  +--	udonChatHTML_elements.js
	  |						  +--	udonMediaStream.js // 循環参照あり
	  |				  +--	myfunc_cookie.js
	  |				  +--	udonChatHTML_VideoStreamElement.js
	  |						  +--	udonWebRTC.js   // 循環参照あり
	  |				  +--	udonTextMessageChat.js
	  +--	udonRecordVoice.js
	  +--	udonTextMessageChat.js


 ※importのパスは相対指定、または package.jsonのdependencies設定値を使えばルートからパス指定可能。????  ＜＜どうもダメらしい
 　　　例）　"dependencies": { "srcroot": "link:./src" }, としていた場合、import Header from 'srcroot/app/test.js'


====================================
udonChatHTML.js
	import { settingRecognition , flgEnableSpeechRecognition } from "./udonChatHTML_VoiceRecognition.js";
	import { startMultiparty } from "./udonWebRTC.js";
	
	function myOnload()
	function allDisabledElement(tgt,flg){
	function update_elemRange_microphoneLevelCurVal(){
	function update_elemRange_VideoFrameRateCurVal(){



udonChatHTML_elements.js
	Ghtml
	function dispInfoStreamStatus()


	

udonChatHTML_VoiceRecognition.js
	export { settingRecognition , flgEnableSpeechRecognition };
	
	function settingRecognition(){
	function addMessageOfRecognition(msg1,msg2){
	function addMessageOfRecognitionErr(){
	

udonWebRTC.js
	import { getCookie , setCookie } from "./myfunc_cookie.js";
	export { startMultiparty }
	
	function buildVideoConstraintsJSON() {
	function buildAudioConstraintsJSON() {
	function getCurrentSettings() {
	function startMultiparty(){
	function addNewPeer(newPeerID,actionFlg=1){
	function sendStreamToPeer(newPeerID){
	function connectDataToPeer(newPeerID,actionFlg=0){
	function createNewPeerSettingData(dataConnection,directionFlg=0,actionFlg=0){
	function sendListConnection(remoteId,requireCastFlg=0){
	function createConnectionByList(strList,mode=1){
	function allSendListConnection(expires=""){
	function checkRecievedDataStatus(remoteId,data){
	function createNewPeerSettingCall(callConnection){
	function deletePeerFromCallList(tgtPeerID){
	function deletePeerFromDataList(tgtPeerID){
	function quitAllConnection(){
	function getSkywayPeerInstance(){
	function forceOnElemStream_SW(){
	function toggleElemStream_SW(){  // 接続の初期化（ON/OFF）
	
	
udonChatHTML_VideoStreamElement.js
	function domAppendOrRemoveforPeer(mode,strTgtPeerId){
	
udonMediaStream.js
	export { changeAudioConstraints,changeVideoConstraints }
	
	function startVideo(triggerElem = null) {
	function stopVideo(triggerElem = null){
	function changAbleStream(streamTracks , enableFlg){
	function resurrectionBtnElem(triggerElems){
	function CheckEnable_videoTrack(triggerElem = null , loop=0){
	function initVideoConstraints(triggerElem = null){  // ストリームのon/off制御
	function changeAudioConstraintsPt(){
	function changeAudioConstraints(triggerElem = null){
	function changeVideoConstraintsPt(){
	function changeVideoConstraints(triggerElem = null){
	function changeVideoConstraints_delay(mode=0){

udonRecordVoice.js
	export { audioRecCommand , recreateAudioOutputStream};
	
	function audioRecCommand(mode){ //HTMLボタンより呼び出される。 mode=0:停止, 1:開始
	function createAudioOutputStream(){
	function recreateAudioOutputStream(){
	function recreateAudioOutputStream_restart(){

udonTextMessageChat.js
	export { saveChatMessageLog,recieveNewChatMessage,sendNewChatMessage }
	
	function sendNewChatMessage(tgtmsg){
	function recieveNewChatMessage(strid,data,crflg=0) {
	function strFormatTwoChar(intval) {
	function chatMessage_saveFN_onchange(){
	function saveChatMessageLog(){

*/
