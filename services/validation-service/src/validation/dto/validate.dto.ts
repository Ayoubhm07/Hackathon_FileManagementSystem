import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

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
