#!/usr/bin/env python3
"""
train.py — Train the TF-IDF + LogisticRegression document classifier.

Reads .txt files from the samples directory, infers labels from folder names,
trains a scikit-learn Pipeline, and saves classifier.joblib.

Usage:
  python train.py --samples ./samples --output ../classification-service/models/classifier.joblib
"""
import argparse
from pathlib import Path

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

# Map folder name → document type label
FOLDER_LABEL_MAP = {
    "invoices": "FACTURE",
    "factures": "FACTURE",
    "devis":    "DEVIS",
    "siret":    "SIRET_ATTESTATION",
    "kbis":     "KBIS",
    "noisy":    None,   # noisy variants: infer from filename prefix
}

FILENAME_LABEL_MAP = {
    "facture": "FACTURE",
    "devis":   "DEVIS",
    "siret":   "SIRET_ATTESTATION",
    "kbis":    "KBIS",
    "noisy_facture": "FACTURE",
    "noisy_devis":   "DEVIS",
    "noisy_siret":   "SIRET_ATTESTATION",
    "noisy_kbis":    "KBIS",
}


def infer_label(folder: str, filename: str) -> str | None:
    label = FOLDER_LABEL_MAP.get(folder)
    if label is not None:
        return label
    # Try to infer from filename prefix (e.g. "noisy_facture_0001.txt")
    for prefix, doc_type in FILENAME_LABEL_MAP.items():
        if filename.startswith(prefix):
            return doc_type
    return None


def load_dataset(samples_dir: Path) -> tuple[list[str], list[str]]:
    texts: list[str] = []
    labels: list[str] = []

    for folder in samples_dir.iterdir():
        if not folder.is_dir():
            continue
        for txt_file in folder.glob("*.txt"):
            label = infer_label(folder.name, txt_file.name)
            if label is None:
                print(f"  [SKIP] Cannot infer label for: {txt_file}")
                continue
            text = txt_file.read_text(encoding="utf-8")
            texts.append(text)
            labels.append(label)

    return texts, labels


def train(samples_dir: Path, output_path: Path) -> None:
    print(f"Loading dataset from: {samples_dir}")
    texts, labels = load_dataset(samples_dir)

    if not texts:
        raise ValueError(f"No .txt files found under {samples_dir}. Run the generators first.")

    # Count per class
    from collections import Counter
    counts = Counter(labels)
    print(f"Dataset: {len(texts)} samples")
    for doc_type, count in sorted(counts.items()):
        print(f"  {doc_type}: {count}")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    # Pipeline: TF-IDF → Logistic Regression
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            max_features=20_000,
            sublinear_tf=True,
            min_df=2,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=5.0,
            solver="lbfgs",
            multi_class="multinomial",
        )),
    ])

    print("\nTraining...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    print("\nEvaluation on test set:")
    print(classification_report(y_test, y_pred, target_names=sorted(set(labels))))

    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_path)
    print(f"\nModel saved to: {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train DocFlow document classifier")
    parser.add_argument(
        "--samples", type=str, default="./samples",
        help="Root directory containing subfolders (invoices/, devis/, siret/, kbis/, noisy/)"
    )
    parser.add_argument(
        "--output", type=str,
        default="../classification-service/models/classifier.joblib",
        help="Output path for the .joblib model file"
    )
    args = parser.parse_args()

    train(Path(args.samples), Path(args.output))


if __name__ == "__main__":
    main()
