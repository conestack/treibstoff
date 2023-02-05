##############################################################################
# THIS FILE IS GENERATED BY MXMAKE
#
# DOMAINS:
#: core.base
#: core.mxenv
#: core.mxfiles
#: core.packages
#: docs.jsdoc
#: docs.sphinx
#: js.karma
#: js.npm
#: js.rollup
#: system.dependencies
#
# SETTINGS (ALL CHANGES MADE BELOW SETTINGS WILL BE LOST)
##############################################################################

## core.base

# `deploy` target dependencies.
# No default value.
DEPLOY_TARGETS?=

## js.npm

# Value for `--prefix` option.
# Default: .
NPM_PREFIX?=.

# Packages which get installed with `--no-save` option.
# No default value.
NPM_PACKAGES?=

# Packages which get installed with `--save-dev` option.
# No default value.
NPM_DEV_PACKAGES?=qunit https://github.com/jquery/jquery#main

# Packages which get installed with `--save-prod` option.
# No default value.
NPM_PROD_PACKAGES?=

# Packages which get installed with `--save-optional` option.
# No default value.
NPM_OPT_PACKAGES?=

# Additional install options. Possible values are `--save-exact`
# and `--save-bundle`.
# No default value.
NPM_INSTALL_OPTS?=

## system.dependencies

# Space separated system package names.
# No default value.
SYSTEM_DEPENDENCIES?=

## js.rollup

# Rollup config file.
# Default: rollup.conf.js
ROLLUP_CONFIG?=rollup.conf.js

## js.karma

# Karma config file.
# Default: karma.conf.js
KARMA_CONFIG?=karma.conf.js

# Karma additional command line options.
# Default: --single-run
KARMA_OPTIONS?=--single-run

## core.mxenv

# Python interpreter to use.
# Default: python3
PYTHON_BIN?=python3

# Minimum required Python version.
# Default: 3.7
PYTHON_MIN_VERSION?=3.7

# Flag whether to use virtual environment.
# If `false`, the interpreter according to `PYTHON_BIN` found in `PATH` is used.
# Default: true
VENV_ENABLED?=true

# Flag whether to create a virtual environment. If set to `false`
# and `VENV_ENABLED` is `true`, `VENV_FOLDER` is expected to point to an
# existing virtual environment.
# Default: true
VENV_CREATE?=true

# The folder of the virtual environment.
# If `VENV_ENABLED` is `true` and `VENV_CREATE` is true it is used as the target folder for the virtual environment.
# If `VENV_ENABLED` is `true` and `VENV_CREATE` is false it is expected to point to an existing virtual environment.
# If `VENV_ENABLED` is `false` it is ignored.
# Default: venv
VENV_FOLDER?=venv

# mxdev to install in virtual environment.
# Default: https://github.com/mxstack/mxdev/archive/main.zip
MXDEV?=https://github.com/mxstack/mxdev/archive/main.zip

# mxmake to install in virtual environment.
# Default: https://github.com/mxstack/mxmake/archive/develop.zip
MXMAKE?=https://github.com/mxstack/mxmake/archive/develop.zip

## docs.sphinx

# Documentation source folder.
# Default: docs/source
DOCS_SOURCE_FOLDER?=docs/source

# Documentation generation target folder.
# Default: docs/html
DOCS_TARGET_FOLDER?=docs/html

# Documentation Python requirements to be installed (via pip).
# No default value.
DOCS_REQUIREMENTS?=sphinx-conestack-theme

## core.mxfiles

# The config file to use.
# Default: mx.ini
PROJECT_CONFIG?=mx.ini

##############################################################################
# END SETTINGS - DO NOT EDIT BELOW THIS LINE
##############################################################################

INSTALL_TARGETS?=
DIRTY_TARGETS?=
CLEAN_TARGETS?=
PURGE_TARGETS?=

# Defensive settings for make: https://tech.davis-hansson.com/p/make/
SHELL:=bash
.ONESHELL:
# for Makefile debugging purposes add -x to the .SHELLFLAGS
.SHELLFLAGS:=-eu -o pipefail -O inherit_errexit -c
.SILENT:
.DELETE_ON_ERROR:
MAKEFLAGS+=--warn-undefined-variables
MAKEFLAGS+=--no-builtin-rules

# mxmake folder
MXMAKE_FOLDER?=.mxmake

