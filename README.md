# SinglePager

Functional similar to [InstantClick](https://github.com/dieulot/instantclick/), makes simple static pages dynamic and instant just like a single-page-application. Only change the content of specified container.

For use with Hexo, Jekyll, etc.

Released in ES2015 without any transformation or polyfill such as Babel.

## Usage

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
  shellMark?: string,        // The marking attribute to replace content
  disableMark?: string,      // Attribute mark links not be load
  historyToSave?: number     // Number of histories to save
}

const defaultConfig = <PagerConfig>{
  shellMark: 'data-single-pager',
  disableMark: 'data-pager-disabled',
  historyToSave: 3
}
```

## TODO

- hookable `<script>` tag

- `before` and `after` hooks
