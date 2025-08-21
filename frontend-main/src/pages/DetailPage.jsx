import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import InfrastructureMap from '../components/houses/InfrastructureMap';
import { getPhotoUrl } from '../hooks/getPhotoUrl';
import Slider from "react-slick"; 
// --- 아이콘 컴포넌트 ---
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const Share2Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
);
const HeartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);
const ZapIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2z"/></svg>
);
const CheckCircleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const XCircleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const MapPinIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ShoppingCartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);
const HospitalIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 11h4"/><path d="M14 9v4"/></svg>
);
const SubwayIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M18 10c-3 0-3-3-3-3s0-3-3-3-3 3-3 3"/><path d="M12 18V6"/><path d="m15 6-3-3-3 3"/><path d="M3 3v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V3"/></svg>
);
const ParkIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s-4-2-4-8 4-8 4-8 4 2 4 8-4 8-4 8Z"/><path d="M12 22V12"/><path d="m15 15-3-3-3 3"/><path d="M12 12V2"/></svg>
);
const ClipboardCheckIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
);
const WandIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M14 19h4"/><path d="M17 17v4"/></svg>
);
const CarIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><path d="M10 17h4"/><rect x="3" y="17" width="18" height="4" rx="2"/><circle cx="6.5" cy="19.5" r="0.5"/><circle cx="17.5" cy="19.5" r="0.5"/></svg>
);
const BusIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.4 6.8 19.8 6 19 6H5c-.8 0-1.4.8-1.6 1.8L2 12v4c0 .5.5 1 1 1h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
);
const WalkingIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22c1.1 0 2-.9 2-2v-6.5l1.4-1.1c.6-.5 1.1-1.3.8-2.1l-1-3.3c-.3-1-1.3-1.8-2.4-1.8H7.8c-1.1 0-2.1.8-2.4 1.8l-1 3.3c-.3.8.2 1.6.8 2.1l1.4 1.1V20c0 1.1.9 2 2 2h4Z"/><circle cx="12" cy="4" r="2"/></svg>
);

// 가격 포맷팅 함수
const formatPrice = (prop) => {
  if (!prop) return '정보 없음';
  if (prop.deal_type === '월세') {
    const deposit = prop.price_deposit >= 10000 ? `${(prop.price_deposit / 10000).toFixed(0)}억` : `${prop.price_deposit}만`;
    return `${deposit} / ${prop.price_rent}`;
  }
  if (prop.deal_type === '전세') {
    return prop.price_deposit >= 10000 ? `${(prop.price_deposit / 10000).toFixed(1)}억` : `${prop.price_deposit}만`;
  }
  return '정보 없음';
};

