import { Stack, StackProps, Construct, Duration, RemovalPolicy, CfnOutput } from '@aws-cdk/core';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { HttpApi } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { RetentionDays } from "@aws-cdk/aws-logs";

import { QueueWithDLQ } from "@simple-cdk-constructs/queue-with-dlq";

export class StripeWebhookReceiverStack extends Stack {
  public verifiedWebhookQueues: QueueWithDLQ;
  public api: HttpApi;
  public verifierFunction: Function;
  public stripeApiKeySecret: Secret;
  public stripeWebhookSigningSecret: Secret;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create the secrets for the Stripe details
    this.createSecrets();

    // Create queue to store verified webhooks in and dlq
    this.createQueues();

    // Create webhook verifier function
    this.createFunction();

    // Allow lambda function to get secret values
    this.stripeApiKeySecret.grantRead(this.verifierFunction);
    this.stripeWebhookSigningSecret.grantRead(this.verifierFunction);

    // Allow lambda function to write to SQS Queue
    this.verifiedWebhookQueues.queue.grantSendMessages(this.verifierFunction);

    // Create API Gateway for Stripe webhook endpoint
    this.createApi();

    // Add route from API Gateway to verifier function
    this.api.addRoutes({
      path: '/',
      integration: new LambdaProxyIntegration({
        handler: this.verifierFunction
      })
    });

    // Create stack outputs for CloudFormation
    this.createStackOutputs();
  }

  createSecrets = (): void => {
    this.stripeApiKeySecret = new Secret(this, 'stripe-api-key-secret', {
      secretName: 'stripe-api-key',
      description: 'Stripe API key used in the stripe webhook receiver stack.',
      removalPolicy: RemovalPolicy.DESTROY
    });

    this.stripeWebhookSigningSecret = new Secret(this, 'stripe-webhook-signing-secret', {
      secretName: 'stripe-webhook-signing-secret',
      description: 'Stripe webhook signing secret used in the stripe webhook receiver stack.',
      removalPolicy: RemovalPolicy.DESTROY
    });
  };

  createQueues = (): void => {
    this.verifiedWebhookQueues = new QueueWithDLQ(this, 'verified-stripe-webhooks-queue', {
      name: 'stripe-verified-webhooks-queue'
    });
  }

  createFunction = (): void => {
    this.verifierFunction = new Function(this, 'verifier-function', {
      code: Code.fromAsset('./lambdas/stripe-verifier'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_12_X,
      environment: {
        STRIPE_API_KEY_NAME: this.stripeApiKeySecret.secretName,
        STRIPE_WEBHOOK_SIGNING_SECRET_NAME: this.stripeWebhookSigningSecret.secretName,
        SQS_VERIFIED_WEBHOOKS_URL: this.verifiedWebhookQueues.queue.queueUrl
      },
      timeout: Duration.seconds(30),
      memorySize: 512,
      functionName: 'stripe-webhook-receiver',
      logRetention: RetentionDays.ONE_WEEK,
      description: 'Verifies stripe webhooks from API Gateway and sends them to SQS if valid.'
    });
  }

  createApi = (): void => {
    this.api = new HttpApi(this, 'stripe-webhook-api', {
      apiName: 'stripe-webhook-receiver',
      description: 'Receives Stripe webhooks and passes them to a serverless verifier.'
    });
  }

  createStackOutputs = (): void => {
    new CfnOutput(this, 'stripe-webhook-receiver-endpoint', {
      exportName: 'stripe-webhook-receiver-endpoint',
      value: this.api.apiEndpoint,
      description: 'The webhook receiver endpoint. Use this for your Stripe webhook endpoint URL.'
    });

    new CfnOutput(this, 'verified-webhooks-queue-url', {
      exportName: 'stripe-webhook-receiver-verified-queue',
      value: this.verifiedWebhookQueues.queue.queueUrl,
      description: 'Output queue for verified webhooks. Consume verified webhooks from here.'
    });
  }
}
