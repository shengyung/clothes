"""
Gemini Virtual Try-On 實驗腳本
用法：python test_gemini_tryon.py --person 人像路徑 --garment 服裝路徑
"""

import argparse
import base64
import os
import sys
from pathlib import Path

try:
    import google.generativeai as genai
except ImportError:
    print("請先安裝：pip install google-generativeai")
    sys.exit(1)

from PIL import Image
import io


def load_image_as_base64(path: str) -> tuple[str, str]:
    """載入圖片，回傳 (base64_data, mime_type)"""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"找不到圖片：{path}")

    suffix = path.suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    mime_type = mime_map.get(suffix, "image/jpeg")

    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    return data, mime_type


def run_tryon(api_key: str, person_path: str, garment_path: str, output_path: str = "tryon_result.png"):
    genai.configure(api_key=api_key)

    print(f"載入人像：{person_path}")
    person_data, person_mime = load_image_as_base64(person_path)

    print(f"載入服裝：{garment_path}")
    garment_data, garment_mime = load_image_as_base64(garment_path)

    model = genai.GenerativeModel("gemini-2.0-flash-preview-image-generation")

    prompt = """You are a virtual try-on assistant.
Generate a photorealistic image of the person in the first image wearing the garment shown in the second image.

Requirements:
- Keep the person's face, skin tone, body proportions, and pose exactly the same
- Replace only the clothing with the garment from the second image
- Maintain natural lighting and shadows
- The result should look like a real photo, not an illustration
- Keep the background from the original person photo

Output only the resulting try-on image."""

    print("呼叫 Gemini API...")

    response = model.generate_content(
        [
            prompt,
            {"mime_type": person_mime, "data": person_data},
            {"mime_type": garment_mime, "data": garment_data},
        ],
        generation_config=genai.GenerationConfig(
            response_modalities=["image", "text"],
        ),
    )

    # 找到圖片 part
    image_saved = False
    for part in response.candidates[0].content.parts:
        if hasattr(part, "inline_data") and part.inline_data:
            image_data = base64.b64decode(part.inline_data.data)
            img = Image.open(io.BytesIO(image_data))
            img.save(output_path)
            print(f"✅ 結果儲存到：{output_path}（{img.size[0]}x{img.size[1]}）")
            image_saved = True
            break
        elif hasattr(part, "text") and part.text:
            print(f"模型回應文字：{part.text[:200]}")

    if not image_saved:
        print("❌ 沒有拿到圖片輸出，模型可能不支援圖片生成")
        print("完整回應：", response)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gemini Virtual Try-On 測試")
    parser.add_argument("--person", required=True, help="人像圖片路徑")
    parser.add_argument("--garment", required=True, help="服裝圖片路徑")
    parser.add_argument("--output", default="tryon_result.png", help="輸出路徑（預設 tryon_result.png）")
    parser.add_argument("--key", help="Google AI API key（或設 GOOGLE_AI_API_KEY 環境變數）")
    args = parser.parse_args()

    api_key = args.key or os.environ.get("GOOGLE_AI_API_KEY")
    if not api_key:
        print("請提供 API key：--key YOUR_KEY 或 export GOOGLE_AI_API_KEY=YOUR_KEY")
        sys.exit(1)

    run_tryon(api_key, args.person, args.garment, args.output)
