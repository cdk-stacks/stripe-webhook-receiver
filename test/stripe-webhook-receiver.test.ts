/**
 * Note: I wish I could find a way to test these without messing with logical ID's.
 *
 * @see https://github.com/aws/aws-cdk/issues/9278
 * @see https://www.nuomiphp.com/eplan/en/277279.html
 *
 * These could really be fleshed out more but it's too much effort to deal with logical ID's or matching synth output
 * to be that bothered.
 */

import { expect as expectCDK, countResources, haveOutput } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { StripeWebhookReceiverStack } from '../lib/stripe-webhook-receiver-stack';

const testApp = new cdk.App();
const testStack = new StripeWebhookReceiverStack(testApp, 'StripeWebhookTestStack');

test('The API Gateway is created correctly', () => {
    expectCDK(testStack).to(countResources('AWS::ApiGatewayV2::Api',1));
    expectCDK(testStack).to(countResources('AWS::ApiGatewayV2::Stage',1));
});

test('The API Gateway is able to invoke the verifier function', () => {
    expectCDK(testStack).to(countResources('AWS::ApiGatewayV2::Integration',1));
    expectCDK(testStack).to(countResources('AWS::ApiGatewayV2::Route',1));
    expectCDK(testStack).to(countResources('AWS::Lambda::Permission',1));
});

test('The verified webhooks SQS queue is created correctly', () => {
    expectCDK(testStack).to(countResources('AWS::SQS::Queue',2));
});

test('The verifier lambda function is created correctly', () => {
    expectCDK(testStack).to(countResources('AWS::Lambda::Function',2)); // lambda + log retention
});

test('The stripe api key and webhook secrets are created correctly', () => {
    expectCDK(testStack).to(countResources('AWS::SecretsManager::Secret',2));
});

test('The stack outputs the API Gateway endpoint and the URL of the SQS queue', () => {
    expectCDK(testStack).to(haveOutput({
        exportName: 'stripe-webhook-receiver-endpoint'
    }));

    expectCDK(testStack).to(haveOutput({
        exportName: 'stripe-webhook-receiver-verified-queue'
    }));
});