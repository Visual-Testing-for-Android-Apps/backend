build-UploadHandler:
	npm install
# workaround https://github.com/aws/aws-sam-cli/issues/2565
	npm rebuild
	npm run lint
	npm run fast-compile
	npm run test
	npm prune --production
ifeq ($(OS),Windows_NT)
	Xcopy /E * "$(ARTIFACTS_DIR)"
else
	cp -R * $(ARTIFACTS_DIR)
endif
