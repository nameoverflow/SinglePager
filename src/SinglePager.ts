
// Module manager declartions
interface AMDDefine extends Function {
  amd: Function
}
declare const exports: object
declare const module: { exports: object }
declare const define: AMDDefine

(function (global) {

  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = Pager :
	typeof define === 'function' && define.amd ? define(() => Pager) : (global['Pager'] = Pager)

  interface PagerConfig {
    shellMark?: string,     // The mark attribute to replace content
    disableMark?: string,   // Attribute mark links not be load
    triggerTime?: number,   // Not implement
    historyToSave?: number  // Number of histories to save
  }

  const defaultConfig = <PagerConfig>{
    shellMark: 'data-single-pager',
    disableMark: 'data-pager-disabled',
    triggerTime: 100,
    historyToSave: 3
  }
  /**
   * The Pager class
   */
  class Pager {
    private shell: Element
    private before: IterableIterator<any>[] = []
    private after: IterableIterator<any>[] = []
    private curRequest: PagerRequest
    private config: PagerConfig
    private historyList: string[] = []
    private history: Map<string, PageHistory> = new Map()

    // constructor();
    constructor(config: string)
    constructor(config: PagerConfig)
    constructor(config = {}) {

      /**
       * Check if the element that mouse overed is or is child of `<a>`,
       * and its `href` should be load
       * @param el 
       */
      const isLegalLink = (el: HTMLAnchorElement): boolean => {
        const loc = window.location
        return el
          && el.nodeName === 'A'
          && !el.getAttribute(`${this.config.disableMark}`)
          && el.hostname === loc.hostname
          && el.port === loc.port
          && el.pathname !== loc.pathname
      }

      const addHistory = (href: string) => {
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
       * Change page
       * @param href the href URL
       */
      const switchTo = HTMLText => {
        const doc = document.implementation.createHTMLDocument('')
        doc.documentElement.innerHTML = HTMLText
        const shell = doc.querySelector(`[${this.config.shellMark}]`)
        this.shell.innerHTML = shell.innerHTML
        window.scrollTo(0, 0)
      }


      const handleMouseOver = (e: MouseEvent) => {
        const linkNode = getIfLink(<Element>e.target)
        if (!isLegalLink(<HTMLAnchorElement>linkNode)) {
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
        const linkNode = getIfLink(<Element>e.target)
        if (!linkNode) {
          return
        }
        e.preventDefault()
        const href = linkNode.href
        const cont = text => {
          switchTo(text)
          addHistory(href)
          history.pushState(null, null, href)
          
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
      addHistory(window.location.href)

      document.addEventListener('mouseover', handleMouseOver)
      // document.addEventListener('mouseout', clearPreload)
      document.addEventListener('click', handleClick)
    }

    private _cancelRequest(): void {
      this.curRequest && this.curRequest.cancel()
      this.curRequest = null
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


  function getIfLink(el: Element): HTMLAnchorElement {
    while (el && (el.nodeName != 'A' || !el.getAttribute('href'))) {
      el = el.parentElement
    }
    return <HTMLAnchorElement>el
  }
  // window['Pager'] = Pager

})(this)

