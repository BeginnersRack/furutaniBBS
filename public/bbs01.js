export const PM_BBSconfigs = {};
// 参照元：bbs_99.js , bbs_thread.js , bbs_comment.js

PM_BBSconfigs.c_bbsCode="BBS01";
PM_BBSconfigs.HtmlElement_myTableDivId ="bbs01_ListTable";
PM_BBSconfigs.HtmlElement_myControllDivId ="bbs01_controll";
PM_BBSconfigs.HtmlElement_myNewDetailsDivId ="bbsThread_NewDetails";


PM_BBSconfigs.expandDirection -1;   // 0:順方向(古いものから)  -1:逆方向(新しいものから)
PM_BBSconfigs.expandNumber = 5;    // 1頁あたりの表示行数


// タイトル等の文字数制限（FireStoreのRule設定値を超えないこと）
PM_BBSconfigs.MaxDatasize_Title = 40;
PM_BBSconfigs.MaxDatasize_overview = 100;
PM_BBSconfigs.MaxDatasize_threadContent=100;
PM_BBSconfigs.MaxDatasize_comment = 100;

// 履歴  0:日時のみ -1:記録しない
PM_BBSconfigs.recordHistorySize = 10;
PM_BBSconfigs.MaxDatasize_History = 100;

// スレッドの種別選択肢
PM_BBSconfigs.c_threadtypeAry = {proposal:"提案",question:"教えて",share:"共有",report:"報告"};


//---
