import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DataService } from './data.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [DataService],
})
export class AppModule {}
