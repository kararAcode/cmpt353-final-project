# Screenshot Storage Approach

Screenshots (attachments) are stored on the filesystem rather than in the database. This decision was made to avoid storing large binary data directly in the database, which is better suited for structured, text-based data. Instead, the database stores metadata about each file (such as type, size, and path), while the actual file contents are stored separately.

The system is containerized using Docker, and file storage is handled through a mounted volume. A directory inside the container (configured via environment variables) is mapped to a directory on the host machine. This ensures that uploaded files persist even if the container is rebuilt or restarted.

Uploads are handled as part of the post and reply creation flow using multipart form data. This allows both text content and files to be submitted in a single request. On the server side, files are validated (e.g., MIME type and size limits), written to disk, and then linked to their corresponding post or reply through attachment records in the database.

This approach keeps the system simple, avoids unnecessary database load, and aligns well with Docker-based deployment.
