import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import * as THREE from "three";

export const extractMeshesToSeparateFiles = async () => {
  const loader = new GLTFLoader();
  const exporter = new GLTFExporter();

  try {
    console.log("GLB 파일 로딩 중...");
    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        "/low_poly_furnitures_full_bundle.glb",
        resolve,
        undefined,
        reject
      );
    });

    console.log("=== 메시 추출 시작 ===");
    const meshes = [];

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push({
          name: child.name,
          mesh: child.clone(),
        });
      }
    });

    console.log(`총 ${meshes.length}개의 메시를 찾았습니다.`);

    for (let i = 0; i < meshes.length; i++) {
      const { name, mesh } = meshes[i];

      try {
        const scene = new THREE.Scene();
        mesh.position.set(0, 0, 0);
        scene.add(mesh);

        const result = await new Promise((resolve, reject) => {
          exporter.parse(
            scene,
            (gltf) => resolve(gltf),
            { binary: true },
            (error) => reject(error)
          );
        });

        const blob = new Blob([result], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${name}.glb`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        console.log(`✅ ${name}.glb 파일 다운로드 완료`);

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ ${name} 메시 내보내기 실패:`, error);
      }
    }

    console.log("=== 모든 메시 추출 완료 ===");
  } catch (error) {
    console.error("GLB 파일 처리 실패:", error);
  }
};