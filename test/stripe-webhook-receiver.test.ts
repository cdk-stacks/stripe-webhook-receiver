import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as StripeWebhookReceiver from '../lib/stripe-webhook-receiver-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new StripeWebhookReceiver.StripeWebhookReceiverStack(app, 'MyTestStack');
    // THEN
    // expectCDK(stack).to(matchTemplate({
    //   "Resources": {}
    // }, MatchStyle.EXACT))
});

// Test API gateway
// Test webhook queues
// Test verifier function
// Test secrets
// Test stack outputs