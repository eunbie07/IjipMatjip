# Room Measure Backend 핵심 코드

## 1. AI 방 감지 핵심 알고리즘

```python
def detect_room_with_ai(image_path: str, confidence_threshold: float = 0.7) -> dict:
    """최신 AI 기반 방 모서리 감지 메인 함수"""
    
    logger.info("개선된 AI 기반 방 모서리 감지 시작...")
    
    try:
        # 이미지 로드
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("이미지를 로드할 수 없습니다")
        
        h, w = img.shape[:2]
        
        # 첫 번째: 앙상블 AI 감지 시도 (최신 개선 버전)
        from .ensemble_detection import ensemble_detector
        
        logger.info("앙상블 AI 감지 시도...")
        ensemble_result = ensemble_detector.detect_room_with_ensemble(
            image_path, confidence_threshold, debug=True)
        
        if ensemble_result["success"] and ensemble_result["confidence"] >= confidence_threshold:
            logger.info(f"AI 감지 성공: 신뢰도 {ensemble_result['confidence']:.2f}")
            return ensemble_result
        
        # 두 번째: 개선된 AI 감지 폴백
        logger.info("개선된 AI 감지 폴백...")
        improved_result = detect_room_corners_improved(image_path, debug=True)
        
        if improved_result["success"]:
            return improved_result
            
        # 세 번째: 세 선 교차점 감지 (기하학적 방법)
        three_line_intersections = detect_three_line_intersections(img, w, h)
        
        if three_line_intersections:
            # 최적 교차점 찾기 → 나머지 3개 포인트 생성 → 정렬
            best_floor_corner = find_best_floor_corner_intersection(
                three_line_intersections, w, h)
            
            remaining_points = generate_remaining_points_from_corner(
                best_floor_corner, three_line_intersections, w, h)
            
            sorted_points = sort_corners_like_manual_clicks(
                [best_floor_corner] + remaining_points, w, h)
            
            return {
                "success": True,
                "detected_points": sorted_points,
                "confidence": 0.85,
                "method": "three_line_intersection_ai"
            }
            
    except Exception as e:
        logger.error(f"AI 방 감지 실패: {str(e)}")
        return {"success": False, "error": str(e), "confidence": 0.0}
```

## 2. 하이브리드 깊이 맵 생성

