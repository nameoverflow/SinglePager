(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Pager = factory());
}(this, (function () { 'use strict';

const defaultConfig = {
    shellMark: 'data-single-pager',
    disableMark: 'data-pager-disabled',
    ignoreScript: 'data-pager-ignore',
    runBefore: 'data-run-before',
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
         * Change page
         * @param href the href URL
         */
        const switchTo = (HTMLText, callback = null) => {
            // Create DOM Object from loaded HTML
            const doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = HTMLText;
            const newTitle = doc.title;
            // Take the specified element
            const shell = doc.querySelector(`[${this.config.shellMark}]`);
            const scripts = Array.from(shell.getElementsByTagName('script'))
                .filter((el) => (el.getAttribute('type') === null || el.getAttribute('type') === 'text/javascript')
                && !el.hasAttribute(this.config.ignoreScript));
            scripts.forEach(el => el.remove());
            const runBefore = scripts.filter(el => el.hasAttribute(this.config.runBefore))
                .map(copyScriptTag);
            const runAfter = scripts.filter(el => !el.hasAttribute(this.config.runBefore))
                .map(copyScriptTag);
            runBefore.forEach(scr => this.shell.appendChild(scr));
            window.requestAnimationFrame(() => {
                this.shell.innerHTML = shell.innerHTML;
                runAfter.forEach(scr => this.shell.appendChild(scr));
                window.scrollTo(0, 0);
                window.document.title = newTitle;
                callback && callback();
            });
        };
        const handleMouseOver = (e) => {
            const linkNode = this._getIfLink(e.target);
            if (!this._isLegalLink(linkNode)) {
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
            const linkNode = this._getIfLink(e.target);
            if (!linkNode) {
                return;
            }
            e.preventDefault();
            const href = linkNode.href;
            const cont = text => {
                switchTo(text, () => {
                    this._addHistory(href);
                    history.pushState(null, null, href);
                });
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
        this._addHistory(window.location.href);
        document.addEventListener('mouseover', handleMouseOver);
        // document.addEventListener('mouseout', clearPreload)
        document.addEventListener('click', handleClick);
    }
    _cancelRequest() {
        this.curRequest && this.curRequest.cancel();
        this.curRequest = null;
    }
    _addHistory(href) {
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
    }
    /**
     * Check if the element that mouse overed is or is child of `<a>`,
     * and its `href` should be load
     * @param el
     */
    _isLegalLink(el) {
        const loc = window.location;
        return el
            && el.nodeName === 'A'
            && !el.getAttribute(`${this.config.disableMark}`)
            && el.hostname === loc.hostname
            && el.port === loc.port
            && el.pathname !== loc.pathname;
    }
    _getIfLink(el) {
        while (el && (el.nodeName != 'A' || !el.getAttribute('href'))) {
            el = el.parentElement;
        }
        if (this._isLegalLink(el)) {
            return el;
        }
        return null;
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
function copyScriptTag(scr) {
    const n = document.createElement('script');
    n.text = scr.text;
    return n;
}

return Pager;

})));
