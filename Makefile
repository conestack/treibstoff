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
#: js.nodejs
#: js.rollup
#: js.wtr
#
# SETTINGS (ALL CHANGES MADE BELOW SETTINGS WILL BE LOST)
##############################################################################

## core.base

# `deploy` target dependencies.
# No default value.
DEPLOY_TARGETS?=

# target to be executed when calling `make run`
# No default value.
RUN_TARGET?=

# Additional files and folders to remove when running clean target
# No default value.
CLEAN_FS?=build \
	bundle \
	dist \
	coverage \
	treibstoff-* \
	treibstoff.egg-info

# Optional makefile to include before default targets. This can
# be used to provide custom targets or hook up to existing targets.
# Default: include.mk
INCLUDE_MAKEFILE?=include.mk

# Optional additional directories to be added to PATH in format
# `/path/to/dir/:/path/to/other/dir`. Gets inserted first, thus gets searched
# first.
# No default value.
EXTRA_PATH?=

## js.nodejs

# The package manager to use. Defaults to `npm`. Possible values
# are `npm` and `pnpm`
# Default: npm
NODEJS_PACKAGE_MANAGER?=pnpm

# Value for `--prefix` option when installing packages.
# Default: .
NODEJS_PREFIX?=.

# Packages to install with `--no-save` option.
# No default value.
NODEJS_PACKAGES?=

# Packages to install with `--save-dev` option.
# No default value.
NODEJS_DEV_PACKAGES?=

# Packages to install with `--save-prod` option.
# No default value.
NODEJS_PROD_PACKAGES?=

# Packages to install with `--save-optional` option.
# No default value.
NODEJS_OPT_PACKAGES?=

# Additional install options. Possible values are `--save-exact`
# and `--save-bundle`.
# No default value.
NODEJS_INSTALL_OPTS?=

## js.wtr

# Web test runner config file.
# Default: wtr.config.mjs
WTR_CONFIG?=wtr.config.mjs

# Web test runner additional command line options.
# Default: --coverage
WTR_OPTIONS?=--coverage

## js.rollup

# Rollup config file.
# Default: rollup.conf.js
ROLLUP_CONFIG?=rollup.conf.js

## core.mxenv

# Primary Python interpreter to use. It is used to create the
# virtual environment if `VENV_ENABLED` and `VENV_CREATE` are set to `true`.
# Default: python3
PRIMARY_PYTHON?=python3

# Minimum required Python version.
# Default: 3.7
PYTHON_MIN_VERSION?=3.7

# Install packages using the given package installer method.
# Supported are `pip` and `uv`. If uv is used, its global availability is
# checked. Otherwise, it is installed, either in the virtual environment or
# using the `PRIMARY_PYTHON`, dependent on the `VENV_ENABLED` setting. If
# `VENV_ENABLED` and uv is selected, uv is used to create the virtual
# environment.
# Default: pip
PYTHON_PACKAGE_INSTALLER?=pip

# Flag whether to use a global installed 'uv' or install
# it in the virtual environment.
# Default: false
MXENV_UV_GLOBAL?=false

# Flag whether to use virtual environment. If `false`, the
# interpreter according to `PRIMARY_PYTHON` found in `PATH` is used.
# Default: true
VENV_ENABLED?=true

# Flag whether to create a virtual environment. If set to `false`
# and `VENV_ENABLED` is `true`, `VENV_FOLDER` is expected to point to an
# existing virtual environment.
# Default: true
VENV_CREATE?=true

# The folder of the virtual environment.
# If `VENV_ENABLED` is `true` and `VENV_CREATE` is true it is used as the
# target folder for the virtual environment. If `VENV_ENABLED` is `true` and
# `VENV_CREATE` is false it is expected to point to an existing virtual
# environment. If `VENV_ENABLED` is `false` it is ignored.
# Default: .venv
VENV_FOLDER?=venv

# mxdev to install in virtual environment.
# Default: mxdev
MXDEV?=mxdev

# mxmake to install in virtual environment.
# Default: mxmake
MXMAKE?=mxmake

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

## core.packages

# Allow prerelease and development versions.
# By default, the package installer only finds stable versions.
# Default: false
PACKAGES_ALLOW_PRERELEASES?=false

##############################################################################
# END SETTINGS - DO NOT EDIT BELOW THIS LINE
##############################################################################

