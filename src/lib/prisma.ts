import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL is not configured.");
    }

    const adapter = new PrismaPg({
        connectionString,
    });

    return new PrismaClient({
        adapter,
    });
}

function getPrisma(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
}

/**
 * Lazy client so importing this module during `next build` does not require
 * DATABASE_URL (e.g. Docker builder stage). The error is thrown on first use
 * at runtime if the variable is still missing.
 */
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
        const client = getPrisma();
        const value = Reflect.get(client as object, prop, receiver);

        if (typeof value === "function") {
            return value.bind(client);
        }

        return value;
    },
});
