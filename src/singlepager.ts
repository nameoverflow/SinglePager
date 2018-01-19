interface PagerConfig {
  shellMark?: string,     // The mark attribute to replace content
  disableMark?: string,   // Attribute mark links not be load
  ignoreScript?: string,  // Ignore this `<script>` tag
  runBefore?: string,     // Run script in the `<script>` tag before page switch
  triggerTime?: number,   // Not implement
  historyToSave?: number  // Number of histories to save
}

const defaultConfig = <PagerConfig>{
  shellMark: 'data-single-pager',
  disableMark: 'data-pager-disabled',
  ignoreScript: 'data-pager-ignore',
  runBefore: 'data-run-before',
  triggerTime: 100,
  historyToSave: 3
}

/**
 * The Pager class
 */
export default class Pager {
  private shell: Element
  private before: IterableIterator<any>[] = []
  private after: IterableIterator<any>[] = []
  private curRequest: PagerRequest
  private config: PagerConfig
  private historyList: string[] = []
  private history: Map<string, PageHistory> = new Map()

  constructor(config: string)
  constructor(config: PagerConfig)
  constructor(config = {}) {

    /**
     * Change page
     * @param href the href URL
     */
    const switchTo = (HTMLText, callback: () => void = null) => {
      // Create DOM Object from loaded HTML
      const doc = document.implementation.createHTMLDocument('')
      doc.documentElement.innerHTML = HTMLText

      const newTitle = doc.title

      // Take the specified element
      const shell = doc.querySelector(`[${this.config.shellMark}]`)

      const scripts = Array.from(shell.getElementsByTagName('script'))
        .filter((el: HTMLScriptElement) =>
          (el.getAttribute('type') === null || el.getAttribute('type') === 'text/javascript')
          && !el.hasAttribute(this.config.ignoreScript))


      scripts.forEach(el => el.remove())

      const runBefore = scripts.filter(el => el.hasAttribute(this.config.runBefore))
        .map(copyScriptTag)
      const runAfter = scripts.filter(el => !el.hasAttribute(this.config.runBefore))
        .map(copyScriptTag)

      runBefore.forEach(scr => this.shell.appendChild(scr))
      window.requestAnimationFrame(() => {
        this.shell.innerHTML = shell.innerHTML
        runAfter.forEach(scr => this.shell.appendChild(scr))
        window.scrollTo(0, 0)
        window.document.title = newTitle
        callback && callback()
      })
    }


    const handleMouseOver = (e: MouseEvent) => {
      const linkNode = this._getIfLink(<Element>e.target)
      if (!this._isLegalLink(<HTMLAnchorElement>linkNode)) {
        return
      }

      if (this.curRequest) {
        if (linkNode === this.curRequest.source) {
          return
        }
        this._cancelRequest()
      }

      const req = new PagerRequest(linkNode)
      this.curRequest = req
    }

    const handleClick = (e: MouseEvent) => {
      const linkNode = this._getIfLink(<Element>e.target)
      if (!linkNode) {
        return
      }
      e.preventDefault()
      const href = linkNode.href
      const cont = text => {
        switchTo(text, () => {
          this._addHistory(href)
          history.pushState(null, null, href)
        })
      }
      if (this.curRequest && linkNode === this.curRequest.source) {
        this.curRequest.continue(cont)
        return
      }

      const req = new PagerRequest(linkNode)
      this.curRequest = req
      req.continue(cont)
    }

    window.onpopstate = (e: PopStateEvent) => {
      this._cancelRequest()
      const href = window.location.href
      const st = this.history.get(href)
      if (!st) {
        window.location.reload()
        return
      }
      window.document.title = st.title
      this.shell.innerHTML = st.content
    }

    this.config = Object.assign({}, defaultConfig)

    if (typeof config === 'string') {
      this.config.shellMark = config
    } else {
      Object.assign(this.config, config)
    }


    const shell = document.querySelector(`[${this.config.shellMark}]`)
    this.shell = shell || null
    this._addHistory(window.location.href)

    document.addEventListener('mouseover', handleMouseOver)
    // document.addEventListener('mouseout', clearPreload)
    document.addEventListener('click', handleClick)
  }

  private _cancelRequest(): void {
    this.curRequest && this.curRequest.cancel()
    this.curRequest = null
  }


  private _addHistory(href: string): void {
    if (!this.history.has(href)) {
      this.historyList.push(href)
    }
    this.history.set(href, {
      title: window.document.title,
      content: this.shell.innerHTML
    })
    if (this.historyList.length > this.config.historyToSave) {
      const first = this.historyList.shift()
      this.history.delete(first)
    }
  }

  /**
   * Check if the element that mouse overed is or is child of `<a>`,
   * and its `href` should be load
   * @param el 
   */
  private _isLegalLink(el: HTMLAnchorElement): boolean {
    const loc = window.location
    return el
      && el.nodeName === 'A'
      && !el.getAttribute(`${this.config.disableMark}`)
      && el.hostname === loc.hostname
      && el.port === loc.port
      && el.pathname !== loc.pathname
  }

  private _getIfLink(el: Element): HTMLAnchorElement {
    while (el && (el.nodeName != 'A' || !el.getAttribute('href'))) {
      el = el.parentElement
    }
    if (this._isLegalLink(<HTMLAnchorElement>el)) {
      return <HTMLAnchorElement>el
    }
    return null
  }


  public mount(el: string): void
  public mount(el: Element): void
  public mount(el): void {
    if (typeof el === 'string') {
      this.shell = document.querySelector(el)
    } else {
      this.shell = el
    }
  }
}

interface PageHistory {
  title: string,
  content: string
}

class PagerRequest {
  public source: Element
  public request: XMLHttpRequest

  private state = 0
  private continuation: (HTML: string) => void
  private response = null

  constructor(link: HTMLAnchorElement) {
    const xhr = new XMLHttpRequest()

    xhr.onreadystatechange = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        this.state = 1
        if (this.continuation) {
          this.continuation(xhr.responseText)
          return
        } else {
          this.response = xhr.responseText
        }
      }
    }
    xhr.open('GET', link.href)
    xhr.send()
    this.request = xhr
    this.source = link
  }

  cancel() {
    this.request.abort()
  }

  continue(cont: (HTML: string) => void) {
    if (this.state) {
      cont(this.response)
    } else {
      this.continuation = cont
    }
  }
}

function copyScriptTag(scr) {
  const n = document.createElement('script')
  n.text = scr.text
  return n
}


