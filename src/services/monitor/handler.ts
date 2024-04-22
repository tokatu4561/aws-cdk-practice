import { SNSEvent } from "aws-lambda";

const webHookUrl = 'WEBHOOK_URL';

async function handler(event: SNSEvent, context) {
    for (const record of event.Records) {
        await fetch(webHookUrl, {
            method: 'POST',
            body: JSON.stringify({
                "text": `${record.Sns.Message}`
            })
        })
    }
}

export { handler }