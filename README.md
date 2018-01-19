# SinglePager

Functional similar to [InstantClick](https://github.com/dieulot/instantclick/), makes simple static pages dynamic and instant just like a single-page-application. Only change the content of specified container.

For use with Hexo, Jekyll, etc.

Released in ES2015 without any transformation or polyfill such as Babel.

## Usage

### Initialize

Include and initialize it.

```html
...
<div data-pager-shell>
  ...
</div>
...

<script src="singlepager.js"></script>
<script>
  var sp = new Pager('data-pager-shell')
</script>
```

The parameter of construct could be an attribute name string, or a configure object.

```typescript
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

```

### `<script>` Hook Tag

While `<script>` tags in container will default run after the page switching, it can be specified to run before or after the page switching.

Remember that `<script>` with `data-run-before` (or other name setted in config) would run before the content changes, so do not make references to the target page elements.

```html
<div data-pager-shell>
  ...
  <div id="tag"></div>
  <script>
    document.getElementById('tag').innerHTML += '<p>Run after mount</p>'
  </script>
  <script data-run-before>
    // Error!
    // document.getElementById('tag').innerHTML += '<p>Run before mount</p>'
    alert('Run before mount')
  </script>
  <script data-pager-disabled>
    alert('Do not run this')
  </script>
</div>

```

## Build

Run `make` to dist, `make comile` to compile typescript (ts 2.2.1+ required)

## Test

Python 3.4+ required

Run `python -m http.server` then open `http://127.0.0.1:8000/test/test.html`

