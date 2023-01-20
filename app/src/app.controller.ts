import { Controller, Get } from '@nestjs/common';
import { DataService } from './data.service';

@Controller()
export class AppController {
  constructor(private readonly dataService: DataService) {}

  @Get('hello')
  getHello(): string {
    return this.dataService.getHello();
  }

  @Get('applications')
  getApplications(): object {
    return this.dataService.getApplications();
  }

}
