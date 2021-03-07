# Contributing

This is a community project where every contribution is appreciated!

There is a simple process to follow no matter if you are facing an bug, have an
idea, or simply have a question.

## Process of issue filing

Check if there is an existing issue covering your intention.

1. if you have the same problem but the outcome is different (or vice versa),
   add a comment stating the difference
2. if you have the exact same problem add a like (:+1:)
3. otherwise create a new issue

### Bugs

When facing a bug, give steps to reproduce as well as the error. If you have a
hypothesis to why this issue erupted, mention this. If you have already isolated
the issue and have found a fix, you can open a PR.

When you have a problem, these steps will often help:

- Make sure you use the latest version of Deno
- Add the `-r` or `--reload` flag to the Deno command to reload the cache
- Use the `-d` or `--debug` flag to the Nessie command to see if every value is
  as expected.

### Ideas

Ideas are always welcome, and if there is a good reason and/or many users agree,
there is a good chance it will be incorporated. Before making a PR, get feedback
from the maintainers and comunity.

### Questions

If you can't find the answers in one of the open (or closed) issues, create a
new one. If this project gains enough traction, a discord server will be
created, until then you can use the issues.

## When creating a PR

Before pushing commits, go through this checklist:

- You have run `deno fmt`
- All tests are running successfully locally (will save you time)

For a PR to be accepted, the following needs to be applied:

- Every method added, has a corresponding test
- Pipeline is green
- Nothing more than what the PR is supposed to solve is changed (unless
  discussed and approved)

## Testing

If you have `make` and `Docker` available, you can simply run `make test` (or
`make test-clean` if you have already started the docker containers, this will
be optimized in the future), otherwise boot up your databases and change the
connections accordingly (do not commit these changes). If you have `Docker` but
not `make`, you can look at the `Makefile` to see the commands to run.
