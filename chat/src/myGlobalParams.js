// import { G }  from "./myGlobalParams.js"; で利用可能になる。
//	※この場合、G.testparam01=0; 等となる。変数G自体は参照のみ可能(代入不可)。

export let G = {};  //let G = new Object();





G.SkyWayPeer;
G.connectedCalls={};  // 接続したコールを保存しておく連想配列変数
G.connectedDatas={};  // 接続したchatデータコネクトを保存しておく連想配列変数


G.localStream = null;    // 自分の映像ストリームを保存しておく変数



