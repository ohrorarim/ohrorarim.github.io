/*
 * 게임·앱 프로젝트 목록 관리 파일입니다.
 * 새 게임을 추가할 때는 아래 목록에 항목 하나를 복사해 수정하면 됩니다.
 * 이미지 경로는 assets/images/ 폴더 기준입니다.
 * 출시 전 게임은 storeUrl을 빈 문자열("")로 두세요.
 */
window.STUDIO_CONFIG = {
  name: "오로라스튜디오",
  description: "작은 게임과 앱, 오래 남는 즐거움."
};

window.GAMES = [
  {
    id: "dressup-spin",
    category: "game",
    number: "01",
    title: "작은 옷장 · Dressup & Spin",
    kicker: "DRESS UP · COLLECTION",
    description: "취향대로 캐릭터를 꾸미고, 작은 옷장 속 새로운 이야기를 발견해 보세요.",
    platform: "ANDROID",
    status: "출시",
    image: "assets/images/DressupSpin.png",
    storeUrl: "https://play.google.com/store/apps/details?id=com.ohrorarim.DressupSpin",
    linkLabel: "Google Play에서 보기"
  },
  {
    id: "tamapet",
    category: "game",
    number: "02",
    title: "몽삐 ·  Mongppi",
    kicker: "PET · DAILY LIFE",
    description: "나만의 작은 친구를 돌보고 함께 자라나는 포근한 펫 라이프.",
    platform: "ANDROID",
    status: "출시",
    image: "assets/images/Mongppi.png",
    storeUrl: "https://play.google.com/store/apps/details?id=com.ohrorarim.Mongppi",
    linkLabel: "Google Play에서 보기"
  },
  {
    id: "tarot",
    category: "app",
    number: "03",
    title: "타로",
    kicker: "TAROT · REFLECTION",
    description: "카드를 펼치고 오늘의 마음과 여러 선택을 천천히 들여다보는 시간.",
    platform: "IN DEVELOPMENT",
    status: "개발 중",
    image: "assets/images/Tarot.png",
    storeUrl: "",
    linkLabel: "출시 준비 중"
  },
  
  {
    id: "mini-piano",
    category: "app",
    number: "04",
    title: "미니 피아노 · MINI PIANO",
    kicker: "PIANO · RHYTHM",
    description: "피아노를 입문하고 리듬게임으로 배워보는 피아노 기초.",
    platform: "IN DEVELOPMENT",
    status: "개발 중",
    image: "assets/images/MiniPiano.png",
    storeUrl: "",
    linkLabel: "출시 준비 중"
  },
  {
    id: "mini-town",
    category: "game",
    number: "05",
    title: "미니 타운",
    kicker: "TOWN · SANDBOX",
    description: "생존 게임.",
    platform: "IN DEVELOPMENT",
    status: "개발 중",
    image: "assets/images/MiniTown.png",
    storeUrl: "",
    linkLabel: "출시 준비 중"
  }
];


/* 웹툰 채널 주소는 여기서 언제든지 변경할 수 있습니다. */
window.WEBTOON_LINKS = {
  postype: "https://www.postype.com/@ohrora9403",
  instagram: "" // 인스타그램 프로필 주소가 정해지면 URL을 입력하세요.
};
