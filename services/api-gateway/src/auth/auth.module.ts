import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwksService } from './jwks.service';
import { JwtGuard } from './jwt.guard';

@Module({
  imports: [HttpModule],
  providers: [JwksService, JwtGuard],
  exports: [JwksService, JwtGuard],
})
export class AuthModule {}
