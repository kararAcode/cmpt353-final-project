export const TEST_DATABASE_URL = process.env.DATABASE_URL
    ?? "postgresql://postgres:postgres@127.0.0.1:5432/app?schema=playwright";
export const TEST_JWT_SECRET = process.env.JWT_SECRET ?? "playwright-test-secret";
export const TEST_ATTACHMENT_DIR = process.env.ATTACHMENT_DIR ?? ".playwright-artifacts/attachments";

export const TEST_USERS = {
    admin: {
        email: "admin@example.com",
        password: "AdminPass123!",
        displayName: "Admin User",
        role: "admin",
    },
    member: {
        email: "member@example.com",
        password: "MemberPass123!",
        displayName: "Member User",
        role: "member",
    },
    guest: {
        email: "guest@example.com",
        password: "GuestPass123!",
        displayName: "Guest User",
        role: "member",
    },
} as const;
