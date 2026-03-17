from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path
from random import Random

from faker import Faker

from .augmentations import apply_quality_profile
from .companies import load_company_pool
from .models import CaseRecord, DocumentRecord
from .rendering import post_process_image, render_document_image, render_document_pdf
from .scenarios import SCENARIOS, create_case_blueprint
from .styles import pick_style


REAL_REQUIRED_COLUMNS = {
    "file_path",
    "doc_type",
    "supplier_name",
    "supplier_siret",
    "invoice_number",
    "issue_date",
    "amount_ttc",
}


def _write_jsonl(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def _write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def _clean_text_destination(output_root: Path, split: str, case_id: str, doc_id: str) -> Path:
    return output_root / "clean" / split / case_id / f"{doc_id}.txt"


def _raw_destination(output_root: Path, split: str, case_id: str, doc_id: str, suffix: str) -> Path:
    return output_root / "raw" / split / case_id / f"{doc_id}{suffix}"


def _doc_record(
    *,
    doc_id: str,
    case_id: str,
    scenario_id: str,
    split: str,
    doc_type: str,
    source_type: str,
    file_format: str,
    relative_path: str,
    clean_text_path: str,
    quality_profile: str,
    style_id: str,
    supplier_name: str,
    supplier_siret: str,
    supplier_vat: str,
    customer_name: str,
    customer_siret: str,
    invoice_number: str,
    quote_number: str,
    attestation_reference: str,
    issue_date: str,
    due_date: str,
    expiration_date: str,
    currency: str,
    amount_ht: str,
    amount_tva: str,
    amount_ttc: str,
    iban: str,
    bic: str,
    is_forged: bool,
    is_expired: bool,
    has_cross_doc_inconsistency: bool,
    source_url: str = "",
    notes: str = "",
) -> DocumentRecord:
    return DocumentRecord(
        doc_id=doc_id,
        case_id=case_id,
        scenario_id=scenario_id,
        split=split,
        doc_type=doc_type,
        source_type=source_type,
        file_format=file_format,
        relative_path=relative_path,
        clean_text_path=clean_text_path,
        quality_profile=quality_profile,
        style_id=style_id,
        supplier_name=supplier_name,
        supplier_siret=supplier_siret,
        supplier_vat=supplier_vat,
        customer_name=customer_name,
        customer_siret=customer_siret,
        invoice_number=invoice_number,
        quote_number=quote_number,
        attestation_reference=attestation_reference,
        issue_date=issue_date,
        due_date=due_date,
        expiration_date=expiration_date,
        currency=currency,
        amount_ht=amount_ht,
        amount_tva=amount_tva,
        amount_ttc=amount_ttc,
        iban=iban,
        bic=bic,
        is_forged=is_forged,
        is_expired=is_expired,
        has_cross_doc_inconsistency=has_cross_doc_inconsistency,
        source_url=source_url,
        notes=notes,
    )


def _import_real_examples(output_root: Path, manifest_path: Path) -> tuple[list[DocumentRecord], list[CaseRecord]]:
    if not manifest_path.exists():
        return [], []

    with manifest_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = set(reader.fieldnames or [])
        if not fieldnames:
            return [], []
        missing = REAL_REQUIRED_COLUMNS - fieldnames
        if missing:
            raise ValueError(f"Manifest incomplet pour les exemples reels: colonnes manquantes {sorted(missing)}")

        records: list[DocumentRecord] = []
        cases: list[CaseRecord] = []
        base_dir = manifest_path.parent

        for index, row in enumerate(reader, start=1):
            file_path_value = row.get("file_path", "").strip()
            if not file_path_value:
                continue
            file_path = (base_dir / file_path_value).resolve()
            if not file_path.exists():
                continue

            split = row.get("split", "").strip() or "test"
            scenario_id = row.get("scenario_id", "").strip() or "real_example"
            case_id = row.get("case_id", "").strip() or f"real-{index:04d}"
            doc_id = row.get("doc_id", "").strip() or f"{case_id}-{row['doc_type'].strip()}"
            dest = _raw_destination(output_root, split, case_id, doc_id, file_path.suffix.lower())
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file_path, dest)

            clean_dest = _clean_text_destination(output_root, split, case_id, doc_id)
            clean_dest.parent.mkdir(parents=True, exist_ok=True)

            ocr_text_path = row.get("ocr_text_path", "").strip()
            if ocr_text_path:
                resolved_text = (base_dir / ocr_text_path).resolve()
                if resolved_text.exists():
                    shutil.copy2(resolved_text, clean_dest)
                else:
                    clean_dest.write_text("", encoding="utf-8")
            else:
                clean_text = "\n".join(
                    [
                        row.get("doc_type", ""),
                        f"Fournisseur: {row.get('supplier_name', '')}",
                        f"SIRET: {row.get('supplier_siret', '')}",
                        f"TVA: {row.get('supplier_vat', '')}",
                        f"Client: {row.get('customer_name', '')}",
                        f"Numero facture: {row.get('invoice_number', '')}",
                        f"Date emission: {row.get('issue_date', '')}",
                        f"Date echeance: {row.get('due_date', '')}",
                        f"Montant HT: {row.get('amount_ht', '')}",
                        f"Montant TVA: {row.get('amount_tva', '')}",
                        f"Montant TTC: {row.get('amount_ttc', '')}",
                        row.get("notes", ""),
                    ]
                ).strip()
                clean_dest.write_text(clean_text, encoding="utf-8")

            record = _doc_record(
                doc_id=doc_id,
                case_id=case_id,
                scenario_id=scenario_id,
                split=split,
                doc_type=row.get("doc_type", "").strip() or "invoice",
                source_type="real_example",
                file_format=file_path.suffix.lower().lstrip("."),
                relative_path=str(dest.relative_to(output_root)).replace("\\", "/"),
                clean_text_path=str(clean_dest.relative_to(output_root)).replace("\\", "/"),
                quality_profile=row.get("quality_profile", "").strip() or "external_source",
                style_id=row.get("style_id", "").strip() or "external_source",
                supplier_name=row.get("supplier_name", "").strip(),
                supplier_siret=row.get("supplier_siret", "").strip(),
                supplier_vat=row.get("supplier_vat", "").strip(),
                customer_name=row.get("customer_name", "").strip(),
                customer_siret=row.get("customer_siret", "").strip(),
                invoice_number=row.get("invoice_number", "").strip(),
                quote_number=row.get("quote_number", "").strip(),
                attestation_reference=row.get("attestation_reference", "").strip(),
                issue_date=row.get("issue_date", "").strip(),
                due_date=row.get("due_date", "").strip(),
                expiration_date=row.get("expiration_date", "").strip(),
                currency=row.get("currency", "").strip() or "EUR",
                amount_ht=row.get("amount_ht", "").strip(),
                amount_tva=row.get("amount_tva", "").strip(),
                amount_ttc=row.get("amount_ttc", "").strip(),
                iban=row.get("iban", "").strip(),
                bic=row.get("bic", "").strip(),
                is_forged=row.get("is_forged", "").strip().lower() == "true",
                is_expired=row.get("is_expired", "").strip().lower() == "true",
                has_cross_doc_inconsistency=row.get("has_cross_doc_inconsistency", "").strip().lower() == "true",
                source_url=row.get("source_url", "").strip(),
                notes=row.get("notes", "").strip(),
            )
            records.append(record)
            cases.append(
                CaseRecord(
                    case_id=case_id,
                    scenario_id=scenario_id,
                    split=split,
                    document_ids=[doc_id],
                    expected_consistency_status=row.get("expected_consistency_status", "").strip() or "coherent",
                    expected_issues=[item for item in row.get("expected_issues", "").split("|") if item],
                )
            )

        return records, cases


