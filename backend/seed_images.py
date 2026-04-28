import asyncio
import os
import uuid
from pathlib import Path
from PIL import Image

import sys
# Add current directory to path so we can import modules
sys.path.append(os.getcwd())

from db.database import get_db
import db.history_repo as repo
from services.metadata_service import extract_metadata
from config import UPLOAD_DIR

async def seed():
    # Ensure upload dir exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Root dir of the project (one level up from backend)
    root_dir = Path(__file__).resolve().parent.parent
    
    # Find any DJI images in the root dir or backend/uploads
    # In a real scenario, the user might have placed them in backend/uploads
    sample_images = list(root_dir.glob("DJI*.JPG"))
    
    if not sample_images:
        print("No DJI sample images found in root directory.")
        # Check uploads dir just in case
        sample_images = list(UPLOAD_DIR.glob("DJI*.JPG"))
        
    if not sample_images:
        print("No sample images found to seed.")
        return

    async with get_db() as db:
        for img_path in sample_images:
            print(f"Seeding {img_path.name}...")
            
            # Read image
            with open(img_path, "rb") as f:
                content = f.read()
            
            image_id = str(uuid.uuid4())
            ext = img_path.suffix
            target_path = UPLOAD_DIR / f"{image_id}{ext}"
            
            # Copy to uploads if not already there
            if img_path.resolve() != target_path.resolve():
                target_path.write_bytes(content)
            
            img = Image.open(target_path)
            width, height = img.size
            
            geo = extract_metadata(str(target_path))
            
            lat, lng = (geo['latitude'], geo['longitude']) if geo else (None, None)
            sw_lng, sw_lat = (geo['sw_lng'], geo['sw_lat']) if geo else (None, None)
            ne_lng, ne_lat = (geo['ne_lng'], geo['ne_lat']) if geo else (None, None)
            
            await repo.save_image(
                db, image_id, img_path.name, str(target_path), width, height, len(content),
                lat, lng, sw_lng, sw_lat, ne_lng, ne_lat
            )
            print(f"Seeded {img_path.name} as {image_id}")

if __name__ == "__main__":
    asyncio.run(seed())
