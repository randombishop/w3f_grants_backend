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
    this.parseGitLog() ;
    this.parseText() ;
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

  parseText() {
    const lines = this.text.split('\n') ;
    const firstLines = lines.slice(0,25) ;
    this.result.projectName = this.findProjectName(firstLines) ;
    this.result.teamName = this.findTeamName(firstLines) ;
    const paymentInfo = this.findPaymentInfo(firstLines) ;
    this.result.paymentAddress = paymentInfo[0] ;
    this.result.paymentCurrency = paymentInfo[1] ;
    this.result.level = this.findLevel(firstLines) ;
    const overviewStartsAt = this.findOverview(firstLines) ;
    const overviewEndsAt = overviewStartsAt + 10 ;
    this.result.abstract = lines.slice(overviewStartsAt+1, overviewEndsAt).join('\n') ;
    const roadMapStartsAt = this.findRoadmap(lines) ;
    if (roadMapStartsAt) {
        const roadmapLines = lines.slice(roadMapStartsAt) ;
        this.parseRoadmap(roadmapLines) ;
    }

    //console.log(lines.slice(50)) ;
    //console.log(this.result.fileName+ ' > '+this.result.abstract) ;
    //if (!this.result.level) {
    //    console.log(firstLines) ;
    //}
  }

  parseRoadmap(lines) {
    console.log(lines.slice(0,10)) ;

  }


  findProjectName(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        const line = lines[i] ;
        if (line.includes('#')) {
            const title = line.replace('#', '').trim() ;
            if (title!='W3F Grant Proposal') {
                return title ;
            }
        }
    }
    return null ;
  }

  findTeamName(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toUpperCase() ;
        if (line.includes('TEAM') || line.includes('PROPOSER')) {
            line = line.replace('TEAM', ' ') ;
            line = line.replace('NAME', ' ') ;
            line = line.replace('PROPOSER', ' ') ;
            line = this.cleanString(line) ;
            return line ;
        }
    }
    return null ;
  }

  findPaymentInfo(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        if (line.includes('payment') || line.includes('address')) {
            line = line.replace('payment', ' ') ;
            line = line.replace('address', ' ') ;
            line = line.replace('ethereum', ' ') ;
            line = line.replace('erc20', ' ') ;
            line = this.cleanString(line) ;
            //console.log('findPaymentInfo: '+line) ;
            const parts = line.split(' ') ;
            const address = this.findAddress(parts) ;
            const currency = this.findCurrency(parts) ;
            return [address,currency] ;
        }
    }
    return [null,null] ;
  }

  findAddress(parts) {
    for (var i in parts) {
        var s = parts[i] ;
        // TODO: Add more tests here to detect well formed addresses
        if (s.length>16) {
            return s ;
        }
    }
    return null ;
  }

  findCurrency(parts) {
    const currencies = ['usdt', 'usdc', 'bitcoin', 'btc', 'eth', 'dot', 'ksm']
    for (var i in parts) {
        var s = parts[i] ;
        if (currencies.includes(s)) {
            return s.toUpperCase() ;
        }
    }
    return null ;
  }

  findLevel(lines) {
    const LEVELS = [1,2,3] ;
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        if (line.includes('level')) {
            const index=line.indexOf(':**') ;
            line = line.substring(index) ;
            line = this.cleanString(line) ;
            const level = parseInt(line) ;
            if (LEVELS.includes(level)) {
                return level ;
            }
        }
    }
    return null ;
  }

  findOverview(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        if ( line.startsWith('#') && (line.includes('overview') || line.includes('description')) ) {
            return i ;
        }
    }
    return 0 ;
  }

  findRoadmap(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        if ( line.startsWith('#') && (line.includes('roadmap') || line.includes(':nut_and_bolt:')) ) {
            return i ;
        }
    }
    return null ;
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
