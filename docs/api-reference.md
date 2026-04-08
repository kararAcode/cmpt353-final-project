# API Reference

This document describes the server endpoints implemented under `src/app/api`.

## Base conventions

- Base path: `/api`
- Successful responses are wrapped as `{ "data": ... }`
- Error responses are wrapped as:

```json
{
  "error": {
    "message": "Human-readable error message"
  }
}
```

- Authentication is accepted from either:
  - `Authorization: Bearer <token>`
  - the `auth_token` cookie
- Auth tokens are JWTs that expire after 7 days

## Content types

- Most auth, vote, and admin endpoints expect `application/json`
- Post and reply creation endpoints expect `multipart/form-data`
- File uploads support only:
  - `image/png`
  - `image/jpeg`
  - `image/webp`
- Max attachment size: 5 MB per file

## Common status codes

- `200` OK
- `201` Created
- `400` Bad request
- `401` Missing or invalid authentication
- `403` Admin access required
- `404` Resource not found
- `409` Conflict
- `500` Internal server error

## Auth

### `POST /api/auth/signup`

Creates a new member account and sets the `auth_token` cookie.

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret123!"
}
```

Validation:

- `name` must be a non-empty string
- `email` must be a non-empty string
- `password` must be a non-empty string
- Email is normalized to lowercase

Response `200`:

```json
{
  "data": {
    "id": "cm123...",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "role": "member",
    "createdAt": "2026-04-07T18:00:00.000Z"
  }
}
```

Possible errors:

- `400` invalid or non-object JSON body
- `409` account with that email already exists

### `POST /api/auth/signin`

Signs in an existing user and sets the `auth_token` cookie.

Request body:

```json
{
  "email": "jane@example.com",
  "password": "Secret123!"
}
```

Response `200`:

```json
{
  "data": {
    "user": {
      "id": "cm123...",
      "email": "jane@example.com",
      "displayName": "Jane Doe",
      "role": "member"
    }
  }
}
```

Possible errors:

- `400` invalid JSON or missing required fields
- `401` invalid email or password

### `POST /api/auth/logout`

Clears the `auth_token` cookie.

Response `200`:

```json
{
  "data": {
    "success": true
  }
}
```

## Channels

### `GET /api/channels`

Returns all channels.

Response `200`:

```json
{
  "data": [
    {
      "id": "cm_channel_1",
      "name": "general",
      "description": "General discussion",
      "postCount": 12
    }
  ]
}
```

### `POST /api/channels`

Creates a channel. Authentication required.

Request body:

```json
{
  "name": "announcements"
}
```

Notes:

- Only `name` is currently required by the API
- `description` exists in the database model but is not set by this route

Response `201`:

```json
{
  "data": {
    "id": "cm_channel_2",
    "name": "announcements",
    "description": null,
    "createdById": "cm_user_1",
    "createdAt": "2026-04-07T18:00:00.000Z"
  }
}
```

Possible errors:

- `400` missing `name`
- `401` missing or invalid auth token

### `GET /api/channels/:channelId`

Returns one channel by id.

Response `200`:

```json
{
  "data": {
    "id": "cm_channel_1",
    "name": "general",
    "description": "General discussion",
    "createdAt": "2026-04-07T18:00:00.000Z",
    "createdBy": {
      "id": "cm_user_1",
      "displayName": "Admin"
    },
    "postCount": 12
  }
}
```

Possible errors:

- `404` channel not found

### `DELETE /api/channels/:channelId`

Deletes a channel and its related content. Admin auth required.

Response `200`:

```json
{
  "data": {
    "success": true,
    "deleted": {
      "type": "channel",
      "id": "cm_channel_1",
      "label": "general",
      "counts": {
        "channels": 1,
        "posts": 12,
        "replies": 34,
        "votes": 56,
        "attachments": 7,
        "users": 0
      }
    }
  }
}
```

Possible errors:

- `401` missing or invalid auth token
- `403` admin access required
- `404` channel not found

## Posts

### `GET /api/channels/:channelId/posts`

Returns all posts in a channel ordered by newest first.

Authentication is optional. If a user is authenticated, `currentUserVote` is populated from their vote.

Response `200`:

```json
{
  "data": [
    {
      "id": "cm_post_1",
      "channelId": "cm_channel_1",
      "authorId": "cm_user_2",
      "title": "Welcome",
      "body": "Hello everyone",
      "createdAt": "2026-04-07T18:00:00.000Z",
      "author": {
        "id": "cm_user_2",
        "displayName": "Jane Doe"
      },
      "currentUserVote": 1,
      "attachments": [
        {
          "id": "cm_attachment_1",
          "targetType": "post",
          "targetId": "cm_post_1",
          "mimeType": "image/png",
          "sizeBytes": 12345,
          "path": "https://example.com/uploads/file.png"
        }
      ],
      "topLevelReplyCount": 3,
      "voteSummary": {
        "upvotes": 10,
        "downvotes": 2,
        "score": 8
      }
    }
  ]
}
```

### `POST /api/channels/:channelId/posts`

Creates a post in a channel. Authentication required.

Content type: `multipart/form-data`

Fields:

- `title`: string, required
- `body`: string, required
- `attachments`: file, optional, repeatable

Response `201`:

```json
{
  "data": {
    "post": {
      "id": "cm_post_2",
      "channelId": "cm_channel_1",
      "authorId": "cm_user_2",
      "title": "Release notes",
      "body": "New update shipped",
      "createdAt": "2026-04-07T18:00:00.000Z"
    },
    "attachments": [
      {
        "id": "cm_attachment_2",
        "targetType": "post",
        "targetId": "cm_post_2",
        "mimeType": "image/webp",
        "sizeBytes": 45678,
        "path": "https://example.com/uploads/file.webp"
      }
    ]
  }
}
```

Possible errors:

- `400` missing `title` or `body`
- `400` attachment is not a file
- `400` unsupported attachment type or size
- `401` missing or invalid auth token
- `404` channel not found
- `500` attachment storage not configured

### `GET /api/posts/:postId`

Returns a post plus its full nested reply tree.

Authentication is optional. If a user is authenticated, `currentUserVote` values are included for the post and replies.

Response `200`:

```json
{
  "data": {
    "post": {
      "id": "cm_post_1",
      "channelId": "cm_channel_1",
      "title": "Welcome",
      "body": "Hello everyone",
      "createdAt": "2026-04-07T18:00:00.000Z",
      "currentUserVote": 1,
      "author": {
        "id": "cm_user_2",
        "displayName": "Jane Doe"
      },
      "attachments": [
        {
          "id": "cm_attachment_1",
          "path": "https://example.com/uploads/file.png",
          "mimeType": "image/png",
          "sizeBytes": 12345
        }
      ],
      "voteSummary": {
        "upvotes": 10,
        "downvotes": 2,
        "score": 8
      },
      "topLevelReplyCount": 2
    },
    "replies": [
      {
        "id": "cm_reply_1",
        "postId": "cm_post_1",
        "parentReplyId": null,
        "body": "Nice post",
        "createdAt": "2026-04-07T18:05:00.000Z",
        "currentUserVote": null,
        "author": {
          "id": "cm_user_3",
          "displayName": "John Smith"
        },
        "attachments": [],
        "voteSummary": {
          "upvotes": 1,
          "downvotes": 0,
          "score": 1
        },
        "replies": []
      }
    ]
  }
}
```

Possible errors:

- `404` post not found

### `DELETE /api/posts/:postId`

Deletes a post and all replies beneath it. Admin auth required.

Response `200`:

```json
{
  "data": {
    "success": true,
    "deleted": {
      "type": "post",
      "id": "cm_post_1",
      "label": "Welcome",
      "counts": {
        "channels": 0,
        "posts": 1,
        "replies": 5,
        "votes": 12,
        "attachments": 3,
        "users": 0
      }
    }
  }
}
```

## Replies

### `POST /api/posts/:postId/replies`

Creates a top-level reply for a post. Authentication required.

Content type: `multipart/form-data`

Fields:

- `body`: string, required
- `attachments`: file, optional, repeatable

Response `201`:

```json
{
  "data": {
    "reply": {
      "id": "cm_reply_1",
      "postId": "cm_post_1",
      "parentReplyId": null,
      "authorId": "cm_user_2",
      "body": "Thanks for sharing",
      "createdAt": "2026-04-07T18:10:00.000Z"
    },
    "attachments": []
  }
}
```

Possible errors:

- `400` missing `body`
- `400` invalid attachment
- `401` missing or invalid auth token
- `404` post not found

### `POST /api/replies/:replyId/replies`

Creates a nested reply under an existing reply. Authentication required.

Content type: `multipart/form-data`

Fields:

- `body`: string, required
- `attachments`: file, optional, repeatable

Response `201`:

```json
{
  "data": {
    "reply": {
      "id": "cm_reply_2",
      "postId": "cm_post_1",
      "parentReplyId": "cm_reply_1",
      "authorId": "cm_user_4",
      "body": "I agree",
      "createdAt": "2026-04-07T18:12:00.000Z"
    },
    "attachments": []
  }
}
```

Possible errors:

- `400` missing `body`
- `400` invalid attachment
- `401` missing or invalid auth token
- `404` reply not found

### `DELETE /api/replies/:replyId`

Deletes a reply and all descendant replies. Admin auth required.

Response `200`:

```json
{
  "data": {
    "success": true,
    "deleted": {
      "type": "reply",
      "id": "cm_reply_1",
      "label": "Thanks for sharing",
      "counts": {
        "channels": 0,
        "posts": 0,
        "replies": 3,
        "votes": 4,
        "attachments": 1,
        "users": 0
      }
    }
  }
}
```

## Voting

### `POST /api/posts/:postId/vote`

Creates, updates, or removes the authenticated user's vote on a post.

Request body:

```json
{
  "value": 1
}
```

Behavior:

- `1` or any positive number counts as an upvote
- `-1` or any negative number counts as a downvote
- `0` removes the current user's vote
- The route checks only that `value` is present; it does not currently restrict values to `-1`, `0`, or `1`

Response `200`:

```json
{
  "data": {
    "targetId": "cm_post_1",
    "targetType": "post",
    "currentUserVote": 1,
    "voteSummary": {
      "upvotes": 10,
      "downvotes": 2,
      "score": 8
    }
  }
}
```

Possible errors:

- `400` missing `value`
- `401` missing or invalid auth token
- `404` post not found

### `POST /api/replies/:replyId/vote`

Same behavior as post voting, but for a reply.

Request body:

```json
{
  "value": -1
}
```

Response `200`:

```json
{
  "data": {
    "targetId": "cm_reply_1",
    "targetType": "reply",
    "currentUserVote": -1,
    "voteSummary": {
      "upvotes": 3,
      "downvotes": 1,
      "score": 2
    }
  }
}
```

## Search

### `GET /api/search`

Searches across posts and replies.

Query parameters:

- `query`: optional text query
- `author`: optional author display name filter
- `channelId`: optional channel id filter
- `cursor`: optional pagination cursor returned by a previous request
- `limit`: optional page size

Notes:

- Default `limit` is `12`
- Max `limit` is `30`
- Results are ordered by `createdAt DESC`, then posts before replies at the same timestamp

Example:

```http
GET /api/search?query=update&author=Jane&channelId=cm_channel_1&limit=10
```

Response `200`:

```json
{
  "data": {
    "items": [
      {
        "id": "cm_post_2",
        "itemType": "post",
        "createdAt": "2026-04-07T18:00:00.000Z",
        "channel": {
          "id": "cm_channel_1",
          "name": "general"
        },
        "author": {
          "id": "cm_user_2",
          "displayName": "Jane Doe"
        },
        "post": {
          "id": "cm_post_2",
          "title": "Release notes"
        },
        "excerpt": "New update shipped...",
        "context": "Post in #general",
        "href": "/channels/cm_channel_1?postId=cm_post_2#post-cm_post_2"
      }
    ],
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA0LTA3VDE4OjAwOjAwLjAwMFoiLC4uLn0",
    "summary": {
      "mostPosts": {
        "userId": "cm_user_2",
        "displayName": "Jane Doe",
        "postCount": 8
      },
      "leastPosts": {
        "userId": "cm_user_5",
        "displayName": "Alex",
        "postCount": 1
      }
    }
  }
}
```

Possible errors:

- `400` invalid cursor

## Admin users

All admin endpoints require an authenticated admin user.

### `GET /api/admin/users`

Returns a list of users plus aggregate contribution counts.

Response `200`:

```json
{
  "data": [
    {
      "id": "cm_user_1",
      "email": "admin@example.com",
      "displayName": "Admin",
      "role": "admin",
      "createdAt": "2026-04-07T18:00:00.000Z",
      "counts": {
        "channels": 2,
        "posts": 5,
        "replies": 8
      }
    }
  ]
}
```

Possible errors:

- `401` missing or invalid auth token
- `403` admin access required

### `DELETE /api/admin/users/:userId`

Deletes a user and all related owned content. Admins cannot delete themselves.

Response `200`:

```json
{
  "data": {
    "success": true,
    "deleted": {
      "type": "user",
      "id": "cm_user_2",
      "label": "Jane Doe",
      "email": "jane@example.com",
      "counts": {
        "channels": 1,
        "posts": 4,
        "replies": 6,
        "votes": 9,
        "attachments": 2,
        "users": 1
      }
    }
  }
}
```

Possible errors:

- `400` admin attempted to delete own account
- `401` missing or invalid auth token
- `403` admin access required
- `404` user not found

## Attachment model

Attachment records returned by the API generally look like:

```json
{
  "id": "cm_attachment_1",
  "targetType": "post",
  "targetId": "cm_post_1",
  "mimeType": "image/png",
  "sizeBytes": 12345,
  "path": "https://example.com/uploads/file.png"
}
```

In `GET /api/posts/:postId`, attachments are returned in a reduced form without `targetType` and `targetId`.

## Notes on implementation details

- Most creation and lookup ids are Prisma `cuid()` strings
- `createdAt` values are serialized as ISO timestamps
- Signup and signin both set the auth cookie with:
  - `HttpOnly`
  - `SameSite=Lax`
  - `Path=/`
  - `Max-Age=7 days`
- Logout clears that cookie by setting `Max-Age=0`