INSTALL_TARGETS?=
DIRTY_TARGETS?=
CLEAN_TARGETS?=
PURGE_TARGETS?=

export PATH:=$(if $(EXTRA_PATH),$(EXTRA_PATH):,)$(PATH)

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
$(SENTINEL): $(firstword $(MAKEFILE_LIST))
	@mkdir -p $(SENTINEL_FOLDER)
	@echo "Sentinels for the Makefile process." > $(SENTINEL)

##############################################################################
# nodejs
##############################################################################

export PATH:=$(shell pwd)/$(NODEJS_PREFIX)/node_modules/.bin:$(PATH)


NODEJS_TARGET:=$(SENTINEL_FOLDER)/nodejs.sentinel
$(NODEJS_TARGET): $(SENTINEL)
	@echo "Install nodejs packages"
	@test -z "$(NODEJS_DEV_PACKAGES)" \
		&& echo "No dev packages to be installed" \
		|| $(NODEJS_PACKAGE_MANAGER) --prefix $(NODEJS_PREFIX) install \
			--save-dev \
			$(NODEJS_INSTALL_OPTS) \
			$(NODEJS_DEV_PACKAGES)
	@test -z "$(NODEJS_PROD_PACKAGES)" \
		&& echo "No prod packages to be installed" \
		|| $(NODEJS_PACKAGE_MANAGER) --prefix $(NODEJS_PREFIX) install \
			--save-prod \
			$(NODEJS_INSTALL_OPTS) \
			$(NODEJS_PROD_PACKAGES)
	@test -z "$(NODEJS_OPT_PACKAGES)" \
		&& echo "No opt packages to be installed" \
		|| $(NODEJS_PACKAGE_MANAGER) --prefix $(NODEJS_PREFIX) install \
			--save-optional \
			$(NODEJS_INSTALL_OPTS) \
			$(NODEJS_OPT_PACKAGES)
	@test -z "$(NODEJS_PACKAGES)" \
		&& echo "No packages to be installed" \
		|| $(NODEJS_PACKAGE_MANAGER) --prefix $(NODEJS_PREFIX) install \
			--no-save \
			$(NODEJS_PACKAGES)
	@touch $(NODEJS_TARGET)

.PHONY: nodejs
nodejs: $(NODEJS_TARGET)

.PHONY: nodejs-dirty
nodejs-dirty:
	@rm -f $(NODEJS_TARGET)

.PHONY: nodejs-clean
nodejs-clean: nodejs-dirty
	@rm -rf $(NODEJS_PREFIX)/node_modules

INSTALL_TARGETS+=nodejs
DIRTY_TARGETS+=nodejs-dirty
CLEAN_TARGETS+=nodejs-clean

##############################################################################
# web test runner
##############################################################################

NODEJS_DEV_PACKAGES+=\
	@web/test-runner \
	@web/dev-server-import-maps

.PHONY: wtr
wtr: $(NODEJS_TARGET)
	@web-test-runner $(WTR_OPTIONS) --config $(WTR_CONFIG)

##############################################################################
# rollup
##############################################################################

NODEJS_DEV_PACKAGES+=\
	rollup \
	rollup-plugin-cleanup \
	@rollup/plugin-terser

.PHONY: rollup
rollup: $(NODEJS_TARGET)
	@rollup --config $(ROLLUP_CONFIG)

##############################################################################
# jsdoc
##############################################################################

NODEJS_DEV_PACKAGES+=jsdoc
DOCS_REQUIREMENTS+=sphinx_js

##############################################################################
# mxenv
##############################################################################

export OS:=$(OS)

# Determine the executable path
ifeq ("$(VENV_ENABLED)", "true")
export VIRTUAL_ENV=$(abspath $(VENV_FOLDER))
ifeq ("$(OS)", "Windows_NT")
VENV_EXECUTABLE_FOLDER=$(VIRTUAL_ENV)/Scripts
else
VENV_EXECUTABLE_FOLDER=$(VIRTUAL_ENV)/bin
endif
export PATH:=$(VENV_EXECUTABLE_FOLDER):$(PATH)
MXENV_PYTHON=python
else
MXENV_PYTHON=$(PRIMARY_PYTHON)
endif

