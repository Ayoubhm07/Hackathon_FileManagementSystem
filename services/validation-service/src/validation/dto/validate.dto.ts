import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';

export class ValidateDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsOptional()
  correlationId?: string;
}

export class ValidateBatchDto {
  @IsArray()
  @IsString({ each: true })
  documentIds!: string[];

  @IsString()
  @IsOptional()
  correlationId?: string;
}

export class HumanDecisionDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  validatorName?: string;
}
