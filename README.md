The goal of this project is to create a simple Node package that is capable
of creating customized `Dockerfile`s for Node projects and building the 
images associated with those `Dockerfile`s.

# Features

  - Generates `Dockerfile` based on a template with many configuration options.
  - Configuration can be controlled directly by options in `package.json`.
  - Support for "scopes" and private repositories.
  - Support for `yarn` and using `yarn.lock` for deterministic deployments.

# Installation

You can install `dockergen` either globally using `npm install -g
dockergen` or as a dev dependency using `npm install dockergen --dev`.
If installed as a dev dependency, the `dockergen` bin script will be
in your `PATH` if running `dockergen` from NPM scripts via `npm run
...`.

# Usage

## Pure command line

### Generating `Dockerfile`s

All available options can be found via the `--help` option, e.g.,:

```
$ dockergen gen --help

Options:
  --help           Show help                                              [boolean]
  -i, --image      Base Docker image              [string] [default: "node:latest"]
  -e, --env        Settable environment variables (NAME=VAL)  [array] [default: []]
  -x, --expose     Ports to EXPOSE                            [array] [default: []]
  -s, --script     Scripts to run during build                [array] [default: []]
  -c, --scope      Scope to use for repos                  [string] [default: null]
  -o, --overwrite  Overwrite existing Dockerfile         [boolean] [default: false]
  -t, --test       Run tests during build                 [boolean] [default: true]
  -r, --runcmd     NPM script to launch application     [string] [default: "start"]
```

### Building Docker images

Normally, one would use `docker build -t <NAME> .` to build a docker
image from an existing Dockerfile.  But because we want to supporting
building using private repositories AND doing so as part of the
**build process** (as opposed to installing Node packages when the
container is start), we need to add some build arguments.  The typical
build command would look something like:

```
docker build --build-arg NPM_TOKEN=00000000-0000-0000-0000-000000000000 -t <NAME> .
```

To help streamline this, the `dockergen` script features an additional
`build` command that adds these extra command line arguments.  The
equivalent `dockergen` command would be:

```
$ dockergen build --name <NAME>
```

The token is taken from the environment variable `NPM_TOKEN` to avoid
having to hardwire it into any files that might be version controlled
or otherwise shared with others.

The command line arguments for `dockergen build` are:

```
$ dockergen build --help

Options:
  --help        Show help                                                 [boolean]
  -n, --name    Name to give image being built  [string] [required] [default: null]
  -k, --dryrun  Perform a dryrun build                   [boolean] [default: false]
  -d, --docker  Docker command                         [string] [default: "docker"]
```

## Using `npm run`

As mentioned previous, if `dockergen` is installed as a dev
dependency, it can be called via `npm run ...`.  An example of using
`dockergen` from the `scripts` section of `package.json` might look
like this:

```
  "scripts": {
    ...
    "gen": "dockergen gen",
    "image": "dockergen build",
  }
```

Note the absence of any command line switches?  Such switches can be
avoided by building them directly into `package.json`.  By default,
`dockergen` looks for a `"dockergen"` section in `package.json`.  Any
fields in that object are used as the default values for the command
line arguments (note that `env` is a special case...it appears as an
object in `package.json` but as an array of strings of the form
`<NAME>=<VAL>` when specified via the command line).

**N.B.** if you want to check that `dockergen` is picking up default
values from `package.json`, simply run `dockergen gen --help`.  The
default values shown by `--help` include any values found in
`package.json`.

## Use with `sdocker`

Note that `dockergen build` includes a command line option `--docker`.
This allows you to use an alternative program as the Docker client.
For example, you can substitute `sdocker`
([an alternative client that supports SSH tunneling](https://github.com/xogeny/sdocker))
using this option.  This allows you to avoid the complication of using
TLS certificates for secure use of Docker and instead rely on SSH
keys.
