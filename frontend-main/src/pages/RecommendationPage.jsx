import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import NeighborhoodCard from '../components/houses/NeighborhoodCard';
import { getPhotoUrl } from '../hooks/getPhotoUrl'


const formatPrice = (priceInManwon) => {
  if (!priceInManwon) return '정보 없음';
  if (priceInManwon >= 10000) {
    const eok = Math.floor(priceInManwon / 10000);
    const man = priceInManwon % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${priceInManwon.toLocaleString()}만`;
};

const RecommendationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchConditions = location.state?.conditions;
  const [recommendations, setRecommendations] = useState([]);
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDong, setSelectedDong] = useState(null);

  useEffect(() => {
    if (!searchConditions) {
      alert("검색 조건이 없습니다. 이전 페이지로 돌아갑니다.");
      navigate('/find-house');
      return;
    }

    const fetchAllRecommendations = async () => {
      setLoading(true);

      const cacheKey = `recommendations_${JSON.stringify(searchConditions)}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (cachedData) {
        const { neighborhoods, estates } = JSON.parse(cachedData);
        setRecommendations(neighborhoods || []);
        setEstates(estates || []);
        setLoading(false);
        console.log("캐시된 추천 데이터를 사용합니다.");
        return;
      }

      try {
        console.log("새로운 추천 데이터를 API에서 가져옵니다.");
        // payload는 searchConditions를 그대로 사용하면 됩니다.
        const response = await client.post('/api/recommend/neighborhood', searchConditions);
        const { neighborhoods, estates } = response.data;
        
        setRecommendations(neighborhoods || []);
        setEstates(estates || []);

        sessionStorage.setItem(cacheKey, JSON.stringify({ neighborhoods, estates }));

      } catch (error) {
        console.error('추천 데이터를 불러오는 데 실패했습니다.',  error.response?.data || error);
        alert(error.response?.data?.detail?.[0]?.msg || '데이터를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllRecommendations();
  }, [searchConditions, navigate]);
  
  const handleNeighborhoodClick = (dongName) => {
    setSelectedDong(prev => prev === dongName ? null : dongName);
  };

  const filteredEstates = selectedDong
    ? estates.filter(prop => prop.address.includes(selectedDong))
    : estates;

  if (loading) {
    return <div className="text-center p-10 text-text-secondary bg-background min-h-screen flex items-center justify-center w-full">AI가 최적의 동네와 매물을 찾고 있습니다...</div>;
  }


  return (
    <div className="w-full flex justify-center min-h-screen p-4 py-10 bg-background text-text-primary">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <div className="w-full pt-24 md:pt-28">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">AI <span className="text-primary">Recommendations</span></h2>
          <p className="text-text-secondary mt-2 text-base md:text-lg">Curated neighborhoods and listings based on your input preferences</p>
        </div>
        <div className="w-full">
          <button onClick={() => navigate('/find-house')} className='bg-surface text-text-secondary border border-border font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-background transition flex items-center gap-2'>
            ← 조건 다시 설정하기
          </button>
        </div>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-text-primary'>AI 추천 결과입니다.</h1>
          <p className='text-text-secondary mt-2'>사용자님의 조건을 분석하여 최적의 동네와 매물을 찾았어요.</p>
        </div>
        <section className='flex flex-col gap-2'>
          <div className='flex gap-2 items-center'>
          <h2 className='text-xl font-bold text-text-primary mb-4'>이런 동네는 어떠세요?</h2>
          <button onClick={() => setSelectedDong(null)} className={`bg-surface rounded-xl border-2 ${!selectedDong ? 'border-primary ring-2 ring-primary' :'border-border'} px-1  cursor-pointer`}> 전체보기 </button>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {recommendations.map((dong,index) => (
              <NeighborhoodCard key={index} dongData={dong} onCardClick={handleNeighborhoodClick} isSelected={selectedDong === dong.dong}/>
            ))}
          </div>
        </section>
        <section>
          <h2 className='text-xl font-bold text-text-primary mb-4 flex items-center'>
            맞춤 매물 리스트
            {selectedDong && <span className='text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full ml-3'>{selectedDong}</span>}
          </h2>
          <div className='space-y-4 flex flex-col gap-2'>
            {filteredEstates.length > 0 ? (
              filteredEstates.map(prop => (
                // --- 👇 이 부분 수정 ---
                // Link의 state에 매물 정보(estateData)와 함께
                // 검색 조건(conditions)을 반드시 포함해서 넘겨줍니다.
                <Link to={`/detail/${prop.id}`} state={{ estateData: prop, conditions: searchConditions }} key={prop.id} className='no-underline text-text-primary'>
                  <div className='bg-surface p-4 rounded-xl shadow-lg border border-border flex items-center gap-6 hover:shadow-2xl hover:border-primary transition-all duration-300 cursor-pointer'>
                    <img src={getPhotoUrl(prop.photo_url)[0]} alt={prop.address} className='w-32 h-32 object-cover rounded-lg' onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x130/fbcfe8/4a044e?text=No+Image'; }}/>
                    <div className='flex-grow'>
                      <p className='text-sm font-semibold text-text-secondary'>{prop.address}</p>
                      <h3 className='text-lg font-bold text-text-primary my-1'>{`${prop.room_type}, ${Math.round(prop.area_m2 / 3.3)}평, ${prop.floor}`}</h3>
                      <p className='text-sm text-text-secondary'>관리비 {prop.maintenance_fee.toLocaleString()}원</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-text-secondary'>{prop.deal_type}</p>
                      <p className='font-bold text-lg text-primary'>
                        {prop.deal_type === '월세' 
                          ?`${formatPrice(prop.price_deposit)} / ${prop.price_rent}` : formatPrice(prop.price_deposit)
                        }
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className='text-center py-10 bg-surface rounded-lg'>
                <p className='text-text-secondary'>이 조건에 맞는 매물이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecommendationPage;
