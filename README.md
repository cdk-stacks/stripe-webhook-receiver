# @cdk-stacks/stripe-webhook-receiver

A simple stack to receive webhooks from Stripe, verify their authenticity and then add them to an SQS Queue for processing.

## Installation / Setup

1. Clone repo code.
2. Run `npm build` in project root.
3. Run `npm deploy` in project root and wait for CDK to deploy.
4. Add your webhook in the Stripe Dashboard using the API Endpoint CloudFormation output.
5. Add your Stripe API key and webhook signing secret to the new secrets in AWS Secret Manager.
6. Start receiving webhooks. Output of verified webhooks will be in the output SQS queue.