import os
from abc import ABC, abstractmethod

# Local storage folder inside backend
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class BaseStorage(ABC):
    @abstractmethod
    async def save_file(self, file_bytes: bytes, filename: str) -> str:
        pass

class LocalStorage(BaseStorage):
    async def save_file(self, file_bytes: bytes, filename: str) -> str:
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{filename}"

# Active adapter (change to SupabaseStorage class later when ready)
storage_service = LocalStorage()
