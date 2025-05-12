#!/usr/bin/env node

import { DatabaseService } from "./modules/database/service";
import { closePool } from "./modules/database/database";

async function main() {
  try {
    // Get source number from command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error("Please provide a source number as an argument");
      console.error("Usage: npx ts-node src/callQuery.ts <source_number>");
      console.error("Example: npx ts-node src/callQuery.ts 23296274");
      process.exit(1);
    }

    const src = args[0];
    console.log(`Querying calls for source number: ${src}`);

    // Create database service instance
    const databaseService = new DatabaseService();

    // Execute the query
    const results = await databaseService.getCallsByDateForSource(src);

    // Print results
    if (results.length === 0) {
      console.log("No records found for this source number");
    } else {
      console.log("\nResults:");
      console.log("-".repeat(60));
      console.log("| Fecha       | Horas                                |");
      console.log("-".repeat(60));

      results.forEach((record) => {
        console.log(
          `| ${record.fecha} | ${record.horas.slice(0, 35).padEnd(35)} |`
        );
      });
      console.log("-".repeat(60));
      console.log(`Total records: ${results.length}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the database connection pool
    await closePool();
  }
}

// Run the main function
main();
