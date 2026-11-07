# ClassQuest 第一版

## 已確認方向
依保存的 Blueprint 製作響應式課堂英文遊戲與積分追蹤 Web App。使用已啟用的受管理 MySQL 與 Express/tRPC，學生無密碼、教師唯一指定密碼 87654321。資料不以 local storage 作主要儲存，因此跨裝置共用名單與排行榜；local storage 只記住學生選擇。教師在伺服器驗證密碼並取得具期限會話，所有管理操作都需驗證。初始名單清楚標示為 Demo class，示範起始積分以紀錄保存，不捏造遊戲結果。

## 設計
候選：溫暖的現代遊樂場（0.07）、彩色文具編輯風（0.05）、柔和幾何教室風（0.03）。採溫暖的現代遊樂場。
- Design Movement：以當代兒童博物館與圓角文具設計為參考。
- Core Principles：寬裕間距；清晰、可觸控；色彩區分遊戲；鼓勵學習而非壓力排名。
- Color Philosophy：米白底、深青綠品牌與閱讀文字；淡紫／粉橘／薄荷作三款遊戲色碼，黃色只作星星與獎勵。
- Layout Paradigm：固定側邊品牌導覽、右側閱讀流；寬螢幕遊戲卡橫排，下方是排行榜與積分說明。平板縮短側欄，手機導覽轉為底部。
- Signature Elements：雙星品牌標誌、圓角色塊、虛線學習路徑與輕微傾斜的卡片插畫。
- Interaction Philosophy：按鈕至少 44px，主要遊戲操作 56px 以上。拖放亦可先點單字再點分類，避免只依賴拖曳。
- Animation：160–220ms hover/press 過渡；配對卡 3D 翻轉；完成畫面短暫星星動畫；尊重 prefers-reduced-motion。
- Typography：Nunito 用於標題與品牌，DM Sans 用於正文；主標 36–44px、段落 15–17px、遊戲問題 28–36px。
- Brand Essence：讓每個學生透過小遊戲累積英語能力與正向行為。個性：友善、明亮、鼓舞。
- Brand Voice：簡單清晰的英文。例句："Small games. Big discoveries."、"Pick a game. Make a little progress."
- Wordmark & Logo：兩顆交疊星星的青綠圓角標誌與粗圓體 ClassQuest。
- Signature Brand Color：深森林青綠 #216454。

## 實作與結構
- `shared/gameData.ts`：完整文法主題與教材 1A–6B 的詞彙問題、12 個分類關卡、12 個記憶關卡，統一計分工具。
- `drizzle/schema.ts` 與 migrations：學生、積分紀錄、遊戲結果、教師會話與 seed version。
- `server/classroom.ts`：受保護管理程序、無密碼加入、課堂名單、伺服器計分與資料庫交易。
- `server/routers.ts`：接上 classroom tRPC，保留 starter 其他功能。
- `client/src/pages/Home.tsx`：首頁、導覽、排行榜、學生選擇、教師登入、管理與紀錄畫面。
- `client/src/components/GamePlayer.tsx`：遊戲設定、三種遊戲流程與結果。
- `client/src/index.css`：響應式視覺系統。
- `client/public/manus-routes.json`：全部真實頁面路徑。

遊戲從預建內容產生題組，伺服器根據提交的作答計算正確数與 +5/+3/+1，以唯一 run ID 避免重複送出。記憶遊戲以每對首次配對是否正確計分，所有卡都配對後可結束，不將反覆嘗試自動算滿分。每次記錄更新後立即 invalidate 排行榜，並每 3 秒取得最新跨裝置資料。教師調整需理由、時間戳與可選 1–10 點；移除学生與清除類操作提供明確確認。生產由現有 Dockerfile 編譯與提供前後端，PORT 3000，健康檢查 /api/health。

## Update — supplied merged.pdf and pasted_content_2.txt

The supplied 18-page PDF is the curriculum authority: grammar tables on pages 1–4, vocabulary by textbook/chapter on pages 5–18. Retain the visual identity and original three games, replace active vocabulary pools with PDF words and align grammar/tense practice to textbook/chapter targets. Add a curriculum browser and level/chapter filters; content metadata retains source page and chapter. Original score histories and balances are preserved.

Expand to 15 activities: original Quiz (including Fill in the Blank), Category Sort, Memory Match; Odd One Out, Vocabulary Bingo, Sentence Builder, Grammar Auction, Fix the Sentence, Preposition Maze, Story Builder, Who Am I, teacher-moderated Charades, Team Battle, Daily Challenge, Boss Battle. Add solo/whiteboard presentation modes where relevant, optional older-learner timers and a five-question boss. Three-correct streaks earn a badge rather than modifying the standard +5/+3/+1 rule. Daily Challenge is one shared date-specific question, double reward, once per student per UTC date with date displayed. Odd One Out explanation extra points are teacher awarded with the existing required-reason workflow. Auction uses team wager balances, never deducts student totals implicitly. Team rounds retain team names/scores plus individual results in the shared database; teacher-only physical-action judgments and bets are authorized with existing teacher tokens.

New structure: `shared/curriculum.ts` for PDF catalog and grammar coverage, `shared/varietyData.ts` for activity datasets and server-authoritative grading; `client/src/components/VarietyPlayer.tsx` and its stylesheet for new interactions, existing `GamePlayer.tsx` receives curriculum selection; `server` extends persistent results with activity metadata, daily uniqueness and team scores through additive migrations. `Home.tsx` uses a categorized searchable game library and a curriculum view at `/curriculum`. No external AI is needed at runtime. Preserve actual point logs and migrate only additively.
