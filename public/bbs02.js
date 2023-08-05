export const PM_BBSconfigs = {};

PM_BBSconfigs.c_bbsCode="BBS02";

PM_BBSconfigs.HtmlElement_myTableDivId ="bbs02_ListTable";
PM_BBSconfigs.HtmlElement_myControllDivId ="bbs02_controll";
PM_BBSconfigs.HtmlElement_myNewDetailsDivId ="bbsThread_NewDetails";

PM_BBSconfigs.expandDirection -1;   // 0:順方向(古いものから)  -1:逆方向(新しいものから)
PM_BBSconfigs.expandNumber = 10;    // 1頁あたりの表示行数

// タイトル等の文字数制限（FireStoreのRule設定値を超えないこと）
PM_BBSconfigs.MaxDatasize_Title = 100;
PM_BBSconfigs.MaxDatasize_overview = 1000;
PM_BBSconfigs.MaxDatasize_threadContent=1000;
PM_BBSconfigs.MaxDatasize_comment = 500;


// 履歴  0:日時のみ -1:記録しない
PM_BBSconfigs.recordHistorySize = 100;
PM_BBSconfigs.MaxDatasize_History = 1000;

// スレッドの種別選択肢
PM_BBSconfigs.c_threadtypeAry = {proposal:"提案",question:"教えて",share:"共有",report:"報告",Recruitment:"募集"};



//---