dist: SinglePager.js
	babel src/SinglePager.js --out-file dist/SinglePager.js --presets=es2015

SinglePager.js: SinglePager.ts
	tsc src/SinglePager.ts --target ES2015

