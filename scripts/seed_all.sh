#!/bin/bash

echo -e "🚀 Starting database seeding...\n"

echo -e "🛡️ Seeding moderator..."
bun run ./scripts/moderator.ts
echo -e "✅ Moderator seeding completed.\n"

echo -e "🧑‍💼 Seeding customer..."
bun run ./scripts/customer.ts
echo -e "✅ Customer seeding completed.\n"

echo -e "🧴 Seeding total bottles..."
bun run ./scripts/total_bottles.ts
echo -e "✅ Total bottles seeding completed.\n"

echo -e "📊 Seeding bottle usage..."
bun run ./scripts/bottle_usage.ts
echo -e "✅ Bottle usage seeding completed.\n"

echo -e "🎉 Database seeding completed successfully!"