<!-- install bun -->
Install bun from https://bun.sh/docs/installation
<!-- install bun end -->
 
<!-- copy and rename env.example -->
Copy and rename env.example to .env and fill in the required values.
```bash
cp .env.example .env
```
Set Bot.Json Config

We have two options for storing data, Redis and Json. you can install Redis or use Json with pro.db dependency.

Install node-redis dependency
```bash
bun install redis
```
Or

Install pro.db dependency
```bash
bun install pro.db
```

Install other dependencies
```bash
bun install
```

Run the project
```bash
bun index.js
```
Or
```bash
bun index-redis.js
```