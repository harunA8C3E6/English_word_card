// ==============================
// loadJSONの定義
// ==============================
function loadJSON(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

// ==============================
// tagsの読み込み（今くいかなければ初期値）
// ==============================
const tags = loadJSON("tags-modern", {
    現代文タグ1 : { name: "現代文タグ1" },
    現代文タグ2 : { name: "現代文タグ2" },
    現代文タグ3 : { name: "現代文タグ3" },
    現代文タグ4 : { name: "現代文タグ4" },
    現代文タグ5 : { name: "現代文タグ5" },
    現代文タグ6 : { name: "現代文タグ6" },
    現代文タグ7 : { name: "現代文タグ7" },
    現代文タグ8 : { name: "現代文タグ8" },
    現代文タグ9 : { name: "現代文タグ9" },
    現代文タグ10: { name: "現代文タグ10" },
    現代文タグ11: { name: "現代文タグ11" },
    現代文タグ12: { name: "現代文タグ12" },
    現代文タグ13: { name: "現代文タグ13" },
    現代文タグ14: { name: "現代文タグ14" },
    現代文タグ15: { name: "現代文タグ15" },
    現代文タグ16: { name: "現代文タグ16" },
    現代文タグ17: { name: "現代文タグ17" },
    現代文タグ18: { name: "現代文タグ18" },
    現代文タグ19: { name: "現代文タグ19" },
    現代文タグ20: { name: "現代文タグ20" },
    現代文タグ21: { name: "現代文タグ21" },
    現代文タグ22: { name: "現代文タグ22" },
    現代文タグ23: { name: "現代文タグ23" },
    現代文タグ24: { name: "現代文タグ24" },
    現代文タグ25: { name: "現代文タグ25" },
    現代文タグ26: { name: "現代文タグ26" },
    現代文タグ27: { name: "現代文タグ27" },
    現代文タグ28: { name: "現代文タグ28" },
    現代文タグ29: { name: "現代文タグ29" },
    現代文タグ30: { name: "現代文タグ30" },
    現代文タグ31: { name: "現代文タグ31" },
    現代文タグ32: { name: "現代文タグ32" },
    現代文タグ33: { name: "現代文タグ33" },
    現代文タグ34: { name: "現代文タグ34" },
    現代文タグ35: { name: "現代文タグ35" },
    現代文タグ36: { name: "現代文タグ36" },
    現代文タグ37: { name: "現代文タグ37" },
    現代文タグ38: { name: "現代文タグ38" },
    現代文タグ39: { name: "現代文タグ39" },
    現代文タグ40: { name: "現代文タグ40" },
    現代文タグ41: { name: "現代文タグ41" },
    現代文タグ42: { name: "現代文タグ42" },
    現代文タグ43: { name: "現代文タグ43" },
    現代文タグ44: { name: "現代文タグ44" },
    現代文タグ45: { name: "現代文タグ45" },
    現代文タグ46: { name: "現代文タグ46" },
    現代文タグ47: { name: "現代文タグ47" },
    現代文タグ48: { name: "現代文タグ48" },
    現代文タグ49: { name: "現代文タグ49" },
    現代文タグ50: { name: "現代文タグ50" }
});

// ==============================
// tagsの保存
// ==============================
localStorage.setItem("tags-modern", JSON.stringify(tags));

const wordTags = JSON.parse(localStorage.getItem("wordTags-modern")) ?? {};
const tagListEl = document.getElementById("tag-list");

// ==============================
// タグごとの単語数を数える
// ==============================
function countWordsByTag(tagId) {
    let count = 0;
    
    Object.values(wordTags).forEach(tagArray => {
        if (tagArray.includes(tagId)) {
            count++;
        }
    });
    
    return count;
}

// ==============================
// タグごとにボタンの生成
// ==============================
Object.entries(tags).forEach(([tagId, tag]) => {
    const li = document.createElement("li");
    li.className = "tag-item";
    
    const count = countWordsByTag(tagId);
    
    li.innerHTML = `
    <a href="study-modernJapanese.html?tag=${tagId}" class="tag-link">
    <div class="tag-name">#${tag.name}</div>
    <div class="tag-count">${count}語</div>
    </a>
    `;
    
    tagListEl.appendChild(li);
});

// ==============================
// 「←」「← ホームに戻る」ボタン
// ==============================
document.getElementById("back-btn").onclick = () => {
    location.href = "../index.html";
};
document.getElementById("prev-page-btn").onclick = () => {
    location.href = "../index.html";
};

// ==============================
// タグの初期化ボタン（基本はコメントアウト）
// ==============================
// document.getElementById("tag-restart").onclick = () => {
//     if (!confirm("タグを初期化します。よろしいですか？")) return;
//     const tags = {};
    
//     for (let i = 1; i <= 50; i++) {
//         tags[`現代文タグ${i}`] = { name: `現代文タグ${i}` };
//     }

//     localStorage.setItem("tags-modern", JSON.stringify(tags));

//     alert("タグを初期化しました");
// };