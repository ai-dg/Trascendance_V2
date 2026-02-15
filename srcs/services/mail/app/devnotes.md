# Next steps

- Handle errors with nack() + retry
- Add a TTL (time-to-live) on messages if needed
- Set up a Dead Letter Queue to store failed messages
- Monitor with a dashboard such as RabbitMQ Management UI
- Add a tracking ID in the mail for tracing

## 1. The nack() function (Negative Acknowledgment)

It is the opposite of ack() (acknowledgment).

When a consumer receives a message, it can say "message received and processed OK" with ack().

If it cannot process the message (failure, or wants to retry later), it can use nack().

nack() means: "I reject this message, do not consider it as processed".

Depending on the broker configuration, this message can:

- be put back in the queue for retry,
- be sent to a Dead Letter Queue (DLQ) if too many retries or failures.

## 2. Dead Letter Queue (DLQ)

A special queue where messages that were not processed correctly go after a certain number of attempts or if explicitly rejected.

Prevents blocking the main queue with problematic messages.

Useful for analysing why some messages failed (log, debug, alerts).

Often, tools are set up to monitor the DLQ and intervene manually or automatically.

## 3. Tracking ID

A unique identifier associated with each message (often in the headers).

Used to trace the path of the message through the whole distributed system.

Very useful for:

- debug (find the message in the logs),
- monitoring (processing time, failures, performance),
- correlation in complex systems with multiple microservices.

In short, it is like a "digital trace" of the message.

## Why is this important?

These mechanisms allow reliability, robustness and traceability to be managed in a distributed system.

They avoid losing messages or getting stuck on a message that cannot be processed.
