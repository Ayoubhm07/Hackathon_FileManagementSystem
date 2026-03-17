# Hackathon File Management System

Plateforme de traitement documentaire orientée microservices.

## 1. Ce que vous avez déjà

- Service extraction: `http://localhost:8001`
- Service validation: `http://localhost:8002`
- Airflow: `http://localhost:8080`
- Contrat de données partagé: `shared/schemas.py`
- Jeu de test local: `tests/fixtures/sample_invoice.txt`

## 2. Démarrage minimal (sans tout le dataset)

Lance uniquement les services utiles pour un test rapide API:

```powershell
docker compose up -d extraction_service validation_service
```

Vérifie la santé:

```powershell
Invoke-RestMethod http://localhost:8001/health
Invoke-RestMethod http://localhost:8002/health
```

Réponse attendue: `status = ok`.

## 3. Test extraction (1 document)

### Option A - PowerShell (recommandé)

```powershell
Set-Location "C:\Users\Jokas\OneDrive\Documents\HACKATHON26\Hackathon_FileManagementSystem"

$ocr = Get-Content -Raw .\tests\fixtures\sample_invoice.txt
$payload = @{
  document_id   = "demo-quick-1"
  document_type = "invoice"
  ocr_text      = $ocr
  image_path    = $null
} | ConvertTo-Json -Depth 10

$extract = Invoke-RestMethod -Uri "http://localhost:8001/extract" -Method Post -ContentType "application/json" -Body $payload
$extract | ConvertTo-Json -Depth 30 | Out-File .\tmp_extract_result.json -Encoding utf8

$extract.raw_fields
```

Le fichier `tmp_extract_result.json` contient la réponse complète.

### Option B - curl

```bash
curl -X POST http://localhost:8001/extract \
  -H "Content-Type: application/json" \
  -d "{\"document_id\":\"demo-quick-1\",\"document_type\":\"invoice\",\"ocr_text\":\"...\",\"image_path\":null}"
```

## 4. Test validation (avec la sortie extraction)

```powershell
$validateBody = $extract | ConvertTo-Json -Depth 30
$validation = Invoke-RestMethod -Uri "http://localhost:8002/validate" -Method Post -ContentType "application/json" -Body $validateBody
$validation | ConvertTo-Json -Depth 30 | Out-File .\tmp_validation_result.json -Encoding utf8

$validation.is_valid
$validation.checks
$validation.errors
$validation.warnings
```

## 5. Test mini-batch (petite partie dataset)

Pour un test léger, n'utilise pas tout `yolov8dataset`.

```powershell
Set-Location "C:\Users\Jokas\OneDrive\Documents\HACKATHON26\Hackathon_FileManagementSystem"

$files = Get-ChildItem .\tests\fixtures\*.txt | Select-Object -First 2
foreach ($f in $files) {
  $ocr = Get-Content -Raw $f.FullName
  $id = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)

  $payload = @{
    document_id   = "batch-$id"
    document_type = "invoice"
    ocr_text      = $ocr
    image_path    = $null
  } | ConvertTo-Json -Depth 10

  $extract = Invoke-RestMethod "http://localhost:8001/extract" -Method Post -ContentType "application/json" -Body $payload
  $validation = Invoke-RestMethod "http://localhost:8002/validate" -Method Post -ContentType "application/json" -Body ($extract | ConvertTo-Json -Depth 30)

  [PSCustomObject]@{
    document_id = $extract.document_id
    siret       = $extract.raw_fields.siret
    tva         = $extract.raw_fields.tva_number
    is_valid    = $validation.is_valid
    errors      = $validation.errors.Count
  }
}
```

## 6. Adapter au frontend

## 6.1 Flux recommandé

1. Le frontend envoie le document (ou OCR text) au backend applicatif.
2. Le backend appelle `/extract` puis `/validate`.
3. Le backend renvoie au frontend un objet consolidé:
   - `raw_fields` pour l'affichage
   - `checks/errors/warnings` pour l'état conformité
   - `enriched_company` pour les infos INSEE
4. Le frontend persiste l'ID du document pour suivre le traitement.

Important: évite d'appeler les microservices directement depuis le navigateur en production (CORS, sécurité, secret management).

## 6.2 Payloads utiles côté UI

### ExtractionRequest

```json
{
  "document_id": "demo-quick-1",
  "document_type": "invoice",
  "ocr_text": "...",
  "image_path": null
}
```

### Champs majeurs de ExtractionResult

- `entities[]`: détails extraits + confiance
- `raw_fields.siret`
- `raw_fields.tva_number`
- `raw_fields.montant_ht`
- `raw_fields.montant_ttc`
- `raw_fields.invoice_date`

### Champs majeurs de ValidationResult

- `is_valid`: booléen global
- `overall_score`: score de qualité
- `checks.*.status`: `pass|fail|skip|error`
- `errors[]`: liste d'erreurs affichables
- `warnings[]`: alertes non bloquantes
- `enriched_company`: données INSEE

## 6.3 Mapping UI conseillé

- Écran "Résultat document":
  - Bloc "Informations extraites" (raw_fields)
  - Bloc "Conformité" (checks + badge global)
  - Bloc "Erreurs" (errors)
  - Bloc "Entreprise (INSEE)" (enriched_company)

- Couleurs:
  - `pass` -> vert
  - `fail` -> rouge
  - `skip` -> gris
  - `error` -> orange

## 6.4 Exemple TypeScript (frontend)

```ts
type CheckStatus = 'pass' | 'fail' | 'skip' | 'error';

type ValidationError = {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
};

type ValidationResult = {
  document_id: string;
  is_valid: boolean;
  overall_score: number;
  raw_fields: {
    siret?: string;
    tva_number?: string;
    montant_ht?: number;
    montant_ttc?: number;
    invoice_date?: string;
  };
  checks: Record<string, { status: CheckStatus; detail?: string }>;
  errors: ValidationError[];
  warnings: string[];
  enriched_company?: {
    siren: string;
    siret: string;
    denomination: string;
    address: string;
    is_active: boolean;
  };
};
```

## 7. Test via Airflow (1 document)

Quand OCR/classifier sont disponibles:

- DAG: `document_processing_pipeline`
- params:
  - `document_id`
  - `storage_path`

Le DAG va exécuter OCR -> classification -> extraction -> validation -> stockage -> notification frontend.

## 8. Dépannage rapide

- `invalid credentials` Airflow:
  - créer user admin via `airflow users create`
- Build extraction trop long:
  - `.env` -> `INSTALL_ML=false`
- INSEE indisponible:
  - le check passe en `error` ou `fail` selon contexte, le service continue
- Mongo Atlas:
  - vérifier `MONGO_URL` et whitelist IP dans Atlas

## 9. Fichiers clés

- `docker-compose.yml`
- `airflow/dags/document_pipeline.py`
- `airflow/dags/services/extraction_service/app/main.py`
- `airflow/dags/services/extraction_service/app/extractor.py`
- `airflow/dags/services/validation_service/app/main.py`
- `airflow/dags/services/validation_service/app/adapters/insee.py`
- `shared/schemas.py`
