// import { Ghtml }  from "./udonChatHTML_elements.js"; で利用可能になる。
//	※この場合、Ghtml.testparam01=0; 等となる。変数Ghtml自体は参照のみ可能(代入不可)。






//-----------
export const c_audioContext = new (window.AudioContext || window.webkitAudioContext)(); // chromeでは、後続のresume で有効化される

export const c_elemEvent_input = new Event('input');
//-----------

export let Ghtml = {};

Ghtml.elemText_myPeerId = null;
Ghtml.elemStream_SW = null;
Ghtml.elemStream_SW_Msg = null;
Ghtml.elemMic_SW = null;
Ghtml.elemMic_STTS = null;
Ghtml.elemRange_microphoneLevel = null;
Ghtml.elemRange_microphoneLevelCurVal = null;
Ghtml.elemVolume_SW = null;
Ghtml.elemRange_VolumeLevel = null;
Ghtml.elemRange_VolumeLevelCurVal = null;
Ghtml.elemCheckBox_micProperties = null;
Ghtml.elemRadio_micEchoCancel = null;
Ghtml.elemTextArea_ResultRecognition = null;
Ghtml.elemTextArea_ResultRecognitionP = null;
Ghtml.elemCheckBox_ResultRecognition = null;
Ghtml.elemCheckBox_ResultRecognition_chat =null;
Ghtml.elemText_ResultRecognitionStatus = null;
Ghtml.elemText_chatMessage = null;
Ghtml.elemText_chatMessage_SW = null;
Ghtml.elemText_chatMessage_log = null;
Ghtml.elemText_chatMessage_saveSW = null;
Ghtml.elemText_chatMessage_saveBlobLink = null;

Ghtml.elemRec_SW = null;
Ghtml.elemTextArea_RecSound = null;

Ghtml.elemVideo = null;
Ghtml.elemVideo_SW = null;
Ghtml.elemVideo_STTS = null;
Ghtml.elemRange_VideoFrameRate = null;
Ghtml.elemRange_VideoFrameRateCurVal = null;

Ghtml.elemAddNewPeer_SW = null;
Ghtml.elemText_myPeerId = null;
Ghtml.elemText_myPeerId_copySW = null;
Ghtml.elemDiv_streams = null;
Ghtml.elemText_AddNewPeerID = null;

//-----------





