import io
import math
import exifread
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def extract_exif_gps(file_bytes: bytes):
    tags = exifread.process_file(io.BytesIO(file_bytes))
    def convert_to_degrees(value):
        d, m, s = [float(x.num) / float(x.den) for x in value.values]
        return d + (m / 60.0) + (s / 3600.0)

    try:
        lat = convert_to_degrees(tags.get('GPS GPSLatitude'))
        if str(tags.get('GPS GPSLatitudeRef')) == 'S': lat = -lat
        lon = convert_to_degrees(tags.get('GPS GPSLongitude'))
        if str(tags.get('GPS GPSLongitudeRef')) == 'W': lon = -lon
        return lat, lon
    except Exception:
        return None, None

def verify_gps_proximity(img_lat, img_lon, target_lat, target_lon, max_km=10.0):
    if img_lat is None or img_lon is None:
        return False, "No GPS metadata found in photo."
    R = 6371.0
    dlat, dlon = math.radians(target_lat - img_lat), math.radians(target_lon - img_lon)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(img_lat)) * math.cos(math.radians(target_lat)) * math.sin(dlon / 2)**2
    distance = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return (distance <= max_km), f"Distance: {round(distance, 2)} km from project site."

def verify_image_relevance(image: Image.Image):
    categories = ["a photo of reforestation or trees", "a photo of mangrove restoration", "a document or random image"]
    inputs = processor(text=categories, images=image, return_tensors="pt", padding=True)
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)
    best_idx = probs.argmax().item()
    return categories[best_idx], round(probs[0][best_idx].item() * 100, 2)
