install: # install-deps
	npm install
run:
	npx babel-node 'src/bin/hexlet.js' 10

install-deps:
	npm ci

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test

test-coverage:
	npm test -- --coverage --passWithNoTests

lint:
	npx eslint .

publish:
	npm publish --dry-run
