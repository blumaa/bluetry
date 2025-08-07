# Bluetry Poetry Platform

A modern, interactive poetry platform built with Next.js and Firebase, featuring real-time engagement, rich text editing, and a responsive design.

## ✨ Features

### 📝 Poetry Management
- **Rich Text Editor**: Create and edit poems with TiptapEditor featuring formatting tools, text alignment, and typography options
- **Draft System**: Save poems as drafts and publish when ready
- **Pinning System**: Pin important poems to highlight them
- **SEO-Friendly URLs**: Automatic slug generation from poem titles

### 👤 User Experience
- **Anonymous Access**: Browse and like published poems without registration
- **Authentication**: Firebase Authentication for full features
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Theme**: Theme toggle with system preference detection

### 🚀 Interactive Features
- **Real-Time Likes**: Like/unlike system with optimistic UI updates
- **Hybrid Like Storage**: Firebase for authenticated users, localStorage for anonymous users
- **Sidebar Navigation**: Quick access to recent and pinned poems
- **Activity Dashboard**: Admin view of platform engagement and statistics
- **Email Subscriptions**: Newsletter signup system

### 🛠 Technical Features
- **Real-Time Data**: Firebase Firestore with live updates
- **Performance Optimized**: Client-side sorting to avoid composite indexes
- **Security Rules**: Comprehensive Firebase Security Rules for data protection
- **Type Safety**: Full TypeScript implementation
- **Testing**: Jest configuration for unit testing

## 🏗 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Mond Design System
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Rich Text**: TiptapEditor
- **Animations**: Framer Motion
- **State Management**: React Context API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bluetry
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database and Authentication
   - Copy your Firebase config

4. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Deploy Firebase Security Rules**
   - Copy the contents of `firestore.rules`
   - Go to Firebase Console → Firestore Database → Rules
   - Paste the rules and publish

6. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📊 Firebase Setup

### Collections Structure
```
├── poems/              # Poetry content
│   ├── id: string
│   ├── title: string
│   ├── content: string
│   ├── authorId: string
│   ├── published: boolean
│   ├── pinned: boolean
│   ├── likeCount: number
│   ├── commentCount: number
│   └── createdAt: timestamp
│
├── users/              # User profiles
│   ├── id: string (Firebase UID)
│   ├── email: string
│   ├── displayName: string
│   ├── isAdmin: boolean
│   └── createdAt: timestamp
│
├── likes/              # Like tracking
│   ├── userId: string
│   ├── poemId: string
│   └── createdAt: timestamp
│
├── activity/           # Platform activity logs
│   ├── type: string
│   ├── userId: string
│   ├── poemId?: string
│   ├── metadata?: object
│   └── timestamp: timestamp
│
└── subscribers/        # Email subscriptions
    ├── email: string
    └── createdAt: timestamp
```

### Required Indexes
The following Firebase indexes may be required for optimal performance:
- Collection: `poems` | Fields: `published` (Ascending), `createdAt` (Descending)
- Collection: `activity` | Fields: `timestamp` (Descending)

## 🎨 Design System

The project uses the Mond Design System for consistent UI components:
- Buttons with variant support (primary, secondary, ghost, outline)
- Theme-aware components (dark/light mode)
- Responsive design utilities

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

## 🔧 Development Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 📱 Features Status

- ✅ **Poem Creation & Editing** - Rich text editor with formatting
- ✅ **Authentication** - Firebase Auth with anonymous access
- ✅ **Like System** - Real-time likes with hybrid storage
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Admin Dashboard** - Activity tracking and statistics
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **SEO Optimization** - Slug-based URLs and meta tags
- 🚧 **Comments System** - Prepared but temporarily disabled
- 🚧 **Search Functionality** - Planned feature
- 🚧 **Categories/Tags** - Planned feature

## 🛡 Security

- Comprehensive Firebase Security Rules
- Authentication-based access control
- Anonymous user access to published content only
- Admin-only access to sensitive operations
- Input validation and sanitization

## 📦 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or support, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and Firebase