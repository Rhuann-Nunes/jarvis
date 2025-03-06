# JARVIS - Your Personal AI Assistant

JARVIS is a Progressive Web App (PWA) inspired by Iron Man's AI assistant. It helps you manage tasks, projects, and reminders with natural language processing powered by OpenAI.

## Features

- **AI-Powered Task Analysis**: Enter tasks in natural language and JARVIS will extract dates, times, and recurrence patterns.
- **Project Management**: Organize tasks into projects and sections.
- **Smart Notifications**: Get reminders for your tasks at the right time.
- **Voice Input**: Add tasks using your voice.
- **PWA Support**: Install JARVIS on your device for offline access.
- **Dark Mode**: Toggle between light and dark themes.
- **Supabase Integration**: Cloud storage and synchronization across devices.
- **User Authentication**: Secure login via Google OAuth.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- OpenAI API key
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/jarvis.git
   cd jarvis
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your API keys:
   ```
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_JWT_SECRET=your_supabase_jwt_secret
   
   # NextAuth configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   
   # Google OAuth credentials (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Set up the database in Supabase:
   - Log in to your Supabase dashboard
   - Navigate to the SQL Editor
   - Execute the SQL files in the `src/tables` directory in the following order:
     1. `nextauth.sql` - Sets up the NextAuth schema
     2. `users.sql` - Adds additional functionality to users table
     3. `projects.sql` - Creates the projects table
     4. `sections.sql` - Creates the sections table
     5. `tasks.sql` - Creates the tasks table
   
   Alternatively, you can execute `src/tables/create-all.sql` which will run all scripts in sequence.

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Tasks

Type your task in the input field at the top of the page. You can include:
- Dates and times: "Meeting tomorrow at 3pm"
- Recurrence: "Pay rent on the 1st of every month"
- Project tags: "Design homepage #Website"
- Section tags: "Update API documentation #Website /Backend"

### Managing Projects

Click the "+" button in the Projects section to create a new project. Each project can have multiple sections to further organize your tasks.

### Task Actions

- Click the circle to mark a task as complete
- Click the pencil icon to edit a task
- Click the trash icon to delete a task

### Data Migration

If you previously used JARVIS with localStorage, you can migrate your data to Supabase:

1. Log in to your account
2. Go to Settings page
3. Click "Migrate to Supabase" button
4. Wait for the migration to complete

For more details, see [SUPABASE-MIGRATION.md](./SUPABASE-MIGRATION.md).

## Database Schema

JARVIS uses Supabase PostgreSQL with the following tables:

- **next_auth.users**: Stores user information and authentication data
- **public.projects**: Contains groups of related tasks
- **public.sections**: Subdivides projects into categories
- **public.tasks**: The main entity with support for recurrence, due dates, etc.

All tables have Row Level Security (RLS) policies to ensure users can only access their own data.

## Authentication

Authentication is handled by NextAuth.js with Supabase adapter:

- Google OAuth (default)
- Add more providers as needed in `src/lib/auth.ts`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Iron Man's JARVIS
- Built with Next.js, TypeScript, and Tailwind CSS
- Powered by OpenAI and Supabase
