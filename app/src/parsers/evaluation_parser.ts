import Evaluation from '../model/evaluation';
import {cleanString, cleanFileName, parseGitLog, findGrantMatch, parseLinks} from './utils' ;


export default class EvaluationParser {

  private text ;
  private log ;
  private grants ;
  private result ;

  constructor(fileName, text, log, grant_files) {
    //console.log('<<<'+fileName+'>>>\n'+text) ;
    this.text = text ;
    this.log = log ;
    this.grants = grant_files ;
    this.result = new Evaluation() ;
    this.result.fileName = fileName ;
    this.parse() ;
  }

  parse() {
    this.parseFileName() ;
    this.parseGitLog() ;
    this.parseText() ;
  }

  parseFileName() {
    var key = this.result.fileName ;
    key = key.toLowerCase().replace('.md', '') ;
    const lastUnderscore = key.lastIndexOf('_') ;
    const evaluator = key.substring(lastUnderscore+1) ;
    this.result.evaluator = evaluator ;
    key = key.substring(0,lastUnderscore) ;
    this.result.milestoneNumber = parseInt(key.substring(key.length-1)) ;
    key = key.substring(0, key.length-1) ;
    key = key.replace('milestone', '') ;
    key = cleanFileName(key) ;
    this.result.applicationFile = findGrantMatch(key, this.grants) ;
  }

  parseGitLog() {
    const commits = parseGitLog(this.log) ;
    this.result.githubHistory = commits ;
    this.result.githubUser = commits[0].authorName ;
    this.result.mergeDate = commits[0].date ;
  }

  parseText() {
    this.result.content = this.text ;
    this.result.links = parseLinks(this.text) ;
  }

  getResult() {
    return this.result ;
  }

}
