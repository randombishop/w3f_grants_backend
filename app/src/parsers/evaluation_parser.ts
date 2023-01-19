import Delivery from '../model/delivery';
import Link from '../model/link';
import CommitInfoParser from './commit_info_parser';
import * as StringSimilarity from 'string-similarity' ;


const IGNORE_LINK_TITLES = [
    'invoice form :pencil:'
] ;

const IGNORE_LINK_URLS = [
    'https://github.com/w3f/Grants-Program/blob/master/docs/milestone-deliverables-guidelines.md' ,
    'https://github.com/w3f/General-Grants-Program/blob/master/grants/milestone-deliverables-guidelines.md'
] ;

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
    key = this.cleanFileName(key) ;
    const targets = this.grants.map(x=>this.cleanFileName(x.toLowerCase().replace('.md', '')))
    const match = StringSimilarity.findBestMatch(key, targets) ;
    const matchText = match.bestMatch.target ;
    const matchRating = match.bestMatch.rating ;
    if (matchRating>0.75) {
        this.result.applicationFile = this.grants[match.bestMatchIndex] ;
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
    this.result.githubHistory = commits ;
    this.result.githubUser = commits[0].authorName ;
    this.result.mergeDate = commits[0].date ;
  }

  parseText() {
    this.result.content = this.text ;
    const regexMdLinks = /\[([^\]]+)\](\([^\)]+\))/gm ;
    const matches = this.text.matchAll(regexMdLinks) ;
    const links = [] ;
    for (const match of matches) {
        const link = new Link() ;
        link.title = match[1] ;
        link.url = match[2] ;
        link.url = link.url.substring(1,link.url.length-1) ;
        const ignore = IGNORE_LINK_TITLES.includes(link.title) || IGNORE_LINK_URLS.includes(link.url) ;
        if (!ignore) {
            links.push(link) ;
        }
    }
    this.result.links = links ;
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
