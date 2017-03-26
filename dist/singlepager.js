(function (global) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = Pager :
        typeof define === 'function' && define.amd ? define(() => Pager) : (global['Pager'] = Pager);
    const defaultConfig = {
        shellMark: 'data-single-pager',
        disableMark: 'data-pager-disabled',
        triggerTime: 100,
        historyToSave: 3
    };
    /**
     * The Pager class
     */
    class Pager {
        constructor(config = {}) {
            this.before = [];
            this.after = [];
            this.historyList = [];
            this.history = new Map();
            /**
             * Check if the element that mouse overed is or is child of `<a>`,
             * and its `href` should be load
             * @param el
             */
            const isLegalLink = (el) => {
                const loc = window.location;
                return el
                    && el.nodeName === 'A'
                    && !el.getAttribute(`${this.config.disableMark}`)
                    && el.hostname === loc.hostname
                    && el.port === loc.port
                    && el.pathname !== loc.pathname;
            };
            const addHistory = (href) => {
                if (!this.history.has(href)) {
                    this.historyList.push(href);
                }
                this.history.set(href, {
                    title: window.document.title,
                    content: this.shell.innerHTML
                });
                if (this.historyList.length > this.config.historyToSave) {
                    const first = this.historyList.shift();
                    this.history.delete(first);
                }
            };
            /**
             * Change page
             * @param href the href URL
             */
            const switchTo = HTMLText => {
                const doc = document.implementation.createHTMLDocument('');
                doc.documentElement.innerHTML = HTMLText;
                const shell = doc.querySelector(`[${this.config.shellMark}]`);
                this.shell.innerHTML = shell.innerHTML;
                window.scrollTo(0, 0);
            };
            const handleMouseOver = (e) => {
                const linkNode = getIfLink(e.target);
                if (!isLegalLink(linkNode)) {
                    return;
                }
                if (this.curRequest) {
                    if (linkNode === this.curRequest.source) {
                        return;
                    }
                    this._cancelRequest();
                }
                const req = new PagerRequest(linkNode);
                this.curRequest = req;
            };
            const handleClick = (e) => {
                const linkNode = getIfLink(e.target);
                if (!linkNode) {
                    return;
                }
                e.preventDefault();
                const href = linkNode.href;
                const cont = text => {
                    switchTo(text);
                    addHistory(href);
                    history.pushState(null, null, href);
                };
                if (this.curRequest && linkNode === this.curRequest.source) {
                    this.curRequest.continue(cont);
                    return;
                }
                const req = new PagerRequest(linkNode);
                this.curRequest = req;
                req.continue(cont);
            };
            window.onpopstate = (e) => {
                this._cancelRequest();
                const href = window.location.href;
                const st = this.history.get(href);
                if (!st) {
                    window.location.reload();
                    return;
                }
                window.document.title = st.title;
                this.shell.innerHTML = st.content;
            };
            this.config = Object.assign({}, defaultConfig);
            if (typeof config === 'string') {
                this.config.shellMark = config;
            }
            else {
                Object.assign(this.config, config);
            }
            const shell = document.querySelector(`[${this.config.shellMark}]`);
            this.shell = shell || null;
            addHistory(window.location.href);
            document.addEventListener('mouseover', handleMouseOver);
            // document.addEventListener('mouseout', clearPreload)
            document.addEventListener('click', handleClick);
        }
        _cancelRequest() {
            this.curRequest && this.curRequest.cancel();
            this.curRequest = null;
        }
        mount(el) {
            if (typeof el === 'string') {
                this.shell = document.querySelector(el);
            }
            else {
                this.shell = el;
            }
        }
    }
    class PagerRequest {
        constructor(link) {
            this.state = 0;
            this.response = null;
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    this.state = 1;
                    if (this.continuation) {
                        this.continuation(xhr.responseText);
                        return;
                    }
                    else {
                        this.response = xhr.responseText;
                    }
                }
            };
            xhr.open('GET', link.href);
            xhr.send();
            this.request = xhr;
            this.source = link;
        }
        cancel() {
            this.request.abort();
        }
        continue(cont) {
            if (this.state) {
                cont(this.response);
            }
            else {
                this.continuation = cont;
            }
        }
    }
    function getIfLink(el) {
        while (el && (el.nodeName != 'A' || !el.getAttribute('href'))) {
            el = el.parentElement;
        }
        return el;
    }
    // window['Pager'] = Pager
})(this);
