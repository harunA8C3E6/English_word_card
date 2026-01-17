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
const tags = loadJSON("tags-classical", {
    古典タグ1 : { name: "古典タグ1" },
    古典タグ2 : { name: "古典タグ2" },
    古典タグ3 : { name: "古典タグ3" },
    古典タグ4 : { name: "古典タグ4" },
    古典タグ5 : { name: "古典タグ5" },
    古典タグ6 : { name: "古典タグ6" },
    古典タグ7 : { name: "古典タグ7" },
    古典タグ8 : { name: "古典タグ8" },
    古典タグ9 : { name: "古典タグ9" },
    古典タグ10: { name: "古典タグ10" },
    古典タグ11: { name: "古典タグ11" },
    古典タグ12: { name: "古典タグ12" },
    古典タグ13: { name: "古典タグ13" },
    古典タグ14: { name: "古典タグ14" },
    古典タグ15: { name: "古典タグ15" },
    古典タグ16: { name: "古典タグ16" },
    古典タグ17: { name: "古典タグ17" },
    古典タグ18: { name: "古典タグ18" },
    古典タグ19: { name: "古典タグ19" },
    古典タグ20: { name: "古典タグ20" },
    古典タグ21: { name: "古典タグ21" },
    古典タグ22: { name: "古典タグ22" },
    古典タグ23: { name: "古典タグ23" },
    古典タグ24: { name: "古典タグ24" },
    古典タグ25: { name: "古典タグ25" },
    古典タグ26: { name: "古典タグ26" },
    古典タグ27: { name: "古典タグ27" },
    古典タグ28: { name: "古典タグ28" },
    古典タグ29: { name: "古典タグ29" },
    古典タグ30: { name: "古典タグ30" },
    古典タグ31: { name: "古典タグ31" },
    古典タグ32: { name: "古典タグ32" },
    古典タグ33: { name: "古典タグ33" },
    古典タグ34: { name: "古典タグ34" },
    古典タグ35: { name: "古典タグ35" },
    古典タグ36: { name: "古典タグ36" },
    古典タグ37: { name: "古典タグ37" },
    古典タグ38: { name: "古典タグ38" },
    古典タグ39: { name: "古典タグ39" },
    古典タグ40: { name: "古典タグ40" },
    古典タグ41: { name: "古典タグ41" },
    古典タグ42: { name: "古典タグ42" },
    古典タグ43: { name: "古典タグ43" },
    古典タグ44: { name: "古典タグ44" },
    古典タグ45: { name: "古典タグ45" },
    古典タグ46: { name: "古典タグ46" },
    古典タグ47: { name: "古典タグ47" },
    古典タグ48: { name: "古典タグ48" },
    古典タグ49: { name: "古典タグ49" },
    古典タグ50: { name: "古典タグ50" }
});

// ==============================
// tagsの保存
// ==============================
localStorage.setItem("tags-classical", JSON.stringify(tags));

const wordTags = JSON.parse(localStorage.getItem("wordTags-classical")) ?? {};
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
    <a href="study-classicalJapanese.html?tag=${tagId}" class="tag-link">
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
//         tags[`古典タグ${i}`] = { name: `古典タグ${i}` };
//     }

//     localStorage.setItem("tags-classical", JSON.stringify(tags));

//     alert("タグを初期化しました");
// };