import os
import io
import logging
from typing import Dict, Any, Union, Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Predefined candidate prompts for zero-shot environmental relevance classification
POSITIVE_PROMPTS = [
    "a real outdoor reforestation field photograph with trees and vegetation",
    "a real forest or tree plantation field photograph",
    "a real environmental field site photograph showing vegetation"
]

NEGATIVE_PROMPTS = [
    "a green wall or painted green surface",
    "a green logo or graphic design",
    "a screenshot, document, chart, or computer graphic",
    "an indoor scene with little vegetation",
    "a road or building with little vegetation",
    "an unrelated object or product photograph"
]

ALL_PROMPTS = POSITIVE_PROMPTS + NEGATIVE_PROMPTS
NUM_POSITIVES = len(POSITIVE_PROMPTS)
MODEL_NAME = "openai/clip-vit-base-patch32"


class CLIPPhotoRelevanceService:
    """
    Singleton service that evaluates environmental photo relevance
    using the pretrained CLIP vision-language model (openai/clip-vit-base-patch32).
    Model weights and processor are loaded once in memory.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CLIPPhotoRelevanceService, cls).__new__(cls)
            cls._instance._model = None
            cls._instance._processor = None
            cls._instance._init_failed = False
            cls._instance._error_msg = None
        return cls._instance

    def _load_model(self):
        if self._model is not None and self._processor is not None:
            return True
        if self._init_failed:
            return False

        try:
            import torch
            from transformers import CLIPProcessor, CLIPModel

            logger.info(f"Loading CLIP model '{MODEL_NAME}' into memory...")
            self._processor = CLIPProcessor.from_pretrained(MODEL_NAME)
            self._model = CLIPModel.from_pretrained(MODEL_NAME)
            self._model.eval()
            logger.info(f"CLIP model '{MODEL_NAME}' successfully loaded.")
            return True
        except Exception as e:
            self._init_failed = True
            self._error_msg = str(e)
            logger.error(f"Failed to load CLIP model '{MODEL_NAME}': {e}")
            return False

    def analyze_image(self, image_input: Union[str, bytes, Image.Image]) -> Dict[str, Any]:
        """
        Evaluate photo relevance against environmental reforestation criteria.

        image_input can be:
        - str: file path (absolute or relative)
        - bytes: raw image byte buffer
        - PIL.Image: pre-loaded PIL Image instance

        Returns:
        {
            "status": "pass" | "watch" | "fail" | "na",
            "semantic_score": float (0-100),
            "top_label": str,
            "is_top_positive": bool,
            "positive_score": float (0.0 - 1.0),
            "negative_score": float (0.0 - 1.0),
            "detail": str,
            "model": str,
            "probabilities": Dict[str, float]
        }
        """
        # 1. Image loading and decoding with strict error handling
        img: Optional[Image.Image] = None
        try:
            if isinstance(image_input, Image.Image):
                img = image_input.convert("RGB")
            elif isinstance(image_input, bytes):
                if not image_input or len(image_input) < 10:
                    raise ValueError("Empty or truncated image bytes")
                img = Image.open(io.BytesIO(image_input)).convert("RGB")
            elif isinstance(image_input, str):
                path = image_input.strip()
                if not path or not os.path.exists(path):
                    raise FileNotFoundError(f"Image file does not exist: {path}")
                img = Image.open(path).convert("RGB")
            else:
                raise TypeError(f"Unsupported image input type: {type(image_input)}")
        except Exception as img_err:
            logger.warning(f"Could not load/decode image for relevance analysis: {img_err}")
            return {
                "status": "na",
                "semantic_score": 0.0,
                "top_label": "n/a",
                "is_top_positive": False,
                "positive_score": 0.0,
                "negative_score": 0.0,
                "detail": "Unable to verify (photo un-decodable)",
                "model": MODEL_NAME,
                "probabilities": {}
            }

        # 2. Ensure model is loaded
        if not self._load_model():
            logger.warning(f"Vision model unavailable ({self._error_msg}), returning NA.")
            return {
                "status": "na",
                "semantic_score": 0.0,
                "top_label": "n/a",
                "is_top_positive": False,
                "positive_score": 0.0,
                "negative_score": 0.0,
                "detail": "Vision model unavailable for evaluation",
                "model": MODEL_NAME,
                "probabilities": {}
            }

        # 3. Model inference
        try:
            import torch

            inputs = self._processor(
                text=ALL_PROMPTS,
                images=img,
                return_tensors="pt",
                padding=True
            )

            with torch.no_grad():
                outputs = self._model(**inputs)
                logits_per_image = outputs.logits_per_image  # shape: (1, num_prompts)
                probs = logits_per_image.softmax(dim=1).squeeze(0).cpu().tolist()

            # Mapping probabilities
            prob_map = {ALL_PROMPTS[i]: round(probs[i], 4) for i in range(len(ALL_PROMPTS))}
            pos_prob = sum(probs[:NUM_POSITIVES])
            neg_prob = sum(probs[NUM_POSITIVES:])

            best_idx = int(probs.index(max(probs)))
            top_label = ALL_PROMPTS[best_idx]
            is_top_positive = best_idx < NUM_POSITIVES
            semantic_score = round(pos_prob * 100, 1)

            # 4. Status decision logic
            # Primary signal is positive probability dominance & top label semantics
            if is_top_positive and pos_prob >= 0.50:
                status = "pass"
                detail = f"{semantic_score}% semantic relevance ({top_label}). Verified environmental field documentation."
            elif pos_prob >= 0.65:
                status = "pass"
                detail = f"{semantic_score}% semantic relevance. Dominant environmental field features confirmed."
            elif not is_top_positive and neg_prob >= 0.60:
                status = "fail"
                detail = f"{semantic_score}% semantic relevance. Flagged: high similarity to non-reforestation content ({top_label}). Photo does not match project criteria."
            elif pos_prob < 0.25:
                status = "fail"
                detail = f"{semantic_score}% semantic relevance. Image lacks significant environmental field characteristics ({top_label})."
            else:
                status = "watch"
                detail = f"{semantic_score}% semantic relevance. Mixed scene or ambiguous environmental content ({top_label}). Review recommended."

            return {
                "status": status,
                "semantic_score": semantic_score,
                "top_label": top_label,
                "is_top_positive": is_top_positive,
                "positive_score": round(pos_prob, 4),
                "negative_score": round(neg_prob, 4),
                "detail": detail,
                "model": MODEL_NAME,
                "probabilities": prob_map
            }

        except Exception as inf_err:
            logger.error(f"Inference error in photo relevance service: {inf_err}", exc_info=True)
            return {
                "status": "na",
                "semantic_score": 0.0,
                "top_label": "n/a",
                "is_top_positive": False,
                "positive_score": 0.0,
                "negative_score": 0.0,
                "detail": "Relevance evaluation error during model inference",
                "model": MODEL_NAME,
                "probabilities": {}
            }


# Singleton accessor
_service_instance: Optional[CLIPPhotoRelevanceService] = None


def get_photo_relevance_service() -> CLIPPhotoRelevanceService:
    global _service_instance
    if _service_instance is None:
        _service_instance = CLIPPhotoRelevanceService()
    return _service_instance


def analyze_photo_relevance(image_input: Union[str, bytes, Image.Image]) -> Dict[str, Any]:
    """Helper functional interface"""
    service = get_photo_relevance_service()
    return service.analyze_image(image_input)
