const form = document.getElementById('form');
const providerSelect = document.getElementById('provider');
const jsonRow = document.getElementById('json-row');
const imageRow = document.getElementById('image-row');
const jsonFileInput = document.getElementById('jsonFile');
const imageFileInput = document.getElementById('imageFile');
const styleSelect = document.getElementById('style');
const compositeSettings = document.getElementById('composite-settings');
const controlSelect = document.getElementById('control');
const compositeProviderSelect = document.getElementById('composite-provider');
const modeSelect = document.getElementById('mode');
const alphaSlider = document.getElementById('alpha');
const alphaValue = document.getElementById('alpha-value');
const out = document.getElementById('out');

// Alpha 슬라이더 값 업데이트
alphaSlider.addEventListener('input', (e) => {
    alphaValue.textContent = e.target.value;
});

function updateUIVisibility() {
    const provider = providerSelect.value;
    
    // 모든 UI 요소 초기화
    jsonRow.style.display = 'none';
    imageRow.style.display = 'none';
    compositeSettings.style.display = 'none';
    jsonFileInput.required = false;
    imageFileInput.required = false;
    
    if (provider === 'composite') {
        // Composite: JSON + Image 둘 다 표시
        jsonRow.style.display = 'block';
        imageRow.style.display = 'block';
        compositeSettings.style.display = 'block';
        jsonFileInput.required = true;
        imageFileInput.required = true;
    } else if (provider === 'vertex-json') {
        // JSON만
        jsonRow.style.display = 'block';
        jsonFileInput.required = true;
    } else {
        // Image만
        imageRow.style.display = 'block';
        imageFileInput.required = true;
    }
}

providerSelect.addEventListener('change', updateUIVisibility);
document.addEventListener('DOMContentLoaded', updateUIVisibility);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    out.textContent = '생성 중...';

    const provider = providerSelect.value;
    const style = styleSelect.value;

    if (provider === 'composite') {
        handleCompositeSubmit(style);
    } else if (provider === 'vertex-json') {
        handleJsonSubmit(style);
    } else {
        handleImageSubmit(provider, style);
    }
});

function handleJsonSubmit(style) {
    if (!jsonFileInput.files || jsonFileInput.files.length === 0) {
        out.textContent = 'JSON 파일을 선택해주세요.';
        return;
    }
    const file = jsonFileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
        let jsonData;
        try {
            jsonData = JSON.parse(event.target.result);
        } catch (err) {
            out.textContent = `JSON 파싱 오류: ${err.message}`;
            return;
        }

        const sceneData = jsonData.scene;
        if (!sceneData) {
            out.textContent = 'JSON 파일에 "scene" 키가 없습니다.';
            return;
        }

        const apiUrl = `http://localhost:8000/api/realistic-room-vertex?style=${style}`;

        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sceneData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`서버 오류: ${res.status} - ${errorText}`);
            }
            const data = await res.json();
            displayResults(data.images, `Vertex AI (JSON) - ${style}`);
        } catch (err) {
            out.textContent = err.message;
        }
    };
    reader.readAsText(file);
}

async function handleCompositeSubmit(style) {
    // 파일 검증
    if (!jsonFileInput.files || jsonFileInput.files.length === 0) {
        out.textContent = 'JSON 파일을 선택해주세요.';
        return;
    }
    if (!imageFileInput.files || imageFileInput.files.length === 0) {
        out.textContent = '이미지 파일을 선택해주세요.';
        return;
    }

    const jsonFile = jsonFileInput.files[0];
    const imageFile = imageFileInput.files[0];
    
    // Composite 설정값 가져오기
    const control = controlSelect.value;
    const provider = compositeProviderSelect.value;
    const mode = modeSelect.value;
    const alpha = parseFloat(alphaSlider.value);

    try {
        // JSON 파일 읽기
        const jsonText = await readFileAsText(jsonFile);
        const jsonData = JSON.parse(jsonText);
        const sceneData = jsonData.scene || jsonData;

        // FormData 생성
        const fd = new FormData();
        fd.append('scene_json', JSON.stringify(sceneData));
        fd.append('capture', imageFile);
        fd.append('style', style);
        fd.append('control', control);
        fd.append('provider', provider);
        fd.append('mode', mode);
        fd.append('alpha', alpha.toString());

        out.textContent = `생성 중... (${provider}, ${control}, alpha=${alpha})`;

        const apiUrl = 'http://localhost:8000/api/realistic-room-composite';
        const res = await fetch(apiUrl, {
            method: 'POST',
            body: fd,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`서버 오류: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        displayResults(data.images, `🚀 Composite (${provider}) - ${style}`);
        
    } catch (err) {
        out.textContent = err.message;
    }
}

// Helper function to read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

async function handleImageSubmit(provider, style) {
    if (!imageFileInput.files || imageFileInput.files.length === 0) {
        out.textContent = '이미지 파일을 선택해주세요.';
        return;
    }
    const file = imageFileInput.files[0];
    const fd = new FormData();
    fd.append('image', file);
    fd.append('style', style);
    fd.append('provider', provider);  // ✅ Provider 파라미터 추가!
    
    console.log(`[Frontend] 선택된 제공자: ${provider}, 스타일: ${style}`);
    const apiUrl = 'http://localhost:8000/api/realistic-room-upload';

    try {
        const res = await fetch(apiUrl, { method: 'POST', body: fd });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        displayResults(data.images, `${provider} (Image) - ${style}`);
    } catch (err) {
        out.textContent = err.message;
    }
}

function displayResults(images, title) {
    out.innerHTML = '';
    (images || []).forEach((url, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        const img = document.createElement('img');
        img.src = url;
        const info = document.createElement('p');
        info.textContent = title;
        info.style.fontSize = '12px';
        info.style.color = '#666';
        const a = document.createElement('a');
        a.href = url;
        a.download = `realistic_result_${idx}.png`;
        a.textContent = '다운로드';
        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(a);
        out.appendChild(card);
    });
}
