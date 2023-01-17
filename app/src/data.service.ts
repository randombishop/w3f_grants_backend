import { Injectable } from '@nestjs/common';
import { Octokit } from "@octokit/rest";
import * as Shell from "shelljs" ;
import * as fs from 'fs' ;
import GrantApplicationParser from './parsers/grant_application_parser' ;


@Injectable()
export class DataService {

  private db ;
  private octokit ;

  constructor() {
    this.db = {} ;
    this.octokit = new Octokit() ;
  }

  getHello(): string {
    return 'Hello World!';
  }

  async gitClone(): Promise<string> {
    const tmp_data_folder = process.env.TMP_DATA_DIRECTORY
    await Shell.cd(tmp_data_folder) ;
    await Shell.rm('-rf', 'Grants-Program');
    await Shell.rm('-rf', 'Grant-Milestone-Delivery');
    await Shell.exec('git clone git@github.com:w3f/Grants-Program.git') ;
    await Shell.exec('git clone git@github.com:w3f/Grant-Milestone-Delivery.git') ;
    return 'OK' ;
  }

  async parseApplications(): Promise<object> {
    const ans = [] ;
    const tmp_data_folder = process.env.TMP_DATA_DIRECTORY ;
    const applications_folder = tmp_data_folder+'/Grants-Program/applications' ;
    await Shell.cd(applications_folder) ;
    const application_files = fs.readdirSync(applications_folder) ;
    var numFilesProcessed = 0 ;
    var numWarnings = 0 ;
    for (var i=0 ; i<application_files.length ; i++) {
        const fileName = application_files[i] ;
        var ok = (fileName.endsWith('.md') || fileName.endsWith('.MD')) ;
        ok = ok && (fileName!='index.md') ;
        if (ok) {
            const app_file = applications_folder + '/' + fileName ;
            const text = fs.readFileSync(app_file).toString()
            const format = ' --date=iso-strict --pretty=format:\'{%n  "commit": "%H",%n  "author": "%aN <%aE>",%n  "date": "%ad",%n  "message": "%f"%n },%n  \' ' ;
            const log = (await Shell.exec('git log --first-parent master '+format+' "'+fileName+'"', {silent:true})).stdout ;
            const parser = new GrantApplicationParser(fileName, text, log) ;
            const result = parser.getResult() ;
            ans.push(result) ;
            numFilesProcessed++ ;
            if (!result.pullRequest) {
                numWarnings++ ;
            }
        }
    }
    console.log('numFilesProcessed: '+numFilesProcessed) ;
    console.log('numWarnings: '+numWarnings) ;
    return ans ;
  }

}
