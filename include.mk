##############################################################################
# biome (JS linting and formatting)
##############################################################################

.PHONY: biome-check
biome-check: $(NODEJS_TARGET)
	@biome check

.PHONY: biome-format
biome-format: $(NODEJS_TARGET)
	@biome check --write

CHECK_TARGETS+=biome-check
FORMAT_TARGETS+=biome-format
