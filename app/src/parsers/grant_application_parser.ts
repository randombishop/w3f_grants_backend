import GrantApplication from '../model/grant_application';
import GrantMilestone from '../model/grant_milestone';
import GrantStatus from '../model/grant_status';
import {cleanString, parseGitLog} from './utils' ;


const CURRENCIES = ['usdt', 'usdc', 'bitcoin', 'btc', 'eth', 'dot', 'ksm', 'eur']


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
    const commits = parseGitLog(this.log) ;
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
    var overviewLines = lines.slice(overviewStartsAt+1, overviewEndsAt) ;
    overviewLines = overviewLines.filter((line) => {
        if (line.startsWith('#') && line.toLowerCase().includes('overview')) {
            return false ;
        }
        return true ;
    }) ;
    this.result.abstract = overviewLines.join('\n') ;
    const roadMapStartsAt = this.findRoadmap(lines) ;
    if (roadMapStartsAt) {
        const roadmapLines = lines.slice(roadMapStartsAt) ;
        this.parseRoadmap(roadmapLines) ;
    }
  }

  parseRoadmap(lines) {
    this.result.amount = this.findTotalCost(lines) ;
    const milestoneIndices = this.findMilestones(lines) ;
    this.result.milestones = [] ;
    if (milestoneIndices.length>1) {
        for (var i=0 ; i<(milestoneIndices.length-1) ; i++) {
            const milestoneLines = lines.slice(milestoneIndices[i], milestoneIndices[i+1]) ;
            const milestone = this.parseMilestone(i+1, milestoneLines) ;
            this.result.milestones.push(milestone) ;
        }
    }
  }

  parseMilestone(number, lines) {
    const milestone = new GrantMilestone() ;
    milestone.number = number ;
    milestone.title = lines[0].replaceAll('#', '').trim() ;
    milestone.cost = this.findMilestoneCost(lines) ;
    milestone.description = lines.join('\n') ;
    return milestone ;
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
            line = cleanString(line) ;
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
            line = cleanString(line) ;
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

  findAmountAndCurrency(line) {
    const parts = line.split(' ') ;
    const currency = this.findCurrency(parts) ;
    const amount = this.findAmount(parts) ;
    if (amount && currency) {
        return amount+' '+currency ;
    } else if (amount) {
        return amount+'' ;
    } else {
        return null ;
    }
  }

  findCurrency(parts) {
    for (var i in parts) {
        var s = parts[i] ;
        if (CURRENCIES.includes(s)) {
            return s.toUpperCase() ;
        }
    }
    return null ;
  }

  findAmount(parts) {
    for (var i in parts) {
        var s = parts[i].replaceAll(',', '') ;
        try {
            const amount = Math.floor(s) ;
            if (amount) {
                return amount ;
            }
        } catch (e) {}
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
            line = cleanString(line) ;
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

  findTotalCost(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        if (line.includes('total') && line.includes('cost')) {
            const index=line.indexOf(':**') ;
            line = line.substring(index+3) ;
            line = cleanString(line) ;
            const amount = this.findAmount(line.split(' ')) ;
            if (amount) {
                return amount ;
            }
        }
    }
    return null ;
  }

  findMilestones(lines) {
    const ans = [] ;
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        line = line.replaceAll('*', '') ;
        line = line.replaceAll(' ', '') ;
        if (line.startsWith('##milestone') || line.startsWith('###milestone') || line.startsWith('####milestone')) {
            ans.push(i) ;
        }
    }
    if (ans.length>0) {
        const lastIndex = ans[ans.length-1] ;
        for (i=lastIndex+5 ; i<lines.length ; i++) {
            line = lines[i].toLowerCase() ;
            if (line.startsWith('#')) {
                ans.push(i) ;
                return ans ;
            }
        }
    }
    ans.push(lines.length) ;
    return ans ;
  }

  findMilestoneCost(lines) {
    for (var i=0 ; i<lines.length ; i++) {
        var line = lines[i].toLowerCase() ;
        if (line.includes('cost')) {
            const index=line.indexOf(':**') ;
            line = line.substring(index+3) ;
            line = cleanString(line) ;
            const amount = this.findAmount(line.split(' ')) ;
            if (amount) {
                return amount ;
            }
        }
    }
    return null ;
  }

  getResult() {
    return this.result ;
  }

}
