import path from "path";

import { defineConfig } from "@playwright/test";

const TEST_PORT = 3200;
const TEST_DATABASE_URL = process.env.PLAYWRIGHT_DATABASE_URL
    ?? "postgresql://postgres:postgres@127.0.0.1:5432/app?schema=playwright";
const TEST_JWT_SECRET = process.env.PLAYWRIGHT_JWT_SECRET ?? "playwright-test-secret";
const ATTACHMENT_DIR = path.join(process.cwd(), ".playwright-artifacts", "attachments");
const ATTACHMENT_URL_BASE = "/test-attachments";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.ATTACHMENT_DIR = ATTACHMENT_DIR;
process.env.ATTACHMENT_URL_BASE = ATTACHMENT_URL_BASE;

export default defineConfig({
    testDir: "./tests/api",
    fullyParallel: false,
    workers: 1,
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    reporter: [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report/api" }],
    ],
    use: {
        baseURL: `http://127.0.0.1:${TEST_PORT}`,
    },
    webServer: {
        command: "npm run test:api:server",
        url: `http://127.0.0.1:${TEST_PORT}`,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120_000,
        env: {
            ...process.env,
            PORT: String(TEST_PORT),
            DATABASE_URL: TEST_DATABASE_URL,
            JWT_SECRET: TEST_JWT_SECRET,
            ATTACHMENT_DIR,
            ATTACHMENT_URL_BASE,
            NODE_ENV: "test",
        },
    },
});