// --- 슬라이더 커스텀 화살표 컴포넌트 ---
const NextArrow = ({ onClick }) => {
  return (
    <div
      className="absolute top-1/2 right-4 -translate-y-1/2 z-10 cursor-pointer bg-white/50 rounded-full p-2 hover:bg-white transition-colors shadow-md"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7E97" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  );
};

const PrevArrow = ({ onClick }) => {
  return (
    <div
      className="absolute top-1/2 left-4 -translate-y-1/2 z-10 cursor-pointer bg-white/50 rounded-full p-2 hover:bg-white transition-colors shadow-md"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7E97" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </div>
  );
};


const DetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const estateData = location.state?.estateData;
  const photo_urls = getPhotoUrl(estateData?.photo_url);
  const searchConditions = location.state?.conditions;

  const [aiReport, setAiReport] = useState(null);
  const [infrastructure, setInfrastructure] = useState({ schools: [], subways: [], hospitals: [], marts: [], parks: [] });
  const [loading, setLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(true);
  const [commuteDetails, setCommuteDetails] = useState(null);
  const [workMarker, setWorkMarker] = useState(null)
  
  const [selectedImage, setSelectedImage] = useState(photo_urls?.[0] || 'https://placehold.co/800x500/e2e8f0/4a5568?text=Image');

  useEffect(() => {
    setSelectedImage(photo_urls?.[0] || 'https://placehold.co/800x500/e2e8f0/4a5568?text=Image');
  },[estateData?.id]);
  
  useEffect(() => {
    if (!estateData) {
      setLoading(false);
      setIsReportLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setIsReportLoading(true);
      
      const cacheKey = `detail_page_data_v3_${estateData.id}_${searchConditions?.commute?.address || ''}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (cachedData) {
        const { report, infra, commute } = JSON.parse(cachedData);
        setAiReport(report);
        setInfrastructure(infra);
        setCommuteDetails(commute);
        if (commute?.destination_coords) {
          setWorkMarker({ ...commute.destination_coords, type: 'work' });
        }
        setLoading(false);
        setIsReportLoading(false);
        return;
      }

      try {
        const promises = [
          client.post('/api/infrastructure',{ latitude: estateData.latitude, longitude: estateData.longitude, radius_km:1.0 }),
          client.post('/api/report/generate',{ property_data : estateData, user_preferences: { preferences: searchConditions.preferences, region: searchConditions.region } })
        ];

        let commutePromise = Promise.resolve(null);
        if (searchConditions?.commute?.address) {
            commutePromise = client.post('/api/geocode', { address: searchConditions.commute.address })
                .then(geocodeRes => {
                    const workCoords = geocodeRes.data;
                    return client.post('/api/commute-details', {
                        origin: { lat: estateData.latitude, lng: estateData.longitude },
                        destination: workCoords,
                    });
                })
                .then(commuteRes => ({
                    driving: commuteRes.data.driving_minutes,
                    transit: commuteRes.data.transit_minutes,
                    walking: commuteRes.data.walking_minutes,
                    path: commuteRes.data.driving_path,
                    destination_coords: commuteRes.data.destination_coords,
                }))
                .catch(err => {
                    console.error("출퇴근 시간 계산 실패:", err);
                    return { driving: '계산 실패', transit: '계산 실패', walking: '계산 실패', path: [] };
                });
        }
        promises.push(commutePromise);

        const [infraResult, reportResult, commuteResult] = await Promise.all(promises);
        
        setInfrastructure(infraResult.data);
        setAiReport(reportResult.data);
        setCommuteDetails(commuteResult);
        if (commuteResult?.destination_coords){
          setWorkMarker({...commuteResult.destination_coords, type:'work'})
        }
        setLoading(false);
        setIsReportLoading(false);

        sessionStorage.setItem(cacheKey, JSON.stringify({
          report: reportResult.data,
          infra: infraResult.data,
          commute: commuteResult,
        }));

      } catch (error) {
        console.error("상세 정보 로딩 실패:", error);
        setLoading(false);
        setIsReportLoading(false);
      }
    };

    fetchDetails();
  }, [estateData, searchConditions]);

  const handleGoToRoomPlanner = () => {
    if(!selectedImage) {
        alert("방 꾸미기에 사용할 대표 사진을 선택해주세요.");
        return;
    }
    navigate(`/room-planner?imageUrl=${encodeURIComponent(selectedImage)}`);
  };

  if (loading) {
    return <div className="text-center p-10">매물 정보를 불러오는 중입니다...</div>;
  }

  if (!estateData) {
    return (
      <div className="text-center p-10">
        <p>매물 정보가 없습니다.</p>
        <Link to="/find-house" className="text-blue-500 hover:underline">처음으로 돌아가기</Link>
      </div>
    );
  }
  
  const infraList = [
    { name: '대형마트', count: infrastructure.marts.length, Icon: ShoppingCartIcon, color: 'text-blue-500' },
    { name: '병원', count: infrastructure.hospitals.length, Icon: HospitalIcon, color: 'text-red-500' },
    { name: '지하철역', count: infrastructure.subways.length, Icon: SubwayIcon, color: 'text-green-500' },
    { name: '공원', count: infrastructure.parks.length, Icon: ParkIcon, color: 'text-yellow-500' },
  ];

  const priceEvalColors = {
    '저렴': 'bg-blue-100 text-blue-800',
    '적정': 'bg-green-100 text-green-800',
    '높음': 'bg-red-100 text-red-800',
  };

  const sliderSettings = {
    dots: true,
    infinite: photo_urls.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 3000,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  const hasCommuteInfo = commuteDetails && (commuteDetails.driving || commuteDetails.transit || commuteDetails.walking);

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <style>{`
        .slick-prev:before,
        .slick-next:before {
          color: #FF7E97 !important;
        }
      `}</style>
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-20">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-slate-900">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-semibold">목록으로</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><Share2Icon className="w-5 h-5 text-gray-600"/></button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><HeartIcon className="w-5 h-5 text-gray-600"/></button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto max-w-6xl p-4 flex flex-col gap-8">
        
        <section>
          <div className='mb-6'>
              <h1 className="text-3xl font-bold text-slate-900">{estateData.room_type}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1"><MapPinIcon /> {estateData.address}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-gray-200">
                <div><p className="text-sm text-gray-500">거래 종류</p><p className="font-bold text-xl text-slate-800 mt-1">{estateData.deal_type}</p></div>
                <div><p className="text-sm text-gray-500">가격</p><p className="font-bold text-xl text-slate-800 mt-1">{formatPrice(estateData)}</p></div>
                <div><p className="text-sm text-gray-500">면적</p><p className="font-bold text-xl text-slate-800 mt-1">{`${Math.round(estateData.area_m2 / 3.3)}평`}</p></div>
                <div><p className="text-sm text-gray-500">층</p><p className="font-bold text-xl text-slate-800 mt-1">{estateData.floor}</p></div>
            </div>
          </div>
        </section>

        <section className="w-full relative">
            <Slider {...sliderSettings}>
                {photo_urls && photo_urls.map((img, index) => (
                    <div key={index}>
                        <img 
                            src={img} 
                            alt={`Slide ${index + 1}`} 
                            className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
                        />
                    </div>
                ))}
            </Slider>
        </section>

        {isReportLoading ? (
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md text-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <p className="font-semibold text-gray-600 mt-4">AI가 심층 분석 리포트를 생성 중입니다...</p>
          </div>
        ) : aiReport && (
          <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md flex flex-col gap-5">
              <div className="flex items-center gap-3">
                  <ZapIcon className="w-8 h-8 text-[#FF7E97]" />
                  <h2 className="text-2xl font-bold text-slate-900">AI 심층 분석</h2>
                  <span className="px-3 py-1 text-sm font-bold text-white bg-gradient-to-r from-[#FF7E97] to-[#f89baf] rounded-full">
                      적합도 {aiReport.fit_score}점
                  </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#FF7E97]">
                  <p className="text-sm font-bold text-slate-600 mb-1">"AI 한 줄 총평"</p>
                  <p className="text-gray-800 text-lg font-semibold italic">{aiReport.summary}</p>
              </div>

              <div className='bg-gray-50 p-4 rounded-lg'>
                  <h4 className="font-bold text-slate-800 mb-2">💰 가격 분석</h4>
                  <div className='flex items-center gap-3'>
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${priceEvalColors[aiReport.price_analysis.evaluation] || 'bg-gray-100 text-gray-800'}`}>
                          {aiReport.price_analysis.evaluation}
                      </span>
                      <p className='text-sm text-gray-700'>{aiReport.price_analysis.comment}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <h4 className="font-bold text-green-600 mb-2">👍 추천하는 이유</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                          {aiReport.pros.map((pro, i) => <li key={i} className="flex gap-2"><CheckCircleIcon className="text-green-500 flex-shrink-0 mt-0.5"/>{pro}</li>)}
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-red-600 mb-2">🤔 고려할 점</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                          {aiReport.cons.map((con, i) => <li key={i} className="flex gap-2"><XCircleIcon className="text-red-500 flex-shrink-0 mt-0.5"/>{con}</li>)}
                      </ul>
                  </div>
              </div>

              <div className='bg-gray-50 p-4 rounded-lg border-t-2 border-dashed border-pink-200 mt-2'>
                  <h4 className="font-bold text-slate-800 mb-2">📝 방문 전 체크포인트</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                      {aiReport.check_points.map((point, i) => <li key={i} className="flex gap-2"><ClipboardCheckIcon className="text-slate-500 flex-shrink-0 mt-0.5"/>{point}</li>)}
                  </ul>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleGoToRoomPlanner}
                  className="w-full bg-gradient-to-r from-[#FF7E97] to-[#F89BAF] text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#FF7E97]/40 hover:scale-105 transition-transform"
                >
                  <WandIcon className="w-6 h-6" />
                  AI로 이 방 꾸며보기
                </button>
              </div>
          </section>
        )}
        
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">위치 및 주변 정보</h2>
            <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden mb-6">
              <InfrastructureMap 
                lat={estateData.latitude} 
                lng={estateData.longitude} 
                isEstateMarker={true}
                markers={workMarker ? [workMarker] : []}
                routePath={commuteDetails?.path} 
              />
            </div>
            {hasCommuteInfo && (
                <div className="mb-6 pb-4 border-gray-200 flex items-center justify-center">
                     <h3 className="text-lg font-bold text-slate-800 text-center mr-6">🚶‍♂️ 직장까지 예상 소요 시간</h3>
                     <div className="flex justify-center items-center gap-8">
                        {commuteDetails.walking && (
                            <div className="text-center flex gap-2">
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><WalkingIcon className="w-4 h-4"/>도보</p>
                                <p className="font-bold text-2xl text-pink-500">{commuteDetails.walking}분</p>
                            </div>
                        )}
                        {commuteDetails.transit && (
                            <div className="text-center flex gap-2">
                                <p className="font-bold text-2xl text-pink-500">{commuteDetails.transit}분</p>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><BusIcon className="w-4 h-4"/>대중교통</p>
                            </div>
                        )}
                        {commuteDetails.driving && (
                            <div className="text-center flex gap-2">
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><CarIcon className="w-4 h-4"/>자가용</p>
                                <p className="font-bold text-2xl text-pink-500">{commuteDetails.driving}분</p>
                            </div>
                        )}
                     </div>
                </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {infraList.map(item => (
                <div key={item.name} className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <item.Icon className={`w-8 h-8 ${item.color} mb-2`} />
                  <p className="font-semibold text-sm text-slate-700">{item.name}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.count}개</p>
                </div>
              ))}
            </div>
        </section>
        
      </main>
    </div>
  );
};

export default DetailPage;