def build_dataset(config, output_root: Path) -> dict[str, int]:
    output_root = output_root.resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    faker = Faker("fr_FR")
    faker.seed_instance(config.seed)
    rng = Random(config.seed)
    companies = load_company_pool(config.company_pool_csv)

    document_records: list[DocumentRecord] = []
    case_records: list[CaseRecord] = []
    case_index = 1

    for split, scenarios in config.splits.items():
        for scenario_id, count in scenarios.items():
            if scenario_id not in SCENARIOS:
                raise ValueError(f"Scenario inconnu dans la configuration: {scenario_id}")
            for _ in range(count):
                case_id = f"{split}-{case_index:05d}"
                blueprint = create_case_blueprint(
                    scenario_id=scenario_id,
                    index=case_index,
                    rng=rng,
                    fake=faker,
                    companies=companies,
                    config=config,
                )
                package = blueprint["scenario"]
                style = pick_style(rng)
                document_ids: list[str] = []

                for doc_type, content in blueprint["documents"].items():
                    doc_id = f"{case_id}-{doc_type}"
                    suffix = ".pdf" if package.file_format == "pdf" else f".{package.file_format}"
                    raw_path = _raw_destination(output_root, split, case_id, doc_id, suffix)
                    clean_path = _clean_text_destination(output_root, split, case_id, doc_id)
                    clean_path.parent.mkdir(parents=True, exist_ok=True)

                    if package.file_format == "pdf":
                        render_document_pdf(content, raw_path, style)
                    else:
                        render_document_image(content, raw_path, config.image_width, config.image_height, style)
                        post_process_image(raw_path)
                        apply_quality_profile(raw_path, package.quality_profile, config.jpeg_quality, rng)

                    clean_path.write_text(content.as_text(), encoding="utf-8")
                    document_ids.append(doc_id)

                    document_records.append(
                        _doc_record(
                            doc_id=doc_id,
                            case_id=case_id,
                            scenario_id=scenario_id,
                            split=split,
                            doc_type=doc_type,
                            source_type="synthetic",
                            file_format=package.file_format,
                            relative_path=str(raw_path.relative_to(output_root)).replace("\\", "/"),
                            clean_text_path=str(clean_path.relative_to(output_root)).replace("\\", "/"),
                            quality_profile=package.quality_profile,
                            style_id=style.style_id,
                            supplier_name=content.supplier.company_name,
                            supplier_siret=content.supplier.siret,
                            supplier_vat=content.supplier.vat_number,
                            customer_name=content.customer.company_name,
                            customer_siret=content.customer.siret,
                            invoice_number=content.invoice_number,
                            quote_number=content.quote_number,
                            attestation_reference=content.attestation_reference,
                            issue_date=content.issue_date,
                            due_date=content.due_date,
                            expiration_date=content.expiration_date,
                            currency=content.currency,
                            amount_ht=f"{content.amount_ht:.2f}",
                            amount_tva=f"{content.amount_tva:.2f}",
                            amount_ttc=f"{content.amount_ttc:.2f}",
                            iban=content.iban,
                            bic=content.bic,
                            is_forged=package.is_forged,
                            is_expired=package.is_expired,
                            has_cross_doc_inconsistency=package.has_cross_doc_inconsistency,
                            notes=" | ".join(content.notes),
                        )
                    )

                case_records.append(
                    CaseRecord(
                        case_id=case_id,
                        scenario_id=scenario_id,
                        split=split,
                        document_ids=document_ids,
                        expected_consistency_status=package.expected_status,
                        expected_issues=list(package.expected_issues),
                    )
                )
                case_index += 1

    real_records, real_cases = _import_real_examples(output_root, config.real_examples_manifest)
    document_records.extend(real_records)
    case_records.extend(real_cases)

    document_rows = [record.to_dict() for record in document_records]
    case_rows = [record.to_dict() for record in case_records]
    curated = output_root / "curated"
    _write_jsonl(curated / "documents.jsonl", document_rows)
    _write_jsonl(curated / "cases.jsonl", case_rows)
    _write_csv(curated / "documents.csv", document_rows)
    _write_csv(curated / "cases.csv", case_rows)

    summary = {
        "documents": len(document_records),
        "cases": len(case_records),
        "synthetic_documents": sum(1 for row in document_rows if row["source_type"] == "synthetic"),
        "real_example_documents": sum(1 for row in document_rows if row["source_type"] == "real_example"),
        "splits": {
            split: sum(1 for row in case_rows if row["split"] == split)
            for split in sorted({row["split"] for row in case_rows})
        },
    }
    (curated / "build_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary
