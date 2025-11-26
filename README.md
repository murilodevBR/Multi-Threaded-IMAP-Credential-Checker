📌 Overview

This project implements a multi-threaded system to validate email credentials through IMAP connections using Node.js, worker_threads, and imap-simple, with real-time result emission.

The logic is split between the main thread and multiple workers, enabling parallel processing and significantly improving performance when handling large lists of accounts.

⚙️ How the System Works
1. Main Thread

Loads a list of credentials from a file (PPsucesso.txt).

Splits the list into smaller chunks based on the number of workers.

Creates multiple Worker instances and assigns each one a subset of the credentials.

Receives messages from workers indicating:

successful connections

connection errors

complete failures after attempting all IMAP prefixes

These messages can be logged, saved, or forwarded to a frontend (via WebSocket/SSE).

🧵 2. Worker Logic (worker.js)

Each worker independently processes its assigned credentials.
For each email:password pair:

🔍 Automatic IMAP Server Discovery

The worker attempts to authenticate using several common IMAP prefixes:

imap.
mail.
webmail.
secure.
imap.mail.
imap.secure.


Building hostnames such as:

imap.domain.com
mail.domain.com
secure.domain.com


Each authentication attempt uses:

Port 993

TLS enabled

A configurable authentication timeout

📬 3. Worker Result Messages

Workers send structured results back to the main thread using parentPort.postMessage().

✔️ SUCCESS

A valid IMAP login was detected:

[SUCESSO] prefix:port:email:password


The worker also logs the result to:

sucesso.txt

❌ ERROR

An error occurred while attempting to authenticate with a specific host:

[ERRO] email:password - Failed to connect to host - errorMessage

⚠️ FAILURE

All IMAP prefixes were attempted, but none succeeded:

[FALHA] email:password - No successful connections.


All errors are also logged using winston for debugging and record-keeping.

🚀 Architecture Benefits

Parallel processing: Workers handle chunks of data simultaneously for maximum efficiency.

Stability: Worker isolation ensures a failure in one thread does not affect the overall process.

Smart IMAP detection: Automatically tries multiple IMAP host patterns.

Robust logging: Successes and errors are stored in files for later review.

Modular design: Easily integrates with web interfaces and WebSocket communication.

📝 Summary

This code forms a complete, high-performance IMAP credential validation tool built around Node.js worker threads.
The multi-worker architecture enables fast processing of large credential lists, while structured logging and clear result types (success, error, failure) provide excellent transparency and reliability.
