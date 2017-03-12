.PHONY: release

VERSION=

release:
	zip -r twitter-image-helper-v$(VERSION).zip ./LICENSE ./README.md ./background.js ./content_scripts ./manifest.json
