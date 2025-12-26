document.getElementById("back-btn").onclick = () => {
    location.href = "index.html";
};


// 初期化用コード
function loadJSON(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

const tags = loadJSON("tags", {
    タグ1 : { name: "タグ1" },
    タグ2 : { name: "タグ2" },
    タグ3 : { name: "タグ3" },
    タグ4 : { name: "タグ4" },
    タグ5 : { name: "タグ5" },
    タグ6 : { name: "タグ6" },
    タグ7 : { name: "タグ7" },
    タグ8 : { name: "タグ8" },
    タグ9 : { name: "タグ9" },
    タグ10: { name: "タグ10" },
    タグ11: { name: "タグ11" },
    タグ12: { name: "タグ12" },
    タグ13: { name: "タグ13" },
    タグ14: { name: "タグ14" },
    タグ15: { name: "タグ15" },
    タグ16: { name: "タグ16" },
    タグ17: { name: "タグ17" },
    タグ18: { name: "タグ18" },
    タグ19: { name: "タグ19" },
    タグ20: { name: "タグ20" },
    タグ21: { name: "タグ21" },
    タグ22: { name: "タグ22" },
    タグ23: { name: "タグ23" },
    タグ24: { name: "タグ24" },
    タグ25: { name: "タグ25" },
    タグ26: { name: "タグ26" },
    タグ27: { name: "タグ27" },
    タグ28: { name: "タグ28" },
    タグ29: { name: "タグ29" },
    タグ30: { name: "タグ30" },
    タグ31: { name: "タグ31" },
    タグ32: { name: "タグ32" },
    タグ33: { name: "タグ33" },
    タグ34: { name: "タグ34" },
    タグ35: { name: "タグ35" },
    タグ36: { name: "タグ36" },
    タグ37: { name: "タグ37" },
    タグ38: { name: "タグ38" },
    タグ39: { name: "タグ39" },
    タグ40: { name: "タグ40" },
    タグ41: { name: "タグ41" },
    タグ42: { name: "タグ42" },
    タグ43: { name: "タグ43" },
    タグ44: { name: "タグ44" },
    タグ45: { name: "タグ45" },
    タグ46: { name: "タグ46" },
    タグ47: { name: "タグ47" },
    タグ48: { name: "タグ48" },
    タグ49: { name: "タグ49" },
    タグ50: { name: "タグ50" }
});

localStorage.setItem("tags", JSON.stringify(tags));
// 初期化用コード終了

// localStorage から取得
// const tags = JSON.parse(localStorage.getItem("tags")) ?? {};
const wordTags = JSON.parse(localStorage.getItem("wordTags")) ?? {};

const tagListEl = document.getElementById("tag-list");

console.log("tags:", tags);
console.log("wordTags:", wordTags);
console.log("tagListEl:", tagListEl);

// タグごとの単語数を数える
function countWordsByTag(tagId) {
    let count = 0;
    
    Object.values(wordTags).forEach(tagArray => {
        if (tagArray.includes(tagId)) {
            count++;
        }
    });
    
    return count;
}

// 描画
Object.entries(tags).forEach(([tagId, tag]) => {
    const li = document.createElement("li");
    li.className = "tag-item";
    
    const count = countWordsByTag(tagId);
    
    li.innerHTML = `
    <a href="study.html?tag=${tagId}" class="tag-link">
    <span class="tag-name">#${tag.name}</span>
    <span class="tag-count">${count}語</span>
    </a>
    `;
    
    tagListEl.appendChild(li);
});
