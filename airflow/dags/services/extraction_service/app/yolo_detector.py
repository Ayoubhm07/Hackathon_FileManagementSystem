"""
YOLOv8 document field detector.

Detects bounding boxes of key semantic zones in a document image.
When a trained model (.pt) is provided via YOLO_MODEL_PATH, the detector
activates and returns per-region crops for targeted OCR.  When no model
is available it returns an empty list so the regex/spaCy extractor takes
over — this is the expected behaviour during development / when you only
have OCR text.

Training dataset format expected (YOLO format):
  images/train/*.jpg  |  labels/train/*.txt
  Each label line: <class_id> <cx> <cy> <w> <h>   (normalised 0-1)

  FIELD_CLASSES below define the class index ↔ semantic name mapping.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Class index → semantic name (must match your dataset YAML)
FIELD_CLASSES: list[str] = [
    "company_block",   # 0 – raison sociale, adresse
    "siret_zone",      # 1 – numéro SIRET / SIREN
    "amount_block",    # 2 – tableau HT / TVA / TTC
    "date_zone",       # 3 – date facture / échéance
    "tva_zone",        # 4 – numéro TVA intracommunautaire
    "iban_zone",       # 5 – coordonnées bancaires RIB/IBAN
    "header",          # 6 – en-tête document
    "stamp",           # 7 – tampon / signature
]


class YOLODocumentDetector:
    """
    Wraps the ultralytics YOLOv8 model for document field detection.

    Usage:
        detector = YOLODocumentDetector(model_path="runs/train/exp/weights/best.pt")
        detections = detector.detect("invoice.jpg")
        # [{"field_class": "siret_zone", "confidence": 0.87, "bbox": [x1,y1,x2,y2]}]
    """

    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.4):
        self.enabled = False
        self.conf = conf_threshold
        self._model = None

        if not model_path:
            logger.info("YOLODocumentDetector: no model path — text-only mode")
            return

        model_file = Path(model_path)
        if not model_file.exists():
            logger.warning(
                "YOLODocumentDetector: model file %s not found — text-only mode",
                model_path,
            )
            return

        try:
            from ultralytics import YOLO  # lazy import — not installed in CI
            self._model = YOLO(str(model_file))
            self.enabled = True
            logger.info("YOLODocumentDetector loaded: %s", model_path)
        except ImportError:
            logger.warning("ultralytics not installed — YOLO detection disabled")

    # ------------------------------------------------------------------
    def detect(self, image_path: str) -> list[dict]:
        """
        Run inference on *image_path*.
        Returns a list of detection dicts, one per bounding box found.
        Empty list if model not loaded.
        """
        if not self.enabled or self._model is None:
            return []

        results = self._model(image_path, conf=self.conf, verbose=False)
        detections: list[dict] = []
        for r in results:
            for box in r.boxes:
                cls_idx = int(box.cls[0])
                field_class = (
                    FIELD_CLASSES[cls_idx]
                    if cls_idx < len(FIELD_CLASSES)
                    else f"class_{cls_idx}"
                )
                detections.append(
                    {
                        "field_class": field_class,
                        "confidence": float(box.conf[0]),
                        "bbox": [float(v) for v in box.xyxy[0]],  # [x1,y1,x2,y2]
                    }
                )
        return detections

    def crop_region(self, image_path: str, bbox: list[float]) -> np.ndarray:
        """Return the numpy array of the cropped image region for a given bbox."""
        import cv2  # lazy import

        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Cannot read image: {image_path}")
        x1, y1, x2, y2 = (int(v) for v in bbox)
        return img[y1:y2, x1:x2]
