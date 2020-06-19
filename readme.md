### Usage:
```js
$(".nav").MegaJs({
	vertical: false,
	wrapper: false, // Can be `parent`, or jquery item, or selector
	spacing: 10, // Spacing between Nav li and Mega menu, px
});
```

### Mega content markup
```html
<div 
	id="m-item-1"
	class="mega-wrapper"  
	data-mega=""  
	data-align="left"  
	data-width="200px" 
	data-animation="up"
	data-m-animation="up"
	data-inner-align="auto"
>
	<div class="mega-inner">
		YOUR CONTENT
	</div>
</div>
```
`data-mega` Selector: the mega content, default:`#m-{NavLiID}`

### Mega Alignment
- Align: Add `data-align` to nav li tag, it can be: `left`, `right`, `auto`, `container`. IF align is `container` the settings `container` must set.
- Width: Add `data-width` to nav li tag, a number or `full`.
- `data-inner-align` Align item `mega-inner`, accept `auto` only.
- `data-animation` Animation for desktop mod can be `up`, `left` , `right`, 
- `data-m-animation` Animation for mobile mod can be "slide-up", slide-right, slide-left



### CSS
- Nav Li mega enable class: `mega-enabled`
- Active class: `mega-active`
  
