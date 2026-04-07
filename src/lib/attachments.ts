import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

import { mkdir, writeFile } from "fs/promises";

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_EXTENSIONS_BY_TYPE = new Map<string, string[]>([
    ["image/png", [".png"]],
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/webp", [".webp"]],
]);

type CreateAttachmentsInput = {
    files: File[];
    targetType: string;
    targetId: string;
};

function validateAttachment(file: File) {
    const normalizedName = file.name.toLowerCase();
    const allowedExtensions = ALLOWED_EXTENSIONS_BY_TYPE.get(file.type);

    if (!ALLOWED_IMAGE_TYPES.has(file.type) || !allowedExtensions) {
        throw new ApiError(400, "Only PNG, JPEG/JPG, and WebP screenshots are allowed");
    }

    const hasAllowedExtension = allowedExtensions.some((extension) =>
        normalizedName.endsWith(extension),
    );

    if (!hasAllowedExtension) {
        throw new ApiError(
            400,
            "Attachment file extension must match its PNG, JPEG/JPG, or WebP format",
        );
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new ApiError(400, "Screenshots must be 5 MB or smaller");
    }
}

export async function createAttachments({
    files,
    targetType,
    targetId,
}: CreateAttachmentsInput) {
    const attachmentDir = process.env.ATTACHMENT_DIR;
    const attachmentUrlBase = process.env.ATTACHMENT_URL_BASE;

    if (files.length > 0 && (!attachmentDir || !attachmentUrlBase)) {
        throw new ApiError(500, "Attachment storage is not configured");
    }

    const attachmentRecords = [];

    for (const file of files) {
        validateAttachment(file);
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.includes(".") ? file.name.split(".").at(-1) : "bin";
        const uuid = crypto.randomUUID();

        await mkdir(attachmentDir as string, {
            recursive: true,
        });
        await writeFile(`${attachmentDir}/${uuid}.${ext}`, buffer);

        const newAttachment = await prisma.attachment.create({
            data: {
                targetType,
                targetId,
                mimeType: file.type,
                sizeBytes: file.size,
                path: `${attachmentUrlBase}/${uuid}.${ext}`,
            },
        });

        attachmentRecords.push(newAttachment);
    }

    return attachmentRecords;
}
