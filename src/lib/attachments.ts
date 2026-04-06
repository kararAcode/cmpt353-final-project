import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

import { mkdir, writeFile } from "fs/promises";

type CreateAttachmentsInput = {
    files: File[];
    targetType: string;
    targetId: string;
};

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
