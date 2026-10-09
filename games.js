/*
 * 게임 목록을 관리하는 파일입니다.
 * 게임을 추가/수정할 때는 아래 항목만 편집하면 됩니다.
 *
 * image: assets/images/ 폴더에 넣은 이미지 경로
 * storeUrl: Google Play 앱 상세 페이지 URL (출시 전이면 빈 문자열 "")
 * status: "출시" 또는 "준비 중" 등 원하는 상태 문구
 *
 * 추천 이미지 크기: 1200 x 850px 이상, JPG 또는 PNG
 * Google Play 링크 형식: https://play.google.com/store/apps/details?id=실제.패키지명
 */
window.STUDIO_CONFIG = {
  name: "작은 게임 작업실",
  description: "작은 게임, 오래 남는 즐거움."
};

window.GAMES = [
  {
    id: "dressup-spin",
    number: "01",
    title: "작은 옷장 Dressup & Spin",
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
    number: "02",
    title: "몽삐 · TamaPet",
    kicker: "PET · DAILY LIFE",
    description: "나만의 작은 친구를 돌보고 함께 자라나는 포근한 펫 라이프.",
    platform: "IN DEVELOPMENT",
    status: "개발 중",
    image: "assets/images/Mongppi.png",
    storeUrl: "",
    linkLabel: "출시 준비 중"
  },
  {
    id: "tarot",
    number: "03",
    title: "타로",
    kicker: "TAROT · REFLECTION",
    description: "카드를 펼치고 오늘의 마음과 여러 선택을 천천히 들여다보는 시간.",
    platform: "IN DEVELOPMENT",
    status: "개발 중",
    image: "assets/images/Tarot.png",
    storeUrl: "",
    linkLabel: "출시 준비 중"
  }
];
