/**
 * A TypeScript interface enumerating all the arguments
 * we expect yargs to provide us with.
 */
export interface DockergenArguments {
  docker: string;
  script: string[];
  expose: number[];
  env: string[];
  test: boolean;
  registry: string;
  image: string;
  runcmd: string;
  dryrun: boolean;
  name: string | null;
  ecr: string | null;
  scope: string | null;
  overwrite: boolean;
}
