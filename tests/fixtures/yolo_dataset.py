# Données de test YOLOv8 — document_layout dataset
#
# Format : images/  (fichiers JPG/PNG)
#          labels/  (fichiers .txt, un par image)
#          data.yaml
#
# Utilisation :
#   from pathlib import Path
#   from tests.fixtures.yolo_dataset import YOLO_DATASET_ROOT, load_sample_annotations
#
# Les annotations ci-dessous sont SYNTHÉTIQUES pour les tests unitaires.
# Pour un vrai entraînement, remplacez ce dossier par vos images annotées.

ANNOTATIONS = [
    {
        # Simule une facture 800×1100 px
        "image": "synthetic_invoice_001.jpg",
        "width": 800,
        "height": 1100,
        "boxes": [
            # class_id  cx     cy     w      h    (normalisé)
            {"class_id": 0, "cx": 0.50, "cy": 0.10, "w": 0.90, "h": 0.08},   # company_block
            {"class_id": 1, "cx": 0.35, "cy": 0.22, "w": 0.30, "h": 0.04},   # siret_zone
            {"class_id": 4, "cx": 0.35, "cy": 0.27, "w": 0.30, "h": 0.04},   # tva_zone
            {"class_id": 2, "cx": 0.65, "cy": 0.72, "w": 0.45, "h": 0.20},   # amount_block
            {"class_id": 3, "cx": 0.25, "cy": 0.18, "w": 0.20, "h": 0.04},   # date_zone
            {"class_id": 5, "cx": 0.50, "cy": 0.90, "w": 0.60, "h": 0.06},   # iban_zone
        ],
    },
    {
        # Simule un KBIS 800×1100 px
        "image": "synthetic_kbis_001.jpg",
        "width": 800,
        "height": 1100,
        "boxes": [
            {"class_id": 6, "cx": 0.50, "cy": 0.05, "w": 0.90, "h": 0.08},   # header
            {"class_id": 0, "cx": 0.50, "cy": 0.20, "w": 0.80, "h": 0.12},   # company_block
            {"class_id": 1, "cx": 0.50, "cy": 0.38, "w": 0.50, "h": 0.05},   # siret_zone
            {"class_id": 7, "cx": 0.75, "cy": 0.88, "w": 0.20, "h": 0.10},   # stamp
        ],
    },
]


def to_yolo_label_line(box: dict) -> str:
    return f"{box['class_id']} {box['cx']:.6f} {box['cy']:.6f} {box['w']:.6f} {box['h']:.6f}"


def bbox_to_pixel(box: dict, width: int, height: int) -> dict:
    """Convert normalised YOLO box to pixel coordinates [x1,y1,x2,y2]."""
    cx, cy, w, h = box["cx"] * width, box["cy"] * height, box["w"] * width, box["h"] * height
    return {
        "field_class_id": box["class_id"],
        "bbox": [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
    }
