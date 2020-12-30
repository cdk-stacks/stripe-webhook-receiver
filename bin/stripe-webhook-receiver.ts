#!/usr/bin/env node

import 'source-map-support/register';

import { App } from '@aws-cdk/core';

import { StripeWebhookReceiverStack } from '../lib/stripe-webhook-receiver-stack';

const app = new App();

new StripeWebhookReceiverStack(app, 'StripeWebhookReceiverStack');
