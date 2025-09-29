export type WordTiming = { start:number; end:number; word:string }
export type LrcLine = { tStart:number; tEnd:number; text:string; words?: WordTiming[] }

export function parseLrc(raw:string): LrcLine[]{
  const linesRaw: {t:number; rawText:string}[] = []
  const lineRe = /\[(\d+):(\d+)(?:\.(\d+))?\](.*)/
  const rawLines = raw.split(/\r?\n/)
  for(const rl of rawLines){
    const m = rl.match(lineRe)
    if(m){
      const mm = Number(m[1])
      const ss = Number(m[2])
      const frac = m[3] ? Number((m[3]+'').padEnd(3,'0')) : 0
      const t = mm*60*1000 + ss*1000 + frac
      const text = m[4] || ''
      linesRaw.push({ t, rawText: text })
    }
  }

  // If no timestamped lines -> fallback unsynced 00:00 line
  if(linesRaw.length === 0){
    const joined = raw.trim()
    if(joined.length > 0){
      return [{ tStart:0, tEnd:5000, text: joined }]
    }
    return []
  }

  linesRaw.sort((a,b)=>a.t-b.t)
  const out: LrcLine[] = []

  for(let i=0;i<linesRaw.length;i++){
    const cur = linesRaw[i]
    const next = linesRaw[i+1]
    const tStart = cur.t
    const tEnd = next ? next.t : cur.t + 5000
    const text = cur.rawText.replace(/<[^>]+>/g,'').trim() // remove inline tags for the plain text

    // parse inline word timings
    const words: WordTiming[] = []
    const wordRe = /<(?:(\d+):(\d+)(?:\.(\d+))?|([0-9]+(?:\.[0-9]+)?))>([^<]+)/g
    // groups: 1 mm, 2 ss, 3 frac OR 4 seconds.fraction, 5 word text
    let wm: RegExpExecArray | null
    while((wm = wordRe.exec(cur.rawText)) !== null){
      let startMs = 0
      if(wm[1] && wm[2]){
        const mm = Number(wm[1]); const ss = Number(wm[2]); const frac = wm[3] ? Number((wm[3]+'').padEnd(3,'0')) : 0
        startMs = mm*60*1000 + ss*1000 + frac
      }else if(wm[4]){
        // interpret as seconds offset relative to line start
        const sec = Number(wm[4])
        startMs = tStart + Math.round(sec*1000)
      }
      const wtext = (wm[5] || '').trim()
      if(wtext){ words.push({ start: startMs, end: startMs + 1, word: wtext }) }
    }

    // if we have words, sort and fill end times
    if(words.length > 0){
      words.sort((a,b)=>a.start-b.start)
      for(let j=0;j<words.length;j++){
        const w = words[j]
        const nxt = words[j+1]
        w.end = nxt ? nxt.start : tEnd
      }
      out.push({ tStart, tEnd, text, words })
    }else{
      out.push({ tStart, tEnd, text })
    }
  }

  return out
}
