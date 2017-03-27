dist: compile
	node_modules/.bin/rollup -c

compile: src/singlepager.ts
	node_modules/.bin/tsc src/singlepager.ts --target ES2015