```python
async def generate_depth_map(file) -> dict:
    """하이브리드 깊이 맵 생성: OpenCV 기본 + MiDaS 보조"""
    try:
        logger.info("하이브리드 깊이 맵 생성 시작...")
        
        # 1단계: OpenCV 기본 깊이 맵 생성 (안정적)
        logger.info("단계 1: OpenCV 기본 깊이 맵 생성...")
        opencv_result = await generate_depth_map_opencv_primary(file)
        
        if not opencv_result["success"]:
            logger.error("OpenCV 기본 깊이 맵 생성 실패")
            return opencv_result
            
        # 2단계: MiDaS 보조 정보 생성 시도 (선택적)
        logger.info("단계 2: MiDaS 보조 정보 생성 시도...")
        midas_result = await generate_depth_map_midas_auxiliary(file)
        
        # 3단계: 결과 조합 및 품질 개선
        logger.info("단계 3: 결과 조합 및 품질 개선...")
        final_result = await combine_depth_results(opencv_result, midas_result)
        
        return final_result
        
    except Exception as e:
        logger.error(f"하이브리드 깊이 맵 생성 실패: {str(e)}")
        # 완전 폴백: 기존 OpenCV 방식
        logger.info("완전 폴백: 기존 OpenCV 방식...")
        return await generate_depth_map_fallback(file)

async def combine_depth_results(opencv_result: dict, midas_result: dict) -> dict:
    """OpenCV와 MiDaS 결과를 스마트하게 조합"""
    try:
        opencv_depth = opencv_result["depth_map"]
        
        # MiDaS 실패 시 OpenCV만 사용
        if not midas_result.get("success", False):
            logger.info("OpenCV 단독 사용 (MiDaS 비가용)")
            final_depth = opencv_depth
            quality_score = opencv_result["quality_score"]
            method = "opencv_only"
        else:
            # 하이브리드 조합
            logger.info("OpenCV + MiDaS 하이브리드 조합")
            midas_depth = midas_result["depth_map"]
            
            # 크기 맞춤
            if opencv_depth.shape != midas_depth.shape:
                midas_depth = cv2.resize(midas_depth, 
                                       (opencv_depth.shape[1], opencv_depth.shape[0]))
            
            # 스마트 블렌딩: OpenCV 10% + MiDaS 90% (MiDaS 거의 단독)
            alpha = 0.1  # OpenCV 가중치
            midas_weight = 1 - alpha
            logger.info(f"하이브리드 블렌딩 비율: OpenCV {alpha*100:.0f}% + MiDaS {midas_weight*100:.0f}%")
            final_depth = alpha * opencv_depth + midas_weight * midas_depth
            
            # 품질 점수 조합
            opencv_quality = opencv_result["quality_score"]
            midas_quality = midas_result["quality_score"]
            quality_score = int(alpha * opencv_quality + (1 - alpha) * midas_quality)
            method = "hybrid_opencv_midas"
        
        # 최종 저장
        os.makedirs(OUTPUTS_DIR, exist_ok=True)
        np.save(DEPTH_MAP_PATH, final_depth)
        
        # 시각화
        h, w = final_depth.shape
        depth_vis = cv2.normalize(final_depth, None, 0, 255, cv2.NORM_MINMAX)
        depth_vis = depth_vis.astype(np.uint8)
        depth_vis_colored = cv2.applyColorMap(depth_vis, cv2.COLORMAP_VIRIDIS)
        cv2.imwrite(DEPTH_IMAGE_PATH, depth_vis_colored)
        
        # 메타데이터
        with open(DEPTH_META_PATH, 'w') as f:
            f.write(f"{w},{h}")
        
        logger.info(f"하이브리드 깊이 맵 완성!")
        logger.info(f"  - 크기: {w} x {h}")
        logger.info(f"  - 방법: {method}")
        logger.info(f"  - 품질: {quality_score}점")
        
        return {
            "success": True,
            "depth_image_url": DEPTH_IMAGE_PATH,
            "depth_width": w,
            "depth_height": h,
            "method": method,
            "quality_score": quality_score,
            "message": f"하이브리드 깊이 맵 생성 완료 ({method})"
        }
        
    except Exception as e:
        logger.error(f"결과 조합 실패: {e}")
        return {"success": False, "error": str(e)}
```

## 3. OpenCV 기반 깊이 맵 생성

```python
async def generate_depth_map_opencv_primary(file) -> dict:
    """OpenCV 기반 기본 깊이 맵 생성 (실내 최적화)"""
    try:
        logger.info("OpenCV 기본 깊이 추정 시작...")
        
        # 이미지 디코딩
        if isinstance(file, str):
            img = cv2.imread(file, cv2.COLOR_BGR2RGB)
        else:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        if img is None:
            raise ValueError("이미지를 디코딩할 수 없습니다")
            
        h, w = img.shape[:2]
        
        # 향상된 깊이 추정 알고리즘
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 원근법 기반 (실내 최적화)
        y_indices, x_indices = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
        perspective_depth = (y_indices / h) * 200 + 150  # 150-350 범위
        
        # 밝기 기반 (향상됨)
        brightness_depth = (1 - blurred / 255.0) * 150 + 200  # 200-350 범위
        
        # 에지 기반
        edges = cv2.Canny(blurred, 30, 100)
        edge_depth = (edges / 255.0) * (-50) + 250  # 에지: 200, 평평한 곳: 250
        
        # 텍스처 기반 (새로 추가)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        texture_variance = cv2.GaussianBlur(np.abs(laplacian), (5, 5), 0)
        texture_depth = (texture_variance / texture_variance.max()) * 100 + 200
        
        # 가중 조합 (실내 환경 최적화)
        depth_map = (perspective_depth * 0.4 +   # 원근법 40%
                    brightness_depth * 0.3 +    # 밝기 30% 
                    edge_depth * 0.2 +          # 에지 20%
                    texture_depth * 0.1)        # 텍스처 10%
        
        # 실내 현실적 범위 제한
        depth_map = np.clip(depth_map, 120, 400)
        
        # 표준 크기로 리사이즈
        target_h, target_w = 192, 256
        depth_map_resized = cv2.resize(depth_map.astype(np.float32), (target_w, target_h))
        
        logger.info(f"OpenCV 기본 깊이 맵 생성 완료 - 크기: {target_w}x{target_h}, 범위: {depth_map_resized.min():.1f}-{depth_map_resized.max():.1f}")
        
        return {
            "success": True,
            "depth_map": depth_map_resized,
            "method": "opencv_primary",
            "quality_score": 85,  # 기본 품질 점수
            "range": {
                "min": float(depth_map_resized.min()),
                "max": float(depth_map_resized.max()),
                "mean": float(depth_map_resized.mean())
            }
        }
        
    except Exception as e:
        logger.error(f"OpenCV 기본 깊이 맵 생성 실패: {e}")
        return {"success": False, "error": str(e)}
```

