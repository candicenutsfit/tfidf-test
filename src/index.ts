const norm = (vec: number[]) => Math.sqrt(vec.reduce((a, v) => a + v * v, 0));
const sumVec = (vec: { [k: string]: number }) => Object.values(vec).reduce((a, n) => a + n);

type TokenMap = { [k: string]: number };

interface IndexedText
{
  id: number;
  raw: string;
  tokens: TokenMap;
  tfidfCache?: TokenMap;
}

class Search
{
  indexed: IndexedText[] = [];
  totalTokenFreq: TokenMap = {};
  
  tf(tokenCount: number, totalTokens: number)
  {
    return tokenCount / totalTokens;
  }
  
  idf(token: string)
  {
    return Math.log(this.indexed.length/this.totalTokenFreq[token]);
  }
  
  scoreRelevance(doc: IndexedText, tokens: TokenMap, tokenTfidf: number[])
  {
    const ab = Object.entries(tokens).reduce((a, [t, tc], ti) => a + ((tokenTfidf[ti] * doc.tfidfCache![t]) || 0), 0);
    const d = norm(Object.values(doc.tfidfCache!)) * norm(tokenTfidf);

    return (ab / d) || 0;
  }
  
  recalcTfidfVec()
  {
    for (const i of this.indexed)
    {
      const localTotal = sumVec(i.tokens);
      i.tfidfCache = Object.entries(i.tokens).reduce((acc, [t, n]) => (acc[t] =
        this.tf(n, localTotal) *
        this.idf(t),
        acc
      ), {} as TokenMap);
    }
  }
  
  index(id: number, str: string)
  {
    const toks = Search.ngram(str, 2);
    this.indexed.push({
      id,
      raw: str,
      tokens: toks
    });
    
    for (const [t, c] of Object.entries(toks))
      this.totalTokenFreq[t] = (this.totalTokenFreq[t] ?? 0) + 1;
    
    this.recalcTfidfVec();
  }
  
  search(term: string)
  {
    const toks = Search.ngram(term, 2);
    // console.log(toks)
    
    // for (const i of this.indexed)
    const results = this.indexed.map((i, it) => {
      const localTotal = sumVec(i.tokens);
      const tfidf = Object.entries(toks).map(([t, c]) =>
        (this.tf(i.tokens[t] || 0, localTotal) * this.idf(t) * c) || 0
      );
      // console.log(tfidf);
      
      const relevancy = this.scoreRelevance(i, toks, tfidf);
      
      // console.log(relevancy)
      return [it, relevancy];
    });

    return results.sort((a, b) => b[1] - a[1]);
    
  }
  
  static ngram(str: string, n: number)
  {
    let tok: TokenMap = {};
    for (let i = 0; i < str.length - n + 1; i++)
    {
      const t = str.slice(i, i + n);
      tok[t] = (tok[t] || 0) + 1;
    }
    return tok;
  }
}

const search = new Search();
search.index(0, "test testing 123");
search.index(1, "the missile knows where the it is");


const a = search.search("testing");
console.log(a)
//console.log(search);