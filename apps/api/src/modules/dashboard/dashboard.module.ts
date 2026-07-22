import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardGateway } from './dashboard.gateway';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}