# Determine the package installer
ifeq ("$(PYTHON_PACKAGE_INSTALLER)","uv")
PYTHON_PACKAGE_COMMAND=uv pip
else
PYTHON_PACKAGE_COMMAND=$(MXENV_PYTHON) -m pip
endif

MXENV_TARGET:=$(SENTINEL_FOLDER)/mxenv.sentinel
$(MXENV_TARGET): $(SENTINEL)
	@$(PRIMARY_PYTHON) -c "import sys; vi = sys.version_info; sys.exit(1 if (int(vi[0]), int(vi[1])) >= tuple(map(int, '$(PYTHON_MIN_VERSION)'.split('.'))) else 0)" \
		&& echo "Need Python >= $(PYTHON_MIN_VERSION)" && exit 1 || :
	@[[ "$(VENV_ENABLED)" == "true" && "$(VENV_FOLDER)" == "" ]] \
		&& echo "VENV_FOLDER must be configured if VENV_ENABLED is true" && exit 1 || :
	@[[ "$(VENV_ENABLED)$(PYTHON_PACKAGE_INSTALLER)" == "falseuv" ]] \
		&& echo "Package installer uv does not work with a global Python interpreter." && exit 1 || :
ifeq ("$(VENV_ENABLED)", "true")
ifeq ("$(VENV_CREATE)", "true")
ifeq ("$(PYTHON_PACKAGE_INSTALLER)$(MXENV_UV_GLOBAL)","uvtrue")
	@echo "Setup Python Virtual Environment using package 'uv' at '$(VENV_FOLDER)'"
	@uv venv -p $(PRIMARY_PYTHON) --seed $(VENV_FOLDER)
else
	@echo "Setup Python Virtual Environment using module 'venv' at '$(VENV_FOLDER)'"
	@$(PRIMARY_PYTHON) -m venv $(VENV_FOLDER)
	@$(MXENV_PYTHON) -m ensurepip -U
endif
endif
else
	@echo "Using system Python interpreter"
endif
ifeq ("$(PYTHON_PACKAGE_INSTALLER)$(MXENV_UV_GLOBAL)","uvfalse")
	@echo "Install uv"
	@$(MXENV_PYTHON) -m pip install uv
endif
	@$(PYTHON_PACKAGE_COMMAND) install -U pip setuptools wheel
	@echo "Install/Update MXStack Python packages"
	@$(PYTHON_PACKAGE_COMMAND) install -U $(MXDEV) $(MXMAKE)
	@touch $(MXENV_TARGET)

.PHONY: mxenv
mxenv: $(MXENV_TARGET)

.PHONY: mxenv-dirty
mxenv-dirty:
	@rm -f $(MXENV_TARGET)

.PHONY: mxenv-clean
mxenv-clean: mxenv-dirty
ifeq ("$(VENV_ENABLED)", "true")
ifeq ("$(VENV_CREATE)", "true")
	@rm -rf $(VENV_FOLDER)
endif
else
	@$(PYTHON_PACKAGE_COMMAND) uninstall -y $(MXDEV)
	@$(PYTHON_PACKAGE_COMMAND) uninstall -y $(MXMAKE)
endif

INSTALL_TARGETS+=mxenv
DIRTY_TARGETS+=mxenv-dirty
CLEAN_TARGETS+=mxenv-clean

##############################################################################
# sphinx
##############################################################################

# additional targets required for building docs.
DOCS_TARGETS+=

SPHINX_BIN=sphinx-build
SPHINX_AUTOBUILD_BIN=sphinx-autobuild

DOCS_TARGET:=$(SENTINEL_FOLDER)/sphinx.sentinel
$(DOCS_TARGET): $(MXENV_TARGET)
	@echo "Install Sphinx"
	@$(PYTHON_PACKAGE_COMMAND) install -U sphinx sphinx-autobuild $(DOCS_REQUIREMENTS)
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
	@test -e $(MXENV_PYTHON) && $(MXENV_PYTHON) -m pip uninstall -y \
		sphinx sphinx-autobuild $(DOCS_REQUIREMENTS) || :
	@rm -rf $(DOCS_TARGET_FOLDER)

INSTALL_TARGETS+=$(DOCS_TARGET)
DIRTY_TARGETS+=docs-dirty
CLEAN_TARGETS+=docs-clean

##############################################################################
# mxfiles
##############################################################################

# case `core.sources` domain not included
SOURCES_TARGET?=

