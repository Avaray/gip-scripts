# 🐷 GIP Scripts

Some time ago, I created [NPM](https://docs.npmjs.com/about-npm) package named [GIP](https://www.npmjs.com/package/gip), which is a simple [JavaScript](https://simple.wikipedia.org/wiki/JavaScript) [module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [CLI](https://en.wikipedia.org/wiki/Command-line_interface) tool that checks external [IPv4](https://en.wikipedia.org/wiki/IPv4) address of the machine it runs on. Now I want to create a few scripts in different programming languages that will do the same thing. 

These scripts will do the following:

- Do a parallel HTTP request to the multiple services that return the IP address.
- Ensure that the IP address is real by waiting for specific number of the same responses.

## Usage

You can grab the scripts from the [dist](https://github.com/Avaray/gip-scripts/tree/main/dist) directory.

You can pass `--ensure N` argument to specify the number of the same responses (default is 3) that you want to wait for. In this way, you will have verification that the IP address is real.
Keep in mind that currently there is 28 services, so do not pass the number greater than 28.
Also, keep in mind that some services may be down or not available in your region. Try to stick with low numbers.

### [BASH](https://www.gnu.org/software/bash/)

```bash
./gip.sh
./gip.sh --ensure 7
```

### [Python](https://www.python.org/)

```bash
python gip.py
python gip.py --ensure 7
```

### [Bun](https://bun.sh/)
  
```bash
bun gip.ts
bun gip.ts --ensure 7
```

### [Deno](https://deno.com/)

```bash
deno --allow-net gip.ts
deno --allow-net gip.ts --ensure 7
```

### [Go](https://go.dev/)

```bash
go run gip.go
go run gip.go --ensure 7
```