## 4. MiDaS AI 기반 깊이 맵 생성

```python
async def generate_depth_map_midas_auxiliary(file) -> dict:
    """MiDaS 보조 정보 생성 (품질 개선용)"""
    try:
        # MiDaS 모델 로딩
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = None
        transform = None
        
        try:
            logger.info("MiDaS 보조 모델 로딩...")
            model_type = "MiDaS_small"
            
            try:
                model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
                transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform
            except Exception as ssl_error:
                if "certificate" in str(ssl_error).lower() or "ssl" in str(ssl_error).lower():
                    ssl._create_default_https_context = ssl._create_unverified_context
                    model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
                    transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform
                    if _original_context:
                        ssl._create_default_https_context = _original_context
                else:
                    raise ssl_error
                    
            model.to(device)
            model.eval()
            
        except Exception as e:
            logger.warning(f"MiDaS 보조 모델 로딩 실패, 스킵: {e}")
            return {"success": False, "error": "MiDaS unavailable", "skip": True}
        
        # 이미지 처리
        if isinstance(file, str):
            img = cv2.imread(file, cv2.IMREAD_COLOR)
        else:
            # 파일을 다시 읽어야 함 (이미 읽혔으므로)
            if hasattr(file, 'seek'):
                file.seek(0)
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
        if img is None:
            raise ValueError("이미지 디코딩 실패")
            
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # MiDaS 추론
        input_tensor = transform(img_rgb).to(device)
        with torch.no_grad():
            prediction = model(input_tensor)
        
        midas_depth = prediction.squeeze().cpu().numpy()
        
        # MiDaS 결과를 실내 환경에 맞게 조정
        midas_depth = np.clip(midas_depth, midas_depth.min(), midas_depth.max())
        midas_normalized = ((midas_depth - midas_depth.min()) / 
                           (midas_depth.max() - midas_depth.min()) * 280 + 120)  # 120-400 범위
        
        logger.info(f"MiDaS 보조 정보 생성 완료 - 범위: {midas_normalized.min():.1f}-{midas_normalized.max():.1f}")
        
        return {
            "success": True,
            "depth_map": midas_normalized,
            "method": "midas_auxiliary",
            "quality_score": 92,  # MiDaS 품질 점수
            "range": {
                "min": float(midas_normalized.min()),
                "max": float(midas_normalized.max()),
                "mean": float(midas_normalized.mean())
            }
        }
        
    except Exception as e:
        logger.warning(f"MiDaS 보조 정보 생성 실패, 스킵: {e}")
        return {"success": False, "error": str(e), "skip": True}
```

## 5. 개선된 방 크기 측정

