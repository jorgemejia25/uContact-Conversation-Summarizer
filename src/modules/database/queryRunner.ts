#!/usr/bin/env node

import { DatabaseService } from "./service";
import { closePool } from "./database";

async function main() {
  try {
    // Get source number from command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error("Please provide a source number as an argument");
      console.error("Usage: ts-node queryRunner.ts <source_number>");
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
      console.log("No records found");
    } else {
      console.log("\nResults:");
      console.log("-".repeat(50));
      console.log("Fecha\t\tHoras");
      console.log("-".repeat(50));

      results.forEach((record) => {
        console.log(`${record.fecha}\t${record.horas}`);
      });
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
