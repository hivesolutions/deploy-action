# Hive Deploy Action

GitHub Action that triggers a [`repository_dispatch`](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) event on a target repository.

## Usage

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    event-type: deploy-mailog-latest
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

With a `client_payload`:

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    event-type: deploy-mailog
    client-payload: ${{ toJSON(format('{{"tag":"{0}"}}', github.ref_name)) }}
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

## Inputs

| Name             | Required | Default | Description                                                  |
| ---------------- | -------- | ------- | ------------------------------------------------------------ |
| `repository`     | yes      | —       | Target repository in `owner/repo` format                     |
| `event-type`     | yes      | —       | Value sent as `event_type`                                   |
| `client-payload` | no       | `{}`    | JSON string sent as `client_payload`                         |
| `token`          | yes      | —       | GitHub token (PAT) with `repo` scope on the target repository |

## Development

```bash
npm install
npm run build
```

The bundled `dist/index.js` must be committed — JavaScript actions run directly from the repo without `npm install`.

## License

Apache License, Version 2.0. See [LICENSE](LICENSE).
