import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { DataService } from './data.service';
import * as dotenv from 'dotenv'
dotenv.config()

describe('Main Application Tests', () => {

  let appController: AppController;
  let dataService: DataService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [DataService],
    }).compile();

    appController = app.get<AppController>(AppController);
    dataService = app.get<DataService>(DataService) ;
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('Full Sync', () => {
    it('should download the repos and sync the db', async () => {
      const result = await dataService.parseApplications() ;
      //console.log(result) ;
    });
  });

});
