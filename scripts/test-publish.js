import { execSync } from "child_process";
import { readdirSync } from "fs";

try {
    // Locate the .tgz file in the current directory
    const files = readdirSync(process.cwd());
    const tarball = files.find((file) => file.endsWith(".tgz"));

    if (!tarball) {
        throw new Error('No .tgz file found. Did you run "npm pack"?');
    }

    console.log(`Found tarball: ${tarball}`);

    // Install the tarball globally
    console.log("Installing tarball globally...");
    execSync(`npm install -g ${tarball}`, { stdio: "inherit" });

    // Run a basic CLI command to test
    console.log("Testing the CLI...");
    execSync(`contentful-utility-suite`, { stdio: "inherit" });

    // Uninstall the tarball globally
    console.log("Uninstalling tarball...");
    execSync(`npm uninstall -g contentful-utility-suite`, { stdio: "inherit" });

    console.log("Test publish completed successfully!");
} catch (error) {
    console.error("Error during test-publish:", error.message);
    process.exit(1);
}