# File generation target
MXMAKE_FILES?=$(MXMAKE_FOLDER)/files

# set environment variables for mxmake
define set_mxfiles_env
	@export MXMAKE_FILES=$(1)
endef

# unset environment variables for mxmake
define unset_mxfiles_env
	@unset MXMAKE_FILES
endef

$(PROJECT_CONFIG):
ifneq ("$(wildcard $(PROJECT_CONFIG))","")
	@touch $(PROJECT_CONFIG)
else
	@echo "[settings]" > $(PROJECT_CONFIG)
endif

LOCAL_PACKAGE_FILES:=$(wildcard pyproject.toml setup.cfg setup.py requirements.txt constraints.txt)

FILES_TARGET:=requirements-mxdev.txt
$(FILES_TARGET): $(PROJECT_CONFIG) $(MXENV_TARGET) $(SOURCES_TARGET) $(LOCAL_PACKAGE_FILES)
	@echo "Create project files"
	@mkdir -p $(MXMAKE_FILES)
	$(call set_mxfiles_env,$(MXMAKE_FILES))
	@mxdev -n -c $(PROJECT_CONFIG)
	$(call unset_mxfiles_env)
	@test -e $(MXMAKE_FILES)/pip.conf && cp $(MXMAKE_FILES)/pip.conf $(VENV_FOLDER)/pip.conf || :
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

# additional sources targets which requires package re-install on change
-include $(MXMAKE_FILES)/additional_sources_targets.mk
ADDITIONAL_SOURCES_TARGETS?=

INSTALLED_PACKAGES=$(MXMAKE_FILES)/installed.txt

ifeq ("$(PACKAGES_ALLOW_PRERELEASES)","true")
ifeq ("$(PYTHON_PACKAGE_INSTALLER)","uv")
PACKAGES_PRERELEASES=--prerelease=allow
else
PACKAGES_PRERELEASES=--pre
endif
else
PACKAGES_PRERELEASES=
endif

PACKAGES_TARGET:=$(INSTALLED_PACKAGES)
$(PACKAGES_TARGET): $(FILES_TARGET) $(ADDITIONAL_SOURCES_TARGETS)
	@echo "Install python packages"
	@$(PYTHON_PACKAGE_COMMAND) install $(PACKAGES_PRERELEASES) -r $(FILES_TARGET)
	@$(PYTHON_PACKAGE_COMMAND) freeze > $(INSTALLED_PACKAGES)
	@touch $(PACKAGES_TARGET)

.PHONY: packages
packages: $(PACKAGES_TARGET)

.PHONY: packages-dirty
packages-dirty:
	@rm -f $(PACKAGES_TARGET)

.PHONY: packages-clean
packages-clean:
	@test -e $(FILES_TARGET) \
		&& test -e $(MXENV_PYTHON) \
		&& $(MXENV_PYTHON) -m pip uninstall -y -r $(FILES_TARGET) \
		|| :
	@rm -f $(PACKAGES_TARGET)

INSTALL_TARGETS+=packages
DIRTY_TARGETS+=packages-dirty
CLEAN_TARGETS+=packages-clean

-include $(INCLUDE_MAKEFILE)

##############################################################################
# Default targets
##############################################################################

INSTALL_TARGET:=$(SENTINEL_FOLDER)/install.sentinel
$(INSTALL_TARGET): $(INSTALL_TARGETS)
	@touch $(INSTALL_TARGET)

.PHONY: install
install: $(INSTALL_TARGET)
	@touch $(INSTALL_TARGET)

.PHONY: run
run: $(RUN_TARGET)

.PHONY: deploy
deploy: $(DEPLOY_TARGETS)

.PHONY: dirty
dirty: $(DIRTY_TARGETS)
	@rm -f $(INSTALL_TARGET)

.PHONY: clean
clean: dirty $(CLEAN_TARGETS)
	@rm -rf $(CLEAN_TARGETS) $(MXMAKE_FOLDER) $(CLEAN_FS)

.PHONY: purge
purge: clean $(PURGE_TARGETS)

.PHONY: runtime-clean
runtime-clean:
	@echo "Remove runtime artifacts, like byte-code and caches."
	@find . -name '*.py[c|o]' -delete
	@find . -name '*~' -exec rm -f {} +
	@find . -name '__pycache__' -exec rm -fr {} +

