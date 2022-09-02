#!/usr/bin/env just --justfile

default: test

c VERSION:
  git commit -am ':bookmark: @paraspell/sdk@{{VERSION}}'

build:
  @pnpm run build

link:
  @pnpm link

pack:
  @pnpm pack

publish:
  pnpm publish --access public

release: publish

test:
  @pnpm run test
