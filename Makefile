test:
	@./node_modules/.bin/mocha

publish:
	node bin/make.js build -a && npm publish

.PHONY: test
