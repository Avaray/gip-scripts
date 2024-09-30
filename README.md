# 🐷 GIP Scripts

Some time ago, I created [NPM](https://docs.npmjs.com/about-npm) package named [GIP](https://www.npmjs.com/package/gip), which is a simple [JavaScript](https://simple.wikipedia.org/wiki/JavaScript) [module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [CLI](https://en.wikipedia.org/wiki/Command-line_interface) tool that checks external [IPv4](https://en.wikipedia.org/wiki/IPv4) address of the machine it runs on. Now I want to create a few scripts in different programming languages that will do the same thing. I will create a BASH and Python scripts for sure. Probably C# will be the next one. Later I will see which other languages I will choose.

These scripts will do the following:

- Do a parallel HTTP request to the multiple services that return the IP address.
- Ensure that the IP address is real by waiting for at least three the same responses.
- Have ability to skip verification mentioned above and return the first response.

## Project

Scripts will be generated with [GitHub Actions](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions) and stored in the `dist` directory or maybe in root directory. I will see later.
I think I will use Bun for generating scripts.

## Usage

You can grab the scripts from the root directory of the repository.
Currently only BASH `gip.sh` and Python `gip.py` scripts are available.

You can pass `--ensure N` argument to specify the number of the same responses (default is 3).  
Keep in mind that currently there is 28 services, so do not pass the number greater than 28.

### BASH

```bash
./gip.sh
./gip.sh --ensure 10
```

### Python

```bash
python gip.py
python gip.py --ensure 10
```
