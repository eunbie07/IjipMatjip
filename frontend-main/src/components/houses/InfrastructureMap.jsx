import { Map as KakaoMap, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { ICONS } from '../../assets/images/houses';

const markerIcons = {
  // --- 👇 'work' 타입의 마커는 ICONS.company 이미지를 사용하도록 연결합니다 ---
  work: { src: ICONS.company, size: { width: 48, height: 48 }, options: { offset: { x: 24, y: 24 } } },
};

const InfrastructureMap = ({ lat, lng, isEstateMarker = false, markers = [], routePath = [] }) => {

  return (
    <KakaoMap center={{ lat, lng }} style={{ width: '100%', height: '100%' }} level={5}>
      {/* 집 마커 */}
      {isEstateMarker && (
        <MapMarker
          position={{ lat, lng }}
          image={{
            src: ICONS.home_pin,
            size: { width: 48, height: 48 },
            options: { offset: { x: 24, y: 48 } }
          }}
          title="현재 매물"
        />
      )}
      
      {/* 직장 마커 (markers 배열에 있는 데이터를 기반으로 표시) */}
      {markers.map((marker, index) => (
        <MapMarker
          key={index}
          position={{ lat: marker.lat, lng: marker.lng }}
          image={markerIcons[marker.type]} // marker.type이 'work'이면 work 아이콘을 사용
          title={marker.name || '직장'}
        />
      ))}
      
      {/* 출퇴근 경로 */}
      {routePath && routePath.length > 0 && (
        <Polyline
          path={routePath}
          strokeWeight={5}
          strokeColor={"#FF7E97"}
          strokeOpacity={0.9}
          strokeStyle={"solid"}
        />
      )}
    </KakaoMap>
  )
}

export default InfrastructureMap;
