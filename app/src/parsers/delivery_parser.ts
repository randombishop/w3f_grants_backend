import Delivery from '../model/delivery';
import CommitInfoParser from './commit_info_parser';
import * as StringSimilarity from 'string-similarity' ;

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
    //this.parseGitLog() ;
    //this.parseText() ;
  }

  parseFileName() {
    var key = this.result.fileName ;
    key = key.toLowerCase().replace('.md', '') ;
    this.result.milestoneNumber = parseInt(key.substring(key.length-1)) ;
    key = key.substring(0, key.length-1) ;
    key = key.replace('milestone', '') ;
    key = this.cleanFileName(key) ;
    const targets = this.grants.map(x=>this.cleanFileName(x.toLowerCase().replace('.md', '')))
    const match = StringSimilarity.findBestMatch(key, targets) ;
    const matchText = match.bestMatch.target ;
    const matchRating = match.bestMatch.rating ;
    if (matchRating>0.75) {
        this.result.applicationFile = this.grants[match.bestMatchIndex] ;
        //console.log(this.result.fileName+' > '+this.result.applicationFile+' / '+matchRating) ;
    }
  }

  parseGitLog() {
    const lastComma = this.log.lastIndexOf(',') ;
    const jsonString = '['+this.log.substring(0, lastComma)+']' ;
    const commitsData = JSON.parse(jsonString) ;
    const commits = commitsData.map((data) => {
        return (new CommitInfoParser(data)).getResult() ;
    }).reverse() ;
    if (commits.length==0) {
        console.log('NO COMMITS???') ;
        console.log(this.result.fileName) ;
        console.log(jsonString) ;
    }
    /*this.result.pullRequest = commits[0].pullRequest ;
    this.result.githubHistory = commits ;
    this.result.githubUser = commits[0].authorName ;
    this.result.status = new GrantStatus() ;
    this.result.status.acceptDate = commits[0].date ;
    if (commits.length>1) {
        this.result.status.amendDates = commits.slice(1).map(x=>x.date) ;
    } else {
        this.result.status.amendDates = [] ;
    }*/
  }

  parseText() {
    const lines = this.text.split('\n') ;
    const firstLines = lines.slice(0,25) ;

  }


  cleanFileName(s) {
    s = s.replaceAll('_', ' ') ;
    s = s.replaceAll('-', ' ') ;
    s = s.replaceAll('.', ' ') ;
    s = s.trim() ;
    return s ;
  }

  cleanString(s) {
    s = s.replaceAll('#', ' ') ;
    s = s.replaceAll('*', ' ') ;
    s = s.replaceAll(':', ' ') ;
    s = s.replaceAll('-', ' ') ;
    s = s.replaceAll('(', ' ') ;
    s = s.replaceAll(')', ' ') ;
    s = s.trim() ;
    return s ;
  }

  getResult() {
    return this.result ;
  }

}
