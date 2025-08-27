// Mock 데이터 - 백엔드 서버 없이 테스트용
// 실제 API 응답 구조와 동일하게 작성

export const mockEstateData = {
  id: 1,
  photo_url: "https://img.peterpanz.com/photo/20240615/15625987/666ce2d3503b1_origin.jpg",
  address: "서울시 강남구 역삼동 123-45",
  room_type: "원룸",
  deal_type: "월세",
  price_deposit: 1000, // 만원 단위
  price_rent: 50,
  area_m2: 33,
  floor: "3층",
  maintenance_fee: 5,
  latitude: 37.5007,
  longitude: 127.0366
};

export const mockSearchConditions = {
  preferences: ["교통편리", "쇼핑편의", "병원접근성"],
  region: "강남구",
  commute: {
    address: "서울시 종로구 청와대로 1"
  }
};

export const mockRecommendations = [
  {
    dong: "역삼동",
    score: 85,
    reasons: ["지하철 2호선 접근성", "대형마트 다수", "병원 밀집지역"]
  },
  {
    dong: "삼성동", 
    score: 82,
    reasons: ["버스노선 다양", "코엑스 인근", "의료시설 우수"]
  }
];

export const mockEstates = [
  {
    ...mockEstateData,
    id: 1
  },
  {
    ...mockEstateData,
    id: 2,
    photo_url: "https://img.peterpanz.com/photo/20230428/14147469/644b75a7aeea3_origin.jpg",
    address: "서울시 강남구 삼성동 456-78",
    room_type: "투룸",
    price_rent: 70
  }
];

export const mockAIReport = {
  fit_score: 85,
  summary: "교통이 편리하고 생활 인프라가 잘 갖춰진 매물입니다.",
  price_analysis: {
    evaluation: "적정",
    comment: "주변 시세 대비 합리적인 가격입니다."
  },
  pros: [
    "지하철역 도보 5분 거리",
    "대형마트 및 편의시설 인근",
    "치안이 안전한 지역"
  ],
  cons: [
    "주차공간이 협소함",
    "층간소음 우려",
    "엘리베이터 없음"
  ],
  check_points: [
    "실제 방음이 잘 되는지 확인",
    "주차 가능 여부 문의",
    "관리비 포함 항목 확인"
  ]
};

export const mockInfrastructure = {
  schools: [
    { name: "역삼초등학교", distance: 0.3 },
    { name: "강남중학교", distance: 0.8 }
  ],
  subways: [
    { name: "역삼역", line: "2호선", distance: 0.4 },
    { name: "강남역", line: "2호선", distance: 0.6 }
  ],
  hospitals: [
    { name: "강남세브란스병원", distance: 1.2 },
    { name: "역삼의원", distance: 0.2 }
  ],
  marts: [
    { name: "롯데마트", distance: 0.5 },
    { name: "이마트", distance: 0.8 }
  ],
  parks: [
    { name: "역삼근린공원", distance: 0.3 }
  ]
};

export const mockCommuteDetails = {
  driving: 25,
  transit: 35, 
  walking: 80,
  path: [[37.5007, 127.0366], [37.5836, 126.9751]], // 간단한 경로
  destination_coords: { lat: 37.5836, lng: 126.9751 }
};