# Sentinel files
SENTINEL_FOLDER?=$(MXMAKE_FOLDER)/sentinels
SENTINEL?=$(SENTINEL_FOLDER)/about.txt
$(SENTINEL):
	@mkdir -p $(SENTINEL_FOLDER)
	@echo "Sentinels for the Makefile process." > $(SENTINEL)

##############################################################################
# npm
##############################################################################

# case `system.dependencies` domain is included
SYSTEM_DEPENDENCIES+=npm

NPM_TARGET:=$(SENTINEL_FOLDER)/npm.sentinel
$(NPM_TARGET): $(SENTINEL)
	@echo "Install npm packages"
ifneq ("$(NPM_PACKAGES)", "")
	@npm install --prefix $(NPM_PREFIX) --no-save install $(NPM_PACKAGES)
endif
ifneq ("$(NPM_DEV_PACKAGES)", "")
	@npm install --prefix $(NPM_PREFIX) --save-dev $(NPM_INSTALL_OPTS) install $(NPM_DEV_PACKAGES)
endif
ifneq ("$(NPM_PROD_PACKAGES)", "")
	@npm install --prefix $(NPM_PREFIX) --save-prod $(NPM_INSTALL_OPTS) install $(NPM_PROD_PACKAGES)
endif
ifneq ("$(NPM_OPT_PACKAGES)", "")
	@npm install --prefix $(NPM_PREFIX) --save-optional $(NPM_INSTALL_OPTS) install $(NPM_OPT_PACKAGES)
endif
	@touch $(NPM_TARGET)

.PHONY: npm
npm: $(NPM_TARGET)

.PHONY: npm-dirty
npm-dirty:
	@rm -f $(NPM_TARGET)

.PHONY: npm-clean
npm-clean: npm-dirty
	@rm -rf $(NPM_PREFIX)/node_modules

INSTALL_TARGETS+=npm
DIRTY_TARGETS+=npm-dirty
CLEAN_TARGETS+=npm-clean

##############################################################################
# system dependencies
##############################################################################

.PHONY: system-dependencies
system-dependencies:
	@echo "Install system dependencies"
	@test -z "$(SYSTEM_DEPENDENCIES)" && echo "No System dependencies defined"
	@test -z "$(SYSTEM_DEPENDENCIES)" \
		|| sudo apt-get install -y $(SYSTEM_DEPENDENCIES)

##############################################################################
# rollup
##############################################################################

# extend npm dev packages
NPM_DEV_PACKAGES+=rollup rollup-plugin-cleanup rollup-plugin-terser

.PHONY: rollup
rollup:
	@$(NPM_PREFIX)/node_modules/rollup/dist/bin/rollup --config $(ROLLUP_CONFIG)

##############################################################################
# karma
##############################################################################

# extend npm dev packages
NPM_DEV_PACKAGES+=karma karma-coverage karma-chrome-launcher karma-module-resolver-preprocessor

.PHONY: karma
karma:
	@$(NPM_PREFIX)/node_modules/karma/bin/karma start $(KARMA_CONFIG) $(KARMA_OPTIONS)

##############################################################################
# jsdoc
##############################################################################

JSDOC_PATH=$(shell pwd)/$(NPM_PREFIX)/node_modules/jsdoc

JSDOC_TARGET:=$(SENTINEL_FOLDER)/jsdoc.sentinel
$(JSDOC_TARGET): $(NPM_TARGET)
	@echo "Link jsdoc executable to name expected by Sphinx"
	@ln -sf $(JSDOC_PATH)/jsdoc.js $(JSDOC_PATH)/jsdoc
	@touch $(JSDOC_TARGET)

.PHONY: jsdoc
jsdoc: $(JSDOC_TARGET)
	@export PATH=$PATH:$(JSDOC_PATH)

# extend npm dev packages
NPM_DEV_PACKAGES+=jsdoc

# extend sphinx requirements and docs targets
DOCS_REQUIREMENTS+=sphinx_js
DOCS_TARGETS+=jsdoc

# extend default targets
INSTALL_TARGETS+=$(JSDOC_TARGET)

##############################################################################
# mxenv
##############################################################################

# Check if given Python is installed
ifeq (,$(shell which $(PYTHON_BIN)))
$(error "PYTHON=$(PYTHON_BIN) not found in $(PATH)")
endif

