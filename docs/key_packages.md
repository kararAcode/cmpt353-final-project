# Key Packages + Why

## Next.js (App Router)
Provides a unified framework for both frontend and backend logic. It simplifies routing, API creation, and data fetching, while reducing the need for separate services.

## Prisma
Used as the ORM for database interaction. Prisma offers strong TypeScript support, which improves type safety and reduces runtime errors. It also provides a clear schema definition and built-in migration tools, making it easier to manage database changes over time. Compared to writing raw SQL, Prisma improves readability and developer productivity.

## Tailwind CSS
Used for styling the UI. Tailwind allows styles to be applied directly within components using utility classes, avoiding the need for separate CSS files. It provides a large set of predefined classes while still allowing customization, making it both flexible and efficient for building consistent layouts.

## shadcn/ui
Provides pre-built, accessible UI components that integrate well with Tailwind. This reduces the need to build common UI elements from scratch and helps maintain a consistent design across the application.

## Authentication (JWT + bcrypt)
JWTs stored in httpOnly cookies are used for session management, while bcrypt is used for securely hashing passwords. A custom AuthProvider with a useAuth() hook centralizes user state on the frontend, making it easy to access authentication status and user data across components. This simplifies conditional rendering and enforcement of authenticated actions.

Overall, these packages were selected primarily for their developer experience, strong integration with TypeScript, and ability to reduce boilerplate while maintaining flexibility.
