# html2realpdf landing page

Server-rendered Next.js 16 landing page for [html2realpdf](https://github.com/imggion/html2realpdf).

## Local development

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The documentation is available at [http://localhost:3000/docs](http://localhost:3000/docs).

Generate and validate the API reference before documentation work:

```sh
npm run docs:generate
npm run docs:check
```

## Production URL

Set `NEXT_PUBLIC_SITE_URL` to the final public origin before deployment. It is used for canonical metadata, Open Graph URLs, `robots.txt`, and `sitemap.xml`.

```sh
NEXT_PUBLIC_SITE_URL=https://your-domain.example npm run build
```

The fallback is `https://html2realpdf.imggion.com`.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npm run docs:build
```

## License

This landing page is available under the [MIT License](./LICENSE).
