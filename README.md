# Sawaal - Quiz Application

A comprehensive quiz application built with React Native and Expo, featuring quiz creation, classroom management, AI-powered question generation, and user progress tracking.

## Features

- **Quiz Management**: Create, edit, delete, and take quizzes
- **AI Quiz Generation**: Generate quiz questions from PDF and text documents using OpenAI
- **Classroom System**: Tutors can create classrooms and assign quizzes to students
- **User Profiles**: Track quiz attempts, points, and rankings
- **Bookmarks & Search**: Save favorite quizzes and search with filters
- **Authentication**: Secure user authentication with role-based access (Student/Tutor)

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **State Management**: React Query (@tanstack/react-query), Context API
- **Styling**: React Native StyleSheet with LinearGradient
- **AI**: OpenAI API (GPT-4o-mini) for quiz generation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Will be installed with dependencies
- **iOS Simulator** (Mac only) or **Android Emulator** or **Expo Go app** on your phone

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Sawaal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your credentials:

   **Required - Supabase Configuration:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or select your existing project
   - Go to Project Settings → API
   - Copy the `Project URL` and paste it as `EXPO_PUBLIC_SUPABASE_URL`
   - Copy the `anon/public` key and paste it as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

   **Optional - OpenAI Configuration:**
   - Only needed if you want to use AI quiz generation from documents
   - Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy and paste it as `EXPO_PUBLIC_OPENAI_API_KEY`

   Your `.env` file should look like:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc.......
   EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-....... # Optional
   ```

### 4. Set Up Supabase Database

> **⚠️ IMPORTANT: Free Tier Supabase databases automatically pause after 7 days of inactivity!**
> Your database will stop working if you don't access it for 7 days. To reactivate:
> 1. Go to your [Supabase Dashboard](https://app.supabase.com)
> 2. Click "Restore" or "Resume" on your paused project
> 3. Wait a few minutes for the database to restart
>
> **To prevent this**: Either use your app regularly or upgrade to a paid plan.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the database schema SQL (if provided separately) to create all necessary tables:
   - `users`
   - `quizzes`
   - `questions`
   - `quiz_categories`
   - `quiz_difficulty`
   - `quiz_attempts`
   - `classroom`
   - `classroom_students`
   - `saved_quizzes`
   - `votes`
   - `comments`

### 5. Start the Development Server

```bash
npm start
```

This will start the Expo development server and show you a QR code.

## Running the App

You have several options to run the app:

### Option 1: Expo Go (Quickest - Recommended for Testing)

1. Install the **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from the terminal with:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app

### Option 2: iOS Simulator (Mac only)

```bash
npm run ios
```

Make sure you have Xcode installed with iOS Simulator.

### Option 3: Android Emulator

```bash
npm run android
```

Make sure you have Android Studio installed with an Android Virtual Device (AVD) set up.

### Option 4: Web Browser

```bash
npm run web
```

Note: Some native features may not work on web (e.g., file picking, secure storage).

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint to check code quality
- `npm run reset-project` - Reset the project to a fresh state

## Project Structure

```
Sawaal/
├── app/                      # Main application screens (Expo Router)
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/              # Main tab navigation screens
│   │   ├── index.tsx        # Home/Discover
│   │   ├── quiz.tsx         # Create/Edit Quiz
│   │   ├── library.tsx      # User's quizzes
│   │   └── profile.tsx      # User profile
│   ├── classroom/           # Classroom management (Tutor)
│   ├── student/             # Student classroom views
│   ├── quiz/                # Quiz taking screens
│   ├── modals/              # Modal dialogs
│   └── _layout.tsx          # Root layout with navigation guards
├── components/              # Reusable components
├── contexts/                # React Context providers
│   ├── AuthContexts.tsx
│   ├── BookmarkContext.tsx
│   └── SearchContext.tsx
├── services/                # API service layer
│   ├── quiz.ts
│   ├── classroom.ts
│   ├── user.ts
│   └── ai.ts
├── models/                  # TypeScript type definitions
│   ├── quiz.ts
│   ├── classroom.ts
│   └── user.ts
├── initSupabase.ts          # Supabase client configuration
├── .env                     # Environment variables (not committed)
└── .env.example             # Environment variables template

```

## Key Features Usage

### User Roles

The app supports two user roles:
- **Student**: Can take quizzes, join classrooms, track progress
- **Tutor**: Can create quizzes, manage classrooms, assign quizzes to students

### Creating a Quiz

1. Navigate to the Quiz tab
2. Fill in quiz details (title, description, category, difficulty)
3. Add questions manually or use AI generation (if OpenAI key is configured)
4. Save the quiz

### Classroom Management (Tutors Only)

1. Navigate to "My Classrooms"
2. Create a new classroom with a join code
3. Assign quizzes to the classroom
4. Share the join code with students

### Joining a Classroom (Students)

1. Navigate to "My Classrooms"
2. Enter the join code provided by your tutor
3. Access and take assigned quizzes

## Troubleshooting

### Common Issues

1. **"Network error" or "Failed to fetch"**
   - Check that your `.env` file is configured correctly
   - Ensure your Supabase project is active
   - Verify your internet connection

2. **"OpenAI API key not configured"**
   - This only affects AI quiz generation
   - Add `EXPO_PUBLIC_OPENAI_API_KEY` to your `.env` file if you want this feature
   - You can still create quizzes manually without it

3. **"Module not found" errors**
   - Run `npm install` again
   - Clear the Metro bundler cache: `npx expo start -c`

4. **App crashes on startup**
   - Check that all environment variables are set correctly
   - Ensure Supabase database tables are created
   - Check the terminal for error messages

### Clearing Cache

If you encounter persistent issues:

```bash
# Clear Expo cache
npx expo start -c

# Clear npm cache
npm cache clean --force
rm -rf node_modules
npm install
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public key |
| `EXPO_PUBLIC_OPENAI_API_KEY` | No | OpenAI API key for AI quiz generation |

## Security Notes

- Never commit your `.env` file to version control
- Keep your Supabase anon key and OpenAI API key secure
- Row Level Security (RLS) policies should be enabled in Supabase for production
- Use Supabase service role key only in secure server environments

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your License Here]

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
