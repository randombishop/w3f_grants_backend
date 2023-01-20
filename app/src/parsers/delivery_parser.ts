import Delivery from '../model/delivery';
import {cleanString, cleanFileName, parseGitLog, findGrantMatch, parseLinks} from './utils' ;



export default class DeliveryParser {

  private text ;
  private log ;
  private grants ;
  private result ;

  constructor(fileName, text, log, grant_files) {
    //console.log('<<<'+fileName+'>>>\n'+text) ;
    this.text = text ;
    this.log = log ;
    this.grants = grant_files ;
    this.result = new Delivery() ;
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
