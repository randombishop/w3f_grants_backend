import { Injectable } from '@nestjs/common';
import { Octokit } from "@octokit/rest";
import * as Shell from "shelljs" ;
import * as fs from 'fs' ;
import GrantApplicationParser from './parsers/grant_application_parser' ;
import DeliveryParser from './parsers/delivery_parser' ;
import EvaluationParser from './parsers/evaluation_parser' ;




@Injectable()
export class DataService {

  private db ;
  private octokit ;

  constructor() {
    try {
        this.loadFromFile() ;
    } catch (e) {
        this.db = {} ;
    }
    this.octokit = new Octokit() ;
  }

  getHello(): string {
    return 'Hello World!';
  }

  async gitClone(): Promise<object> {
    const tmp_data_folder = process.env.TMP_DATA_DIRECTORY
    await Shell.cd(tmp_data_folder) ;
    await Shell.rm('-rf', 'Grants-Program');
    await Shell.rm('-rf', 'Grant-Milestone-Delivery');
    await Shell.exec('git clone git@github.com:w3f/Grants-Program.git', {silent:true}) ;
    await Shell.exec('git clone git@github.com:w3f/Grant-Milestone-Delivery.git', {silent:true}) ;
    return {
        status: 'ok'
    } ;
  }

  async parseFolderData(folder, excludeFiles, parseFunction): Promise<Array<any>> {
    const ans = [] ;
    await Shell.cd(folder) ;
    const folder_files = fs.readdirSync(folder) ;
    var numFilesProcessed = 0 ;
    var numWarnings = 0 ;
    //const allFiles = 10 ;
    const allFiles = folder_files.length ;
    for (var i=0 ; i<allFiles ; i++) {
        const fileName = folder_files[i] ;
        var ok = (fileName.endsWith('.md') || fileName.endsWith('.MD')) ;
        ok = ok && (!excludeFiles.includes(fileName)) ;
        if (ok) {
            const parse_file = folder + '/' + fileName ;
            const text = fs.readFileSync(parse_file).toString()
            const format = ' --date=iso-strict --pretty=format:\'{%n  "commit": "%H",%n  "author": "%aN <%aE>",%n  "date": "%ad",%n  "message": "%f"%n },%n  \' ' ;
            const log = (await Shell.exec('git log --first-parent master '+format+' "'+fileName+'"', {silent:true})).stdout ;
            const [result, warning] = parseFunction(fileName, text, log) ;
            ans.push(result) ;
            numFilesProcessed++ ;
            if (warning) numWarnings++ ;
        }
    }
    return [ans, numFilesProcessed, numWarnings] ;
  }

  async parseApplications(): Promise<object> {
    const folder = process.env.TMP_DATA_DIRECTORY+'/Grants-Program/applications' ;
    const excludeFiles = ['index.md'] ;
    function parseFunction(fileName, text, log) {
        const parser = new GrantApplicationParser(fileName, text, log) ;
        const result = parser.getResult() ;
        const warning = !(result.pullRequest && result.teamName && result.paymentAddress && result.level && result.amount && result.milestones) ;
        return [result, warning] ;
    }
    const [data, numFilesProcessed, numWarnings] = await this.parseFolderData(folder, excludeFiles, parseFunction) ;
    this.db.applications = {} ;
    for (var i in data) {
        const o = data[i] ;
        this.db.applications[o.fileName]=o ;
    }
    this.db.applicationFileNames = data.map(x=>x.fileName) ;
    return {
        numFilesProcessed: numFilesProcessed,
        numWarnings: numWarnings
    }
  }

  async parseDeliveries(): Promise<object> {
    const folder = process.env.TMP_DATA_DIRECTORY+'/Grant-Milestone-Delivery/deliveries' ;
    const excludeFiles = ['.delivery_testing.md', 'milestone-delivery-template.md'] ;
    const grants = this.getApplicationFileNames() ;
    function parseFunction(fileName, text, log) {
        const parser = new DeliveryParser(fileName, text, log, grants) ;
        const result = parser.getResult() ;
        const warning = !(result.fileName && result.milestoneNumber && result.applicationFile) ;
        return [result, warning] ;
    }
    const [data, numFilesProcessed, numWarnings] = await this.parseFolderData(folder, excludeFiles, parseFunction) ;
    this.db.deliveries = {} ;
    for (var i in data) {
        const o = data[i] ;
        this.db.deliveries[o.applicationFile+'/'+o.milestoneNumber]=o ;
    }
    return {
        numFilesProcessed: numFilesProcessed,
        numWarnings: numWarnings
    }
  }

  async parseEvaluations(): Promise<object> {
    const folder = process.env.TMP_DATA_DIRECTORY+'/Grant-Milestone-Delivery/evaluations' ;
    const excludeFiles = ['evaluation-template.md'] ;
    const grants = this.getApplicationFileNames() ;
    function parseFunction(fileName, text, log) {
        const parser = new EvaluationParser(fileName, text, log, grants) ;
        const result = parser.getResult() ;
        const warning = !(result.fileName && result.evaluator && result.milestoneNumber && result.applicationFile) ;
        return [result, warning] ;
    }
    const [data, numFilesProcessed, numWarnings] = await this.parseFolderData(folder, excludeFiles, parseFunction) ;
    this.db.evaluations = {} ;
    for (var i in data) {
        const o = data[i] ;
        this.db.evaluations[o.applicationFile+'/'+o.milestoneNumber]=o ;
    }
    return {
        numFilesProcessed: numFilesProcessed,
        numWarnings: numWarnings
    }
  }

  buildMainDataset() {
    for (var i in this.db.applications) {
        const application = this.db.applications[i] ;
        const milestones = application.milestones ;
        var delivered = 0 ;
        if (milestones) {
            for (var j in milestones) {
                const milestone = milestones[j] ;
                const grant = application.fileName ;
                const milestoneNumber = milestone.number ;
                const key = grant + '/' + milestoneNumber ;
                milestone.delivery = this.db['deliveries'][key] ;
                milestone.evaluation = this.db['evaluations'][key] ;
                if (milestone.delivery && milestone.evaluation) {
                    delivered++ ;
                }
            }
            application.numMilestones = milestones.length ;
            application.numMilestonesDelivered = delivered ;
        }
    }
    const data = {} ;
    data['grants'] = Object.values(this.db.applications) ;
    this.db['dataset'] = data ;
  }

  async fullSync(): Promise<object> {
    const ans = {} ;
    ans['git'] = await this.gitClone() ;
    ans['apps'] = await this.parseApplications() ;
    ans['deliveries'] = await this.parseDeliveries() ;
    ans['evaluations'] = await this.parseEvaluations() ;
    this.buildMainDataset() ;
    this.saveToFile() ;
    return ans ;
  }

  getGrants(): object {
    return this.db.dataset.grants ;
  }

  getApplicationFileNames(): Array<string> {
    return this.db.applicationFileNames ;
  }

  saveToFile() {
    const path = process.env.TMP_DATA_DIRECTORY+'/db.json' ;
    fs.writeFileSync(path, JSON.stringify(this.db), 'utf8') ;
  }

  loadFromFile() {
    const path = process.env.TMP_DATA_DIRECTORY+'/db.json' ;
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    this.db = data ;
  }

  copyData(x) {
    return JSON.parse(JSON.stringify(x)) ;
  }

}
