import GrantApplication from '../model/grant_application';
import GrantStatus from '../model/grant_status';
import CommitInfoParser from './commit_info_parser';

export default class GrantApplicationParser {

  private text ;
  private log ;
  private result ;

  constructor(fileName, text, log) {
    this.text = text ;
    this.log = log ;
    this.result = new GrantApplication() ;
    this.result.fileName = fileName ;
    this.parse() ;
  }

  parse() {
    //console.log('GrantApplicationParser.parse()') ;
    this.parseGitLog() ;


    //console.log(this.text) ;
    //console.log(this.log) ;
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
    this.result.pullRequest = commits[0].pullRequest ;
    this.result.githubHistory = commits ;
    this.result.githubUser = commits[0].authorName ;
    this.result.status = new GrantStatus() ;
    this.result.status.acceptDate = commits[0].date ;
    if (commits.length>1) {
        this.result.status.amendDates = commits.slice(1).map(x=>x.date) ;
    } else {
        this.result.status.amendDates = [] ;
    }
  }

  getResult() {
    return this.result ;
  }

}
