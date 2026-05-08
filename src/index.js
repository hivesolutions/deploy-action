const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        const repository = core.getInput("repository", { required: true });
        const service = core.getInput("service");
        const tag = core.getInput("tag");
        const eventTypeRaw = core.getInput("event-type");
        const clientPayloadRaw = core.getInput("client-payload") || "{}";
        const token = core.getInput("token", { required: true });

        const [owner, repo] = repository.split("/");
        if (!owner || !repo) {
            throw new Error(
                `Invalid 'repository' input: '${repository}'. Expected 'owner/repo'.`
            );
        }

        let eventType = eventTypeRaw;
        if (!eventType) {
            if (!service) {
                throw new Error(
                    "Either 'service' or 'event-type' must be provided."
                );
            }
            eventType = tag ? `deploy-${service}` : `deploy-${service}-latest`;
        }

        let clientPayload;
        try {
            clientPayload = JSON.parse(clientPayloadRaw);
        } catch (err) {
            throw new Error(
                `Invalid 'client-payload' input: not valid JSON (${err.message})`
            );
        }

        if (tag && !eventTypeRaw) {
            clientPayload.tag = tag;
        }

        for (const [envKey, envValue] of Object.entries(process.env)) {
            if (!envKey.startsWith("INPUT_PAYLOAD-")) continue;
            const payloadKey = envKey
                .slice("INPUT_PAYLOAD-".length)
                .toLowerCase();
            if (!payloadKey) continue;
            clientPayload[payloadKey] = envValue;
        }

        const octokit = github.getOctokit(token);

        core.info(
            `Dispatching event '${eventType}' to ${owner}/${repo}`
        );
        await octokit.rest.repos.createDispatchEvent({
            owner,
            repo,
            event_type: eventType,
            client_payload: clientPayload
        });
        core.info("Dispatch event sent successfully");
    } catch (err) {
        core.setFailed(err.message);
    }
}

run();
