import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractedEntity, ExtractedEntityDocument } from '../schemas/extracted-entity.schema';
import { ValidationResult, ValidationResultDocument, ValidationError } from '../schemas/validation-result.schema';

const VALIDATOR_VERSION = '1.0.0';

/** Mandatory fields per document type */
const MANDATORY_FIELDS: Record<string, string[]> = {
  FACTURE: ['siret', 'tvaNumber', 'invoiceNumber', 'invoiceDate', 'amountHT', 'amountTTC'],
  DEVIS: ['siret', 'invoiceNumber', 'invoiceDate', 'amountHT', 'amountTTC'],
  KBIS: ['siret', 'companyName', 'registrationNumber', 'incorporationDate'],
  URSSAF: ['siret', 'urssafPeriod', 'urssafExpirationDate'],
  RIB: ['iban', 'bic', 'accountHolder'],
  SIRET_ATTESTATION: ['siret', 'companyName'],
};

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    @InjectModel(ExtractedEntity.name)
    private readonly entityModel: Model<ExtractedEntityDocument>,
    @InjectModel(ValidationResult.name)
    private readonly resultModel: Model<ValidationResultDocument>,
  ) {}

  async validate(documentId: string, correlationId?: string): Promise<ValidationResult> {
    this.logger.log(`[${correlationId}] Validating document ${documentId}`);

    const entity = await this.entityModel.findOne({ documentId }).lean();
    if (!entity) {
      throw new NotFoundException(`No extracted entity found for document ${documentId}`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    this.checkMandatoryFields(entity, errors);
    this.checkSiret(entity, errors);
    this.checkTvaFormat(entity, errors);
    this.checkAmountConsistency(entity, errors);
    this.checkUrssafExpiration(entity, warnings);
    this.checkIban(entity, errors);

    const isValid = errors.length === 0;

    const result = await this.resultModel.findOneAndUpdate(
      { documentId },
      {
        $set: {
          documentId,
          documentType: entity.documentType,
          isValid,
          errors,
          warnings,
          validatedAt: new Date(),
          correlationId,
          validatorVersion: VALIDATOR_VERSION,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(`[${correlationId}] Document ${documentId} validation: ${isValid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`);
    return result;
  }

  async validateBatch(documentIds: string[], correlationId?: string): Promise<ValidationResult[]> {
    return Promise.all(documentIds.map((id) => this.validate(id, correlationId)));
  }

  async getResult(documentId: string): Promise<ValidationResult> {
    const result = await this.resultModel.findOne({ documentId }).sort({ createdAt: -1 }).lean();
    if (!result) {
      throw new NotFoundException(`No validation result found for document ${documentId}`);
    }
    return result;
  }

  // ── Private validators ──────────────────────────────────────────────────────

  private checkMandatoryFields(entity: ExtractedEntity, errors: ValidationError[]): void {
    const required = MANDATORY_FIELDS[entity.documentType] ?? [];
    for (const field of required) {
      const value = (entity as unknown as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          code: 'MISSING_MANDATORY_FIELD',
          field,
          message: `Champ obligatoire manquant: ${field}`,
          severity: 'ERROR',
        });
      }
    }
  }

  /**
   * Luhn algorithm check on SIRET (14 digits).
   * SIRET = SIREN (9) + NIC (5). Luhn applies on SIREN part.
   */
  private checkSiret(entity: ExtractedEntity, errors: ValidationError[]): void {
    const siret = entity.siret;
    if (!siret) return;

    const cleaned = siret.replace(/\s/g, '');
    if (!/^\d{14}$/.test(cleaned)) {
      errors.push({ code: 'INVALID_SIRET_FORMAT', field: 'siret', message: `SIRET invalide: doit contenir 14 chiffres (reçu: ${cleaned})`, severity: 'ERROR' });
      return;
    }

    if (!this.luhnCheck(cleaned)) {
      errors.push({ code: 'INVALID_SIRET_LUHN', field: 'siret', message: `SIRET invalide: échec de la vérification Luhn (${cleaned})`, severity: 'ERROR' });
    }
  }

  private luhnCheck(numStr: string): boolean {
    let sum = 0;
    let alternate = false;
    for (let i = numStr.length - 1; i >= 0; i--) {
      let n = parseInt(numStr[i]!, 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  /** TVA intracommunautaire FR: "FR" + 2 alphanum + 9 digits */
  private checkTvaFormat(entity: ExtractedEntity, errors: ValidationError[]): void {
    const tva = entity.tvaNumber;
    if (!tva) return;

    if (!/^FR[A-Z0-9]{2}\d{9}$/.test(tva.replace(/\s/g, ''))) {
      errors.push({
        code: 'INVALID_TVA_FORMAT',
        field: 'tvaNumber',
        message: `Numéro TVA invalide: format attendu FRxx000000000 (reçu: ${tva})`,
        severity: 'ERROR',
      });
    }
  }

  /** HT × (1 + tvaRate/100) should equal TTC within ±2 cents */
  private checkAmountConsistency(entity: ExtractedEntity, errors: ValidationError[]): void {
    const { amountHT, amountTTC, tvaRate } = entity;
    if (amountHT === undefined || amountTTC === undefined) return;

    const rate = tvaRate ?? 20;
    const expected = Math.round(amountHT * (1 + rate / 100) * 100) / 100;
    const diff = Math.abs(expected - amountTTC);

    if (diff > 0.02) {
      errors.push({
        code: 'TVA_AMOUNT_INCONSISTENCY',
        field: 'amountTTC',
        message: `Incohérence montant TVA: HT=${amountHT} × ${1 + rate / 100} = ${expected} ≠ TTC=${amountTTC} (écart: ${diff.toFixed(2)}€)`,
        severity: 'ERROR',
      });
    }
  }

  /** Warn if URSSAF attestation is expired (expiration date in the past) */
  private checkUrssafExpiration(entity: ExtractedEntity, warnings: ValidationError[]): void {
    const expStr = entity.urssafExpirationDate;
    if (!expStr) return;

    const exp = new Date(expStr);
    if (isNaN(exp.getTime())) return;

    if (exp < new Date()) {
      warnings.push({
        code: 'URSSAF_EXPIRED',
        field: 'urssafExpirationDate',
        message: `Attestation URSSAF expirée le ${expStr}`,
        severity: 'WARNING',
      });
    }
  }

  /** French IBAN: FR + 2 check digits + 23 chars = 27 total */
  private checkIban(entity: ExtractedEntity, errors: ValidationError[]): void {
    const iban = entity.iban;
    if (!iban) return;

    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (!/^FR\d{2}[A-Z0-9]{23}$/.test(cleaned)) {
      errors.push({
        code: 'INVALID_IBAN_FORMAT',
        field: 'iban',
        message: `IBAN invalide: format français attendu FR + 25 chars (reçu: ${iban})`,
        severity: 'ERROR',
      });
      return;
    }

    if (!this.ibanModCheck(cleaned)) {
      errors.push({
        code: 'INVALID_IBAN_CHECKSUM',
        field: 'iban',
        message: `IBAN invalide: échec de la vérification modulo 97 (${iban})`,
        severity: 'ERROR',
      });
    }
  }

  private ibanModCheck(iban: string): boolean {
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = rearranged
      .split('')
      .map((c) => (c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c))
      .join('');
    let remainder = 0;
    for (const ch of numeric) {
      remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
    }
    return remainder === 1;
  }
}
