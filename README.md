# hivesolutions/deploy-action

GitHub Action that triggers a [`repository_dispatch`](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) event on a target repository, with a domain-shaped API for the common deploy-trigger case.

## Usage

Trigger a redeploy of a moving-tag service (e.g. on a master push):

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    service: mailog-latest
    group: mail
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

Trigger a tagged deploy (e.g. on a git tag push):

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    service: mailog
    group: mail
    tag: ${{ github.ref_name }}
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

The action sends a single `event_type: deploy` event; the receiving infra workflow reads `service`, `group`, and `tag` from `client_payload` to compute the HCL path (`nomad/jobs/{group}/{service}.hcl`) and do its work:

| `service`        | `group` | `tag`            | Behavior on the receiving side                                                            |
| ---------------- | ------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `mailog-latest`  | `mail`  | (omitted)        | Open `nomad/jobs/mail/mailog-latest.hcl`, bump `deploy_version`, redeploy                 |
| `mailog`         | `mail`  | `v1.2.3`         | Open `nomad/jobs/mail/mailog.hcl`, rewrite image lines to `:v1.2.3`, bump, redeploy       |
| `mailsis`        | `mail`  | `minimal-amd64`  | Open `nomad/jobs/mail/mailsis.hcl`, rewrite image lines to `:minimal-amd64`, bump, redeploy |

Use distinct `service` names for distinct deploys (e.g. `mailog` vs `mailog-latest`). The `service` IS the deploy identity — there's no separate "channel" concept.

## Lower-level inputs

For non-deploy use cases or custom event names, set `event-type` directly. When `event-type` is provided, `service` and `tag` are ignored (no auto-payload):

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    event-type: rebuild-cache
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

Add arbitrary string fields to `client_payload` with `payload-*` keys:

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    service: mailog
    tag: ${{ github.ref_name }}
    payload-env: production
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

For nested payloads, use `client-payload` with a JSON string. `payload-*` keys are merged on top and take precedence:

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    event-type: deploy-mailog
    client-payload: |
      {"meta": {"source": "ci"}}
    payload-tag: ${{ github.ref_name }}
    token: ${{ secrets.INFRA_DEPLOY_PAT }}
```

## Inputs

| Name             | Required | Default | Description                                                                                               |
| ---------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `repository`     | yes      | —       | Target repository in `owner/repo` format                                                                  |
| `service`        | no\*     | —       | Service identity. Maps to the HCL file at `nomad/jobs/{group}/{service}.hcl`                              |
| `group`          | no       | —       | Group/directory the service belongs to. Required when `service` is set                                    |
| `tag`            | no       | —       | Image tag. When set, the receiving workflow rewrites image lines to this tag. When omitted, only `deploy_version` is bumped |
| `channel`        | no       | —       | Deprecated. Accepted for backwards compatibility; passed through to `client_payload` but no longer drives behavior |
| `event-type`     | no\*     | `deploy` | Raw `event_type` value. Defaults to `deploy` when `service` is set. Overrides disable service auto-payload |
| `client-payload` | no       | `{}`    | JSON string sent as `client_payload`                                                                      |
| `payload-*`      | no       | —       | Any input prefixed with `payload-` becomes a string field on `client_payload` (overrides JSON keys)       |
| `token`          | yes      | —       | GitHub token (PAT) with `repo` scope on the target repository                                             |

\* Either `service` or `event-type` must be provided.

## Development

```bash
npm install
npm run build
```

The bundled `dist/index.js` must be committed — JavaScript actions run directly from the repo without `npm install`.

## License

hivesolutions/deploy-action is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).
