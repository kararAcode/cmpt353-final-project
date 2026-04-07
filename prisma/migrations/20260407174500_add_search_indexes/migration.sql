CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "User_displayName_idx" ON "User"("displayName");
CREATE INDEX "Channel_name_idx" ON "Channel"("name");
CREATE INDEX "Post_channelId_createdAt_id_idx" ON "Post"("channelId", "createdAt" DESC, "id" DESC);
CREATE INDEX "Post_authorId_createdAt_id_idx" ON "Post"("authorId", "createdAt" DESC, "id" DESC);
CREATE INDEX "Post_createdAt_id_idx" ON "Post"("createdAt" DESC, "id" DESC);
CREATE INDEX "Reply_postId_createdAt_id_idx" ON "Reply"("postId", "createdAt" DESC, "id" DESC);
CREATE INDEX "Reply_authorId_createdAt_id_idx" ON "Reply"("authorId", "createdAt" DESC, "id" DESC);
CREATE INDEX "Reply_createdAt_id_idx" ON "Reply"("createdAt" DESC, "id" DESC);

CREATE INDEX "Post_title_trgm_idx" ON "Post" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Post_body_trgm_idx" ON "Post" USING GIN ("body" gin_trgm_ops);
CREATE INDEX "Reply_body_trgm_idx" ON "Reply" USING GIN ("body" gin_trgm_ops);
CREATE INDEX "User_displayName_trgm_idx" ON "User" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX "Channel_name_trgm_idx" ON "Channel" USING GIN ("name" gin_trgm_ops);
