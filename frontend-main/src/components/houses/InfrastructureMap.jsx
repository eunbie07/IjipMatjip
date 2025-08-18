import {Map as KakaoMap, MapMarker} from 'react-kakao-maps-sdk';
import { ICONS } from '../../assets/images/houses';

const markerIcons = {
  school: { src: ICONS.school, size: { width: 40, height: 40 } },
  subway: { src: ICONS.subway, size: { width: 40, height: 40 } },
  hospital: { src: ICONS.hospital, size: { width: 40, height: 40 } },
  mart: { src: ICONS.mart, size: { width: 40, height: 40 } },
  park: { src: ICONS.park, size: { width: 40, height: 40 } },
};

const InfrastructureMap = ({lat, lng, isEstateMarker = false, markers = []}) => {
  // 원래있던 useEffect API 제거

  return (
    <KakaoMap center={{ lat, lng}} style={{width:'100%', height:'450px'}} level={5}>
      {isEstateMarker && (
        <MapMarker
          position={{ lat, lng }}
          image={{
            src:ICONS.home_pin,
            size:{width:48, height:48},
            options: {offset: {x:24, y:48}}
          }}
        />
      )}
      {markers.map((marker, index) => (
        <MapMarker
          key={index}
          position={{lat:marker.latitude, lng:marker.longitude}}
          image={markerIcons[marker.type]}
          title={marker.name}
        />
      ))}
    </KakaoMap>
  )
}

export default InfrastructureMap