```python
def improved_room_measurement(points: List[Point3D], target_height: float, 
                            correction_info: dict = None) -> dict:
    """개선된 방 크기 측정 함수"""
    
    logger.info("개선된 방 크기 측정 시작...")
    
    try:
        # target_height 검증 및 기본값 설정
        if target_height is None or isnan(target_height) or target_height <= 0:
            target_height = 2.3  # 기본값 2.3m
            logger.warning(f"유효하지 않은 target_height가 감지되어 기본값 {target_height}m로 설정했습니다.")
        
        # 입력 검증
        is_valid, error_msg = validate_points(points)
        if not is_valid:
            raise ValueError(error_msg)
        
        # 포인트 추출 - 올바른 순서로 재정렬
        floor_left = points[0]      # 바닥 왼쪽 모서리 (기준점)
        ceiling_left = points[1]    # 천장 왼쪽 모서리 (높이 측정용)
        floor_back = points[2]      # 바닥 뒤쪽 모서리 (깊이 측정용)  
        floor_right = points[3]     # 바닥 오른쪽 모서리 (너비 측정용)
        
        logger.info(f"측정 포인트:")
        logger.info(f"  바닥왼쪽(기준): ({floor_left.x:.1f}, {floor_left.y:.1f})")
        logger.info(f"  천장왼쪽(높이): ({ceiling_left.x:.1f}, {ceiling_left.y:.1f})")
        logger.info(f"  바닥뒤쪽(깊이): ({floor_back.x:.1f}, {floor_back.y:.1f})")
        logger.info(f"  바닥오른쪽(너비): ({floor_right.x:.1f}, {floor_right.y:.1f})")
        
        # 3D 거리 계산 (MiDaS 깊이 정보 활용)
        height_pixels = distance_2d(floor_left, ceiling_left)     # 수직 거리 (2D 유지)
        width_pixels = distance_3d(floor_left, floor_right)       # 가로 거리 (3D)
        depth_pixels = distance_3d(floor_left, floor_back)        # 세로 거리 (3D)
        
        # 실제 크기 계산 (목표 높이 기준)
        if height_pixels <= 0:
            raise ValueError("높이 픽셀 거리가 0 또는 음수입니다")
        
        # 미터당 픽셀 비율 계산
        pixels_per_meter = height_pixels / target_height
        logger.info(f"미터당 픽셀: {pixels_per_meter:.2f} pixels/m")
        
        # 깊이 기반 원근법 보정 계산
        front_depth = floor_left.z
        back_depth = floor_back.z
        right_depth = floor_right.z
        
        # 깊이 차이에 따른 보정 계수
        depth_correction_width = abs(right_depth - front_depth) / max(front_depth, right_depth, 1.0)
        depth_correction_depth = abs(back_depth - front_depth) / max(front_depth, back_depth, 1.0)
        
        # 강화된 원근법 보정 (과대측정 방지)
        base_reduction = 0.8  # 기본 20% 축소
        perspective_factor_width = base_reduction - (depth_correction_width * 0.4)  # 최대 40% 추가 보정
        perspective_factor_depth = base_reduction - (depth_correction_depth * 0.4)  # 최대 40% 추가 보정
        
        # 최소값 제한 (너무 작아지지 않도록)
        perspective_factor_width = max(perspective_factor_width, 0.5)  # 최소 50%
        perspective_factor_depth = max(perspective_factor_depth, 0.5)  # 최소 50%
        
        # 광각 왜곡 보정 계수 적용
        wide_angle_factor = 1.0  # 기본값
        if correction_info:
            wide_angle_factor = get_measurement_correction_factor(correction_info)
            logger.info(f"광각 보정:")
            logger.info(f"  왜곡 레벨: {correction_info.get('correction_level', 'unknown')}")
            logger.info(f"  측정 보정 계수: {wide_angle_factor:.3f}")
        else:
            logger.info("광각 보정 정보 없음 - 기본값 사용")
        
        # 실제 크기 계산 (원근법 보정 + 광각 보정 적용)
        height_m = target_height
        width_m = (width_pixels / pixels_per_meter) * perspective_factor_width * wide_angle_factor   # 가로 (X축)
        depth_m = (depth_pixels / pixels_per_meter) * perspective_factor_depth * wide_angle_factor   # 세로 (Z축)
        
        # cm 단위로 변환
        height_cm = height_m * 100
        width_cm = width_m * 100  
        depth_cm = depth_m * 100
        
        # 신뢰도 계산
        confidence = calculate_confidence(points)
        
        # 강화된 결과 검증 및 추가 보정
        if width_cm > 500:  # 5m 초과시 추가 축소
            width_reduction = 0.7
            width_cm *= width_reduction
            width_m *= width_reduction
            logger.warning(f"가로 크기 과대측정 감지 - 추가 보정 적용: {width_cm:.1f}cm")
            
        if depth_cm > 500:  # 5m 초과시 추가 축소  
            depth_reduction = 0.7
            depth_cm *= depth_reduction
            depth_m *= depth_reduction
            logger.warning(f"세로 크기 과대측정 감지 - 추가 보정 적용: {depth_cm:.1f}cm")
        
        # 평방미터 계산
        area_sqm = (width_m * depth_m)
        volume_cum = (width_m * depth_m * height_m)
        
        logger.info(f"측정 결과:")
        logger.info(f"  가로: {width_cm:.1f}cm ({width_m:.2f}m)")
        logger.info(f"  세로: {depth_cm:.1f}cm ({depth_m:.2f}m)")
        logger.info(f"  높이: {height_cm:.1f}cm ({height_m:.2f}m)")
        logger.info(f"  면적: {area_sqm:.2f}m²")
        logger.info(f"  부피: {volume_cum:.2f}m³")
        logger.info(f"  신뢰도: {confidence:.1%}")
        
        return {
            "success": True,
            "dimensions": {
                "width_cm": round(width_cm, 1),    # 가로 (X축)
                "depth_cm": round(depth_cm, 1),    # 세로 (Z축)
                "height_cm": round(height_cm, 1),  # 높이 (Y축)
                "width_m": round(width_m, 2),
                "depth_m": round(depth_m, 2),
                "height_m": round(height_m, 2)
            },
            "calculated_values": {
                "area_sqm": round(area_sqm, 2),
                "volume_cum": round(volume_cum, 2),
                "pixels_per_meter": round(pixels_per_meter, 2)
            },
            "pixel_distances": {
                "height_pixels": round(height_pixels, 1),
                "width_pixels": round(width_pixels, 1),
                "depth_pixels": round(depth_pixels, 1)
            },
            "confidence": round(confidence, 3),
            "target_height": target_height,
            "method": "improved_measurement"
        }
        
    except Exception as e:
        logger.error(f"방 크기 측정 실패: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "method": "improved_measurement"
        }
```

## 6. API 엔드포인트 핵심

```python
@router.post("/auto-detect-room")
async def auto_detect_room(file: UploadFile = File(...), 
                          confidence_threshold: float = Query(0.7)):
    """AI를 이용한 자동 방 경계 감지"""
    try:
        if not file.content_type.startswith('image/'):
            return JSONResponse(
                status_code=400,
                content={"error": "이미지 파일만 업로드 가능합니다"}
            )

        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return JSONResponse(
                status_code=400,
                content={"error": "이미지를 읽을 수 없습니다"}
            )

        # 임시 이미지 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            cv2.imwrite(temp_file.name, img)
            temp_image_path = temp_file.name
        
        try:
            # 새로운 AI 기반 방 감지 수행 (더 낮은 임계값으로)
            logger.info("개선된 AI 기반 방 모서리 감지 시작...")
            adjusted_threshold = max(confidence_threshold * 0.7, 0.4)
            result = detect_room_with_ai(temp_image_path, adjusted_threshold)
            
            if result and result.get("success"):
                logger.info(f"AI 감지 완료: {len(result.get('detected_points', []))}개 포인트, 방법: {result.get('method')}")
                return result
            else:
                # AI 감지 실패시 기존 방법으로 폴백
                logger.info("AI 감지 실패, 기존 방법으로 폴백...")
                fallback_result = simulate_roomnet_detection(temp_image_path, confidence_threshold)
                
                if fallback_result and fallback_result.get("success"):
                    return fallback_result
                else:
                    return JSONResponse(
                        status_code=422,
                        content={
                            "success": False,
                            "error": "이미지에서 방 경계를 자동으로 감지할 수 없습니다"
                        }
                    )
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_image_path):
                os.unlink(temp_image_path)
            
    except Exception as e:
        logger.error(f"자동 감지 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"자동 감지 중 오류가 발생했습니다: {str(e)}"
            }
        )

@router.post("/estimate-room-size")
async def estimate_room_size(room_points: RoomPoints):
    """방 크기 측정"""
    try:
        logger.info(f"방 크기 측정 요청: {len(room_points.points)}개 포인트")
        logger.info(f"목표 높이: {room_points.target_height}m")
        
        # target_height 유효성 검사
        if room_points.target_height is None or room_points.target_height <= 0:
            logger.warning(f"유효하지 않은 target_height: {room_points.target_height}, 기본값 2.3m 사용")
            room_points.target_height = 2.3
        
        # 보정 정보 로드 (광각 왜곡 보정에서 저장된 정보)
        correction_info = None
        try:
            import json
            correction_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                                         "outputs", "correction_info.json")
            if os.path.exists(correction_file):
                with open(correction_file, 'r') as f:
                    correction_info = json.load(f)
                    logger.info(f"광각 보정 정보 로드됨: {correction_info.get('correction_level', 'unknown')}")
        except Exception as e:
            logger.warning(f"보정 정보 로드 실패: {e}, 기본값 사용")
        
        # 개선된 방 측정 알고리즘 사용
        result = improved_room_measurement(room_points.points, room_points.target_height, correction_info)
        
        if result and result.get('success'):
            logger.info(f"방 크기 측정 완료: {result}")
            return result
        else:
            return JSONResponse(
                status_code=422,
                content={"error": "방 크기를 측정할 수 없습니다. 포인트를 다시 확인해주세요."}
            )
            
    except Exception as e:
        logger.error(f"방 크기 측정 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"방 크기 측정 중 오류가 발생했습니다: {str(e)}"}
        )
```

