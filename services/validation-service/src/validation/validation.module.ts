import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { KafkaProducerService } from './kafka-producer.service';
import { ExtractedEntity, ExtractedEntitySchema } from '../schemas/extracted-entity.schema';
import { ValidationResult, ValidationResultSchema } from '../schemas/validation-result.schema';
import { DocflowDocument, DocflowDocumentSchema } from '../schemas/document.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ExtractedEntity.name, schema: ExtractedEntitySchema },
      { name: ValidationResult.name, schema: ValidationResultSchema },
      { name: DocflowDocument.name, schema: DocflowDocumentSchema },
    ]),
  ],
  controllers: [ValidationController],
  providers: [ValidationService, KafkaProducerService],
})
export class ValidationModule {}
