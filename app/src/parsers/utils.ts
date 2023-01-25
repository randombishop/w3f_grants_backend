import Link from '../model/link';
import CommitInfoParser from './commit_info_parser';
import * as StringSimilarity from 'string-similarity' ;


const IGNORE_LINK_TITLES = [
    'invoice form :pencil:',
    'Levels'
] ;

const IGNORE_LINK_URLS = [
    'https://github.com/w3f/Grants-Program/tree/master#level_slider-levels',
    'https://github.com/w3f/Grants-Program/blob/master/docs/milestone-deliverables-guidelines.md' ,
    'https://github.com/w3f/General-Grants-Program/blob/master/grants/milestone-deliverables-guidelines.md'
] ;

export function findGrantMatch(key, grants) {
    const targets = grants.map(x=>cleanFileName(x.toLowerCase().replace('.md', '')))
    const match = StringSimilarity.findBestMatch(key, targets) ;
    const matchText = match.bestMatch.target ;
    const matchRating = match.bestMatch.rating ;
    if (matchRating>0.75) {
        return grants[match.bestMatchIndex] ;
    } else {
        return null ;
    }
}

export function parseGitLog(log) {
    const lastComma = log.lastIndexOf(',') ;
    const jsonString = '['+log.substring(0, lastComma)+']' ;
    const commitsData = JSON.parse(jsonString) ;
    const commits = commitsData.map((data) => {
        return (new CommitInfoParser(data)).getResult() ;
    }).reverse() ;
    if (commits.length==0) {
        console.log('NO COMMITS???') ;
        console.log(this.result.fileName) ;
        console.log(jsonString) ;
    }
    return commits ;
  }

export function parseLinks(text) {
    const regexMdLinks = /\[([^\]]+)\](\([^\)]+\))/gm ;
    const matches = text.matchAll(regexMdLinks) ;
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
    return links ;
}

export function cleanFileName(s) {
    s = s.replaceAll('_', ' ') ;
    s = s.replaceAll('-', ' ') ;
    s = s.replaceAll('.', ' ') ;
    s = s.trim() ;
    return s ;
  }

export function cleanString(s) {
    s = s.replaceAll('#', ' ') ;
    s = s.replaceAll('*', ' ') ;
    s = s.replaceAll(':', ' ') ;
    s = s.replaceAll('-', ' ') ;
    s = s.replaceAll('(', ' ') ;
    s = s.replaceAll(')', ' ') ;
    s = s.trim() ;
    return s ;
}