# Check if given Python version is ok
PYTHON_VERSION_OK=$(shell $(PYTHON_BIN) -c "import sys; print((int(sys.version_info[0]), int(sys.version_info[1])) >= tuple(map(int, '$(PYTHON_MIN_VERSION)'.split('.'))))")
ifeq ($(PYTHON_VERSION_OK),0)
$(error "Need Python >= $(PYTHON_MIN_VERSION)")
endif

# Check if venv folder is configured if venv is enabled
ifeq ($(shell [[ "$(VENV_ENABLED)" == "true" && "$(VENV_FOLDER)" == "" ]] && echo "true"),"true")
$(error "VENV_FOLDER must be configured if VENV_ENABLED is true")
endif

# determine the executable path
ifeq ("$(VENV_ENABLED)", "true")
MXENV_PATH=$(VENV_FOLDER)/bin/
else
MXENV_PATH=
endif

MXENV_TARGET:=$(SENTINEL_FOLDER)/mxenv.sentinel
$(MXENV_TARGET): $(SENTINEL)
ifeq ("$(VENV_ENABLED)", "true")
	@echo "Setup Python Virtual Environment under '$(VENV_FOLDER)'"
	@$(PYTHON_BIN) -m venv $(VENV_FOLDER)
endif
	@$(MXENV_PATH)pip install -U pip setuptools wheel
	@$(MXENV_PATH)pip install -U $(MXDEV)
	@$(MXENV_PATH)pip install -U $(MXMAKE)
	@touch $(MXENV_TARGET)

.PHONY: mxenv
mxenv: $(MXENV_TARGET)

.PHONY: mxenv-dirty
mxenv-dirty:
	@rm -f $(MXENV_TARGET)

.PHONY: mxenv-clean
mxenv-clean: mxenv-dirty
ifeq ("$(VENV_ENABLED)", "true")
	@rm -rf $(VENV_FOLDER)
else
	@$(MXENV_PATH)pip uninstall -y $(MXDEV)
	@$(MXENV_PATH)pip uninstall -y $(MXMAKE)
endif

INSTALL_TARGETS+=mxenv
DIRTY_TARGETS+=mxenv-dirty
CLEAN_TARGETS+=mxenv-clean

##############################################################################
# sphinx
##############################################################################

# additional targets required for building docs.
DOCS_TARGETS+=

SPHINX_BIN=$(MXENV_PATH)sphinx-build
SPHINX_AUTOBUILD_BIN=$(MXENV_PATH)sphinx-autobuild

DOCS_TARGET:=$(SENTINEL_FOLDER)/sphinx.sentinel
$(DOCS_TARGET): $(MXENV_TARGET)
	@echo "Install Sphinx"
	@$(MXENV_PATH)pip install -U sphinx sphinx-autobuild $(DOCS_REQUIREMENTS)
	@touch $(DOCS_TARGET)

.PHONY: docs
docs: $(DOCS_TARGET) $(DOCS_TARGETS)
	@echo "Build sphinx docs"
	@$(SPHINX_BIN) $(DOCS_SOURCE_FOLDER) $(DOCS_TARGET_FOLDER)

.PHONY: docs-live
docs-live: $(DOCS_TARGET) $(DOCS_TARGETS)
	@echo "Rebuild Sphinx documentation on changes, with live-reload in the browser"
	@$(SPHINX_AUTOBUILD_BIN) $(DOCS_SOURCE_FOLDER) $(DOCS_TARGET_FOLDER)

.PHONY: docs-dirty
docs-dirty:
	@rm -f $(DOCS_TARGET)

.PHONY: docs-clean
docs-clean: docs-dirty
	@rm -rf $(DOCS_TARGET_FOLDER)

INSTALL_TARGETS+=$(DOCS_TARGET)
DIRTY_TARGETS+=docs-dirty
CLEAN_TARGETS+=docs-clean

##############################################################################
# mxfiles
##############################################################################

# File generation target
MXMAKE_FILES?=$(MXMAKE_FOLDER)/files

# set environment variables for mxmake
define set_mxfiles_env
	@export MXMAKE_MXENV_PATH=$(1)
	@export MXMAKE_FILES=$(2)
endef

# unset environment variables for mxmake
define unset_mxfiles_env
	@unset MXMAKE_MXENV_PATH
	@unset MXMAKE_FILES
