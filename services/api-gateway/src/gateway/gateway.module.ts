import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
