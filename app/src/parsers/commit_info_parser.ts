import CommitInfo from '../model/commit_info';


export default class CommitInfoParser {

  private data ;
  private result ;

  constructor(data) {
    this.data = data ;
    this.result = new CommitInfo() ;
    this.parse() ;
  }

  parse() {
    //console.log('CommitInfoParser.parse()') ;
    //console.log(this.data) ;
    this.result.commit = this.data.commit ;
    const author = this.data.author ;
    const indexSplit = author.indexOf('<') ;
    this.result.authorName = author.substring(0,indexSplit).trim() ;
    this.result.authorEmail = author.substring(indexSplit+1, author.length-1).trim() ;
    this.result.date = Date.parse(this.data.date) ;
    const message = this.data.message ;
    this.result.message = message ;
    const lastDash = message.lastIndexOf('-') ;
    this.result.pullRequest = parseInt(message.substring(lastDash+1)) ;
    if (!this.result.pullRequest) {
        const parts = message.split('-') ;
        this.result.pullRequest = this.findFirstNumber(parts) ;
    }
    //if (!this.result.pullRequest) {
    //    console.warn('Couldnt find a pull request number in: '+message) ;
    //}
  }

  findFirstNumber(parts) {
    for (var i=0 ; i<parts.length ; i++) {
        const number = parseInt(parts[i]) ;
        if (number) {
            return number ;
        }
    }
    return null ;
  }

  getResult() {
    return this.result ;
  }

}
