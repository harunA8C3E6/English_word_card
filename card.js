// URL パラメータ取得
const params = new URLSearchParams(location.search);
const from = Number(params.get("from") || 1);
const to = Number(params.get("to") || 10);
const posFilter = (params.get("pos") || "").split(",").filter(Boolean);
const randomMode = params.get("random") === "1";
const randomCount = Number(params.get("count") || 10);

console.log({ from, to, posFilter, randomMode, randomCount });

// ここから単語カード用に wordData から範囲を抽出して表示可能





const card = document.getElementById("card");

// タップで裏返す（スワイプとは独立）
card.addEventListener("click", () => {
    card.classList.toggle("flipped");
});

let startX = 0;
let currentX = 0;
let isDragging = false;
let isFlipped = false;

const SWIPE_THRESHOLD = 80; // 判定距離(px)

// ===== タップ（表裏反転）=====
card.addEventListener("click", () => {
    if (isDragging) return; // スワイプ中は無効
    isFlipped = !isFlipped;
    card.classList.toggle("flipped", isFlipped);
});

// ===== タッチ開始 =====
card.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    card.classList.add("dragging");
});

// ===== タッチ移動 =====
card.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    currentX = e.touches[0].clientX - startX;

    card.style.transform = `
        translateX(${currentX}px)
        rotate(${currentX * 0.05}deg)
    `;
});

// ===== タッチ終了 =====
card.addEventListener("touchend", () => {
    card.classList.remove("dragging");

    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
        if (currentX > 0) {
            swipeRight();
        } else {
            swipeLeft();
        }
    } else {
        resetPosition();
    }

    currentX = 0;
    isDragging = false;
});

// ===== 判定処理 =====
function swipeRight() {
    console.log("知っている");
    card.classList.add("swipe-right");
    handleAnswer(true);
}

function swipeLeft() {
    console.log("知らない");
    card.classList.add("swipe-left");
    handleAnswer(false);
}

// ===== 元の位置に戻す =====
function resetPosition() {
    card.style.transform = "";
}

// ===== 回答処理（後で拡張）=====
function handleAnswer(isKnown) {
    setTimeout(() => {
        card.classList.remove("swipe-right", "swipe-left");
        card.style.transform = "";
        isFlipped = false;
        card.classList.remove("flipped");

        // TODO: 次の単語を表示
        // setNextCard();
    }, 400);
}
