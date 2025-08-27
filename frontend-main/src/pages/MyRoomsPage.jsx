import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRooms, loadRoomById, deleteRoom } from '../utils/api';

const MyRoomsPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomList = await getUserRooms();
      setRooms(roomList);
      setError(null);
    } catch (error) {
      console.error('방 목록 로드 실패:', error);
      setError(error.message);
      
      // 실패 시 localStorage 백업 사용
      const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      if (savedRooms.length > 0) {
        setRooms(savedRooms.map((room, index) => ({
          id: room.mongoId || index,
          scene: room,
          created_at: room.createdAt,
          isLocalBackup: true
        })));
        setError('네트워크 오류: 로컬 백업 데이터를 표시합니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room) => {
    // 방 데이터를 localStorage에 저장하고 Room Planner로 이동
    const roomData = room.scene || room.layout_data?.scene;
    
    if (roomData) {
      // 임시로 localStorage에 저장
      localStorage.setItem('tempLoadedRoom', JSON.stringify({
        result: roomData.result,
        placedFurniture: roomData.placedFurniture || [],
        imageUrl: roomData.imageUrl || null,
        roomMeasurementPoints: roomData.roomMeasurementPoints || null,
        uploadMethod: roomData.uploadMethod || 'manual'
      }));
      
      // Room Planner로 이동
      navigate('/room-planner?loadRoom=true');
    } else {
      alert('방 데이터를 불러올 수 없습니다.');
    }
  };

  const handleDeleteRoom = async (room, event) => {
    // 이벤트 전파 방지 (방 클릭 이벤트와 분리)
    event.stopPropagation();
    
    const roomName = getRoomName(room);
    
    if (!confirm(`"${roomName}" 방을 정말 삭제하시겠습니까?\n삭제된 방은 복구할 수 없습니다.`)) {
      return;
    }
    
    try {
      if (room.isLocalBackup) {
        // 로컬 백업 데이터 삭제
        const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
        const filteredRooms = savedRooms.filter((_, index) => index !== room.id);
        localStorage.setItem('savedRooms', JSON.stringify(filteredRooms));
        
        // 상태 업데이트
        setRooms(prevRooms => prevRooms.filter(r => r.id !== room.id));
        alert(`"${roomName}" 방이 삭제되었습니다.`);
      } else {
        // MongoDB에서 삭제
        await deleteRoom(room.id);
        
        // 상태에서 제거
        setRooms(prevRooms => prevRooms.filter(r => r.id !== room.id));
        alert(`"${roomName}" 방이 삭제되었습니다.`);
        
        // localStorage 백업에서도 제거 (있다면)
        const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
        const filteredRooms = savedRooms.filter(savedRoom => savedRoom.mongoId !== room.id);
        localStorage.setItem('savedRooms', JSON.stringify(filteredRooms));
      }
    } catch (error) {
      console.error('방 삭제 실패:', error);
      alert(`방 삭제 실패: ${error.message}`);
    }
  };

  const getRoomName = (room) => {
    return room.scene?.name || room.layout_data?.scene?.name || `방 ${room.id}`;
  };

  const getRoomDimensions = (room) => {
    const roomData = room.scene || room.layout_data?.scene;
    const result = roomData?.result;
    
    if (result) {
      const width = (result.dimensions?.width_cm || result.width_cm || 0) / 100;
      const depth = (result.dimensions?.depth_cm || result.depth_cm || 0) / 100;
      const height = (result.dimensions?.height_cm || result.height_cm || 0) / 100;
      return `${width.toFixed(1)}m × ${depth.toFixed(1)}m × ${height.toFixed(1)}m`;
    }
    
    return '크기 정보 없음';
  };

  const getFurnitureCount = (room) => {
    const roomData = room.scene || room.layout_data?.scene;
    return roomData?.placedFurniture?.length || 0;
  };

  const getAIGeneratedImages = (room) => {
    const roomData = room.scene || room.layout_data?.scene;
    return roomData?.aiGeneratedImages || null;
  };

  const hasAIImages = (room) => {
    const aiImages = getAIGeneratedImages(room);
    return aiImages && (aiImages.designImage || aiImages.realisticImage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 pt-24">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-secondary">방 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            내 <span className="text-primary">방 목록</span>
          </h1>
          <p className="text-lg text-text-secondary">
            저장된 방들을 확인하고 다시 불러올 수 있습니다
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-yellow-800">{error}</span>
            </div>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">저장된 방이 없습니다</h3>
            <p className="text-text-secondary mb-6">Room Planner에서 방을 측정하고 저장해보세요</p>
            <button
              onClick={() => navigate('/room-planner')}
              className="px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg"
            >
              방 측정하러 가기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <div
                key={room.id || index}
                onClick={() => handleRoomClick(room)}
                className="bg-surface rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
              >
                {/* AI 생성 이미지 미리보기 */}
                {hasAIImages(room) && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getAIGeneratedImages(room).realisticImage || getAIGeneratedImages(room).designImage}
                      alt={`${getRoomName(room)} AI 인테리어`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                      AI 생성
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {getRoomName(room)}
                    </h3>
                    <div className="flex items-center gap-2">
                      {room.isLocalBackup && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          로컬
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteRoom(room, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="방 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span>{getRoomDimensions(room)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>가구 {getFurnitureCount(room)}개</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {room.created_at ? new Date(room.created_at).toLocaleDateString() : '날짜 없음'}
                      </span>
                    </div>
                    
                    {hasAIImages(room) && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-purple-600 font-medium">AI 인테리어 생성됨</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">클릭하여 불러오기</span>
                      <svg className="w-5 h-5 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {rooms.length > 0 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/room-planner')}
              className="px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors shadow-lg"
            >
              새 방 측정하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoomsPage;