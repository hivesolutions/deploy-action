# hivesolutions/deploy-action

GitHub Action that triggers a [`repository_dispatch`](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) event on a target repository, with a domain-shaped API for the common deploy-trigger case.

## Usage

Trigger a "latest" deploy (e.g. on a master push):

```yaml
- uses: hivesolutions/deploy-action@v1
  with:
    repository: hivesolutions/infra-bemisc
    service: mailog
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

The action sends a single `event_type: deploy` event; the receiving infra workflow uses `service`, `group`, `channel`, and `tag` from `client_payload` to do its work:

| `service` | `group` | `tag`     | `event_type` | `client_payload`                                                              |
| --------- | ------- | --------- | ------------ | ----------------------------------------------------------------------------- |
| `mailog`  | `mail`  | (omitted) | `deploy`     | `{"service":"mailog","group":"mail","channel":"latest"}`                      |
| `mailog`  | `mail`  | `v1.2.3`  | `deploy`     | `{"service":"mailog","group":"mail","channel":"stable","tag":"v1.2.3"}`       |

The `channel` is auto-derived from the presence of `tag` (`stable` if set, `latest` otherwise). Override with `channel: stable|latest` if needed.

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
| `service`        | no\*     | —       | Service name. Defaults `event_type` to `deploy` and adds `service` to `client_payload`                    |
| `group`          | no       | —       | Group/directory the service belongs to. Required when `service` is set. Added to `client_payload`         |
| `tag`            | no       | —       | Service tag. When set, channel becomes `stable` and `tag` is added to `client_payload`                    |
| `channel`        | no       | derived | `stable` or `latest`. Defaults to `stable` when `tag` is set, `latest` otherwise                          |
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
