# Allmaps Test Server

Test server for Allmaps for annotations, manifests and IIIF images.

First, install dependencies:

```sh
pnpm install
```

To download IIIF images and generate IIIF Image API Level 0 tiles and IIIF Manifests, run

```sh
pnpm run build
```

To start the HTTP server, run:

```sh
pnpm run start
```