## 7. 깊이 값 조회 및 활용

```python
def get_real_depth_values(points: List[dict]) -> List[float]:
    """실제 MiDaS 깊이 값 가져오기"""
    try:
        if not os.path.exists(DEPTH_MAP_PATH):
            logger.warning("MiDaS 깊이맵을 찾을 수 없어 시뮬레이션 값 사용")
            return [100, 95, 110, 105]  # 폴백
        
        depth_map = np.load(DEPTH_MAP_PATH)
        h, w = depth_map.shape
        real_depths = []
        
        for i, point in enumerate(points):
            x, y = int(point["x"]), int(point["y"])
            
            # 좌표 범위 체크
            if 0 <= x < w and 0 <= y < h:
                depth_value = float(depth_map[y, x])
                
                # 유효한 깊이 값인지 확인
                if not (np.isnan(depth_value) or np.isinf(depth_value)):
                    real_depths.append(depth_value)
                    logger.info(f"포인트 {i+1} ({x}, {y}): 깊이 = {depth_value:.3f}")
                else:
                    logger.warning(f"포인트 {i+1}에서 유효하지 않은 깊이 값: {depth_value}")
                    real_depths.append(100 + i * 5)  # 폴백 값
            else:
                logger.warning(f"포인트 {i+1} 좌표 범위 초과: ({x}, {y})")
                real_depths.append(100 + i * 5)  # 폴백 값
        
        logger.info(f"실제 MiDaS 깊이 값: {real_depths}")
        return real_depths
        
    except Exception as e:
        logger.error(f"깊이 값 로딩 실패: {str(e)}")
        return [100, 95, 110, 105]  # 폴백

def get_depth_at_point(x: int, y: int) -> dict:
    """특정 좌표의 깊이 값 조회"""
    try:
        logger.info(f"깊이 값 요청: ({x}, {y})")
        
        if not os.path.exists(DEPTH_MAP_PATH):
            return {
                "success": False,
                "error": "Depth map not found. 먼저 이미지를 업로드하고 depth-map을 생성해주세요."
            }

        depth_map = np.load(DEPTH_MAP_PATH)
        h, w = depth_map.shape
        
        # 좌표 스케일링 및 안전한 클램핑
        original_x, original_y = x, y
        
        # 좌표가 깊이 맵 범위를 벗어나면 스케일링 적용
        if x >= w or y >= h:
            # 비율 기반 스케일링
            scale_x = (w - 1) / max(x, w - 1) if x >= w else 1.0
            scale_y = (h - 1) / max(y, h - 1) if y >= h else 1.0
            scale_factor = min(scale_x, scale_y)
            
            x = int(x * scale_factor)
            y = int(y * scale_factor)
            logger.info(f"좌표 스케일링: ({original_x}, {original_y}) → ({x}, {y}), 스케일: {scale_factor:.3f}")
        
        # 최종 안전 클램핑
        safe_x = max(0, min(x, w-1))
        safe_y = max(0, min(y, h-1))
        
        depth_value = float(depth_map[safe_y, safe_x])
        logger.info(f"  깊이 값: {depth_value:.6f}")

        if np.isnan(depth_value) or np.isinf(depth_value):
            logger.warning(f"유효하지 않은 깊이 값: {depth_value}")
            return {
                "success": False,
                "error": "해당 위치의 깊이 정보가 유효하지 않습니다.",
                "depth_value": str(depth_value),
                "suggestion": "다른 지점을 클릭해보세요."
            }

        return {
            "success": True,
            "depth": depth_value,
            "coordinates": {"x": safe_x, "y": safe_y},
            "original_request": {"x": x, "y": y},
            "depth_map_size": {"width": w, "height": h}
        }
        
    except Exception as e:
        logger.error(f"깊이 값 조회 실패: {str(e)}")
        return {
            "success": False,
            "error": "서버 내부 오류가 발생했습니다.",
            "details": str(e)
        }
```