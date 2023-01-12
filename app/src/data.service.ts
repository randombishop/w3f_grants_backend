import { Injectable } from '@nestjs/common';
import { Octokit } from "@octokit/rest";

@Injectable()
export class DataService {

  private db ;

  constructor() {
    this.db = {}
  }

  getHello(): string {
    return 'Hello World!';
  }

  async fullSync(): Promise<string> {
    var log = ''
    log += 'Done.\n' ;
    return log ;
  }

}
