// 単語帳データ（アプリ全体で共通）
const wordBooks = [
    {
        id: "basic",
        title: "基本英単語",
        description: "中学レベルの基本単語",
        count: 300
    },
    {
        id: "advanced",
        title: "発展英単語",
        description: "高校〜大学受験向け",
        count: 800
    },
    {
        id: "toeic",
        title: "TOEIC頻出",
        description: "TOEICによく出る単語",
        count: 600
    }
];

// id → 単語帳データ を引けるMap
const wordBookMap = {};
wordBooks.forEach(book => {
    wordBookMap[book.id] = book;
});

const wordData = {
    basic: [
        { en: "apple", ja: "りんご" },
        { en: "book", ja: "本" },
        { en: "cat", ja: "猫" },
        { en: "dog", ja: "犬" },
        { en: "eat", ja: "食べる" },
        { en: "fish", ja: "魚" },
        { en: "good", ja: "良い" },
        { en: "home", ja: "家" },
        { en: "ice", ja: "氷" },
        { en: "jump", ja: "跳ぶ" },
        { en: "key", ja: "鍵" },
        { en: "love", ja: "愛" },
        // …何個でも追加
    ],

    advanced: [
        { en: "achieve", ja: "達成する" },
        { en: "analyze", ja: "分析する" },
    ]
};
