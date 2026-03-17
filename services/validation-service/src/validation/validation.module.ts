import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ExtractedEntity, ExtractedEntitySchema } from '../schemas/extracted-entity.schema';
import { ValidationResult, ValidationResultSchema } from '../schemas/validation-result.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExtractedEntity.name, schema: ExtractedEntitySchema },
      { name: ValidationResult.name, schema: ValidationResultSchema },
    ]),
  ],
  controllers: [ValidationController],
  providers: [ValidationService],
})
export class ValidationModule {}