endef

$(PROJECT_CONFIG):
ifneq ("$(wildcard $(PROJECT_CONFIG))","")
	@touch $(PROJECT_CONFIG)
else
	@echo "[settings]" > $(PROJECT_CONFIG)
endif

LOCAL_PACKAGE_FILES:=
ifneq ("$(wildcard pyproject.toml)","")
	LOCAL_PACKAGE_FILES+=pyproject.toml
endif
ifneq ("$(wildcard setup.cfg)","")
	LOCAL_PACKAGE_FILES+=setup.cfg
endif
ifneq ("$(wildcard setup.py)","")
	LOCAL_PACKAGE_FILES+=setup.py
endif

FILES_TARGET:=requirements-mxdev.txt
$(FILES_TARGET): $(PROJECT_CONFIG) $(MXENV_TARGET) $(LOCAL_PACKAGE_FILES)
	@echo "Create project files"
	@mkdir -p $(MXMAKE_FILES)
	$(call set_mxfiles_env,$(MXENV_PATH),$(MXMAKE_FILES))
	@$(MXENV_PATH)mxdev -n -c $(PROJECT_CONFIG)
	$(call unset_mxfiles_env,$(MXENV_PATH),$(MXMAKE_FILES))
	@touch $(FILES_TARGET)

.PHONY: mxfiles
mxfiles: $(FILES_TARGET)

.PHONY: mxfiles-dirty
mxfiles-dirty:
	@touch $(PROJECT_CONFIG)

.PHONY: mxfiles-clean
mxfiles-clean: mxfiles-dirty
	@rm -rf constraints-mxdev.txt requirements-mxdev.txt $(MXMAKE_FILES)

INSTALL_TARGETS+=mxfiles
DIRTY_TARGETS+=mxfiles-dirty
CLEAN_TARGETS+=mxfiles-clean

##############################################################################
# packages
##############################################################################

# case `core.sources` domain not included
SOURCES_TARGET?=

# additional sources targets which requires package re-install on change
-include $(MXMAKE_FILES)/additional_sources_targets.mk
ADDITIONAL_SOURCES_TARGETS?=

INSTALLED_PACKAGES=$(MXMAKE_FILES)/installed.txt

PACKAGES_TARGET:=$(INSTALLED_PACKAGES)
$(PACKAGES_TARGET): $(FILES_TARGET) $(SOURCES_TARGET) $(ADDITIONAL_SOURCES_TARGETS)
	@echo "Install python packages"
	@$(MXENV_PATH)pip install -r $(FILES_TARGET)
	@$(MXENV_PATH)pip freeze > $(INSTALLED_PACKAGES)
	@touch $(PACKAGES_TARGET)

.PHONY: packages
packages: $(PACKAGES_TARGET)

.PHONY: packages-dirty
packages-dirty:
	@rm -f $(PACKAGES_TARGET)

.PHONY: packages-clean
packages-clean:
	@pip uninstall -y -r $(FILES_TARGET)
	@rm -f $(PACKAGES_TARGET)

INSTALL_TARGETS+=packages
DIRTY_TARGETS+=packages-dirty
CLEAN_TARGETS+=packages-clean

##############################################################################
# Default targets
##############################################################################

INSTALL_TARGET:=$(SENTINEL_FOLDER)/install.sentinel
$(INSTALL_TARGET): $(INSTALL_TARGETS)
	@touch $(INSTALL_TARGET)

.PHONY: install
install: $(INSTALL_TARGET)
	@touch $(INSTALL_TARGET)

.PHONY: deploy
deploy: $(DEPLOY_TARGETS)

.PHONY: dirty
dirty: $(DIRTY_TARGETS)
	@rm -f $(INSTALL_TARGET)

.PHONY: clean
clean: dirty $(CLEAN_TARGETS)
	@rm -rf $(CLEAN_TARGETS) $(MXMAKE_FOLDER)

.PHONY: purge
purge: clean $(PURGE_TARGETS)

.PHONY: runtime-clean
runtime-clean:
	@echo "Remove runtime artifacts, like byte-code and caches."
	@find . -name '*.py[c|o]' -delete
	@find . -name '*~' -exec rm -f {} +
	@find . -name '__pycache__' -exec rm -fr {} +

