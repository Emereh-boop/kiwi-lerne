# Kiwi Learn - Project Context & Documentation

## Project Overview
**Name**: Kiwi Learn (formerly Wren Learn)  
**Type**: Gamified Document Learning Platform  
**Inspiration**: Duolingo-style learning applied to document processing  
**Version**: 1.0.0  
**Framework**: React 18 + Vite + TailwindCSS  

## Core Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with JSX
- **Routing**: React Router DOM 6.8.0
- **Styling**: TailwindCSS 3.3.0 with custom Kiwi theme
- **State Management**: React Context API (Auth, User, Document contexts)
- **File Processing**: 
  - PDF: pdfjs-dist 3.11.174
  - DOCX: mammoth 1.6.0
- **UI Components**: Lucide React icons, Framer Motion animations
- **Notifications**: react-hot-toast
- **File Upload**: react-dropzone
- **Storage**: localForage + localStorage fallback
- **Backend (Optional)**: Supabase integration prepared

### Project Structure
```
kiwi-lerne/
├── src/
│   ├── components/
│   │   └── Navbar.jsx - Main navigation with user stats
│   ├── contexts/
│   │   ├── AuthContext.jsx - Authentication & user management
│   │   ├── UserContext.jsx - XP, achievements, preferences
│   │   └── DocumentContext.jsx - Document & lesson management
│   ├── lib/
│   │   ├── parser.js - PDF/DOCX text extraction
│   │   ├── storage.js - IndexedDB/localStorage abstraction
│   │   └── supabase.js - Optional Supabase backend
│   └── pages/
│       ├── Home.jsx - Landing page with features
│       ├── Auth.jsx - Login/registration
│       ├── Upload.jsx - Document upload & processing
│       ├── Lessons.jsx - Lesson listing & filtering
│       ├── Lesson.jsx - Individual lesson player
│       └── Profile.jsx - User stats & settings
```

## Implemented Features

### 1. Authentication System
- **Local authentication** with email/password (demo purposes)
- **Guest mode** with automatic guest user creation
- **User persistence** using localStorage
- **Private routes** protection
- **Registration & login** with validation

### 2. Document Processing
- **File upload** via drag-and-drop or click
- **Supported formats**: PDF, DOCX, plain text
- **Text extraction** using pdfjs-dist and mammoth
- **Content sanitization** and size limiting (50k chars)
- **Document storage** with metadata (name, size, upload date)

### 3. Lesson Generation
- **Automatic lesson creation** from uploaded documents
- **Lesson types**:
  - **Vocabulary**: Key terms extraction (12 words)
  - **Cloze**: Fill-in-the-blank exercises (8 items)
  - **Comprehension**: Multiple-choice questions (4 questions)
  - **Summary**: Document overview with key terms
- **Keyword extraction** using frequency analysis
- **Difficulty levels**: Easy, Medium, Hard
- **XP rewards** per lesson (40-120 XP)

### 4. Learning Modes
- **Gamified Mode**: Interactive exercises with scoring
- **Audiobook Mode**: Text-to-speech playback
- **TTS Features**:
  - Voice selection from available system voices
  - Adjustable speech rate and pitch
  - Paragraph-by-paragraph navigation
  - Playback controls (play/pause/stop)

### 5. Gamification System
- **XP (Experience Points)**: Earned by completing lessons
- **Levels**: Calculated based on XP (100 XP per level)
- **Streaks**: Daily activity tracking
- **Achievements**: 
  - First Steps (complete 1 lesson)
  - Knowledge Seeker (complete 5 lessons)
  - XP Master (earn 500 XP)
  - Streak Champion (7 day streak)
  - Perfect Score (100% on lesson)
  - Dedicated Learner (complete 10 lessons)

### 6. User Interface
- **Duolingo-inspired design** with Kiwi color scheme
- **Responsive layout** for mobile and desktop
- **Animations**: Float, bounce, wiggle effects
- **Progress indicators** and visual feedback
- **Toast notifications** for user actions
- **Custom components**: Buttons, cards, progress bars

### 7. Data Management
- **Local storage** with IndexedDB (localForage)
- **localStorage fallback** for compatibility
- **User data isolation** per account
- **Document and lesson persistence**
- **Settings persistence** (TTS preferences, learning style)

## Unimplemented Features & TODOs

### 1. Backend Integration
- **Supabase integration** partially prepared but not active
- **User data synchronization** across devices
- **Cloud document storage**
- **Real-time progress tracking**
- **Collaborative features**

### 2. Advanced Lesson Types
- **Flashcard system** with spaced repetition
- **Matching exercises** (term-definition pairs)
- **True/false questions**
- **Essay-style questions**
- **Interactive diagrams** and visual content
- **Video content integration**

### 3. Enhanced TTS Features
- **Voice recording** for pronunciation practice
- **Speech recognition** for speaking exercises
- **Multiple language support**
- **Audio quality settings**
- **Downloadable audio files**

### 4. Social Features
- **Leaderboards** for XP and achievements
- **Friend system** and sharing
- **Study groups** and collaboration
- **Progress sharing** on social media
- **Community challenges**

### 5. Analytics & Progress Tracking
- **Detailed learning analytics**
- **Performance metrics** and insights
- **Learning path recommendations**
- **Weakness identification**
- **Study time tracking**
- **Progress reports** (weekly/monthly)

### 6. Content Management
- **Document organization** (folders, tags)
- **Advanced search** within documents
- **Document versioning**
- **Batch processing** of multiple files
- **OCR integration** for image-based PDFs
- **Web page import** (URL to lesson)

### 7. Accessibility Improvements
- **Screen reader optimization**
- **Keyboard navigation** improvements
- **High contrast mode**
- **Font size adjustment**
- **Color blind friendly themes**
- **Language localization** (i18n)

### 8. Performance Optimizations
- **Code splitting** for faster loading
- **Service worker** for offline mode
- **Document caching** strategies
- **Lazy loading** for large content
- **Memory management** for large documents

### 9. Security Enhancements
- **Password hashing** (currently plaintext for demo)
- **Session management** improvements
- **Content sanitization** enhancements
- **Rate limiting** for uploads
- **Data encryption** for sensitive content

### 10. Monetization Features
- **Premium subscription** model
- **Advanced features** behind paywall
- **Cloud storage** limits
- **Offline mode** for premium users
- **Ad integration** for free tier

## Technical Debt & Improvements Needed

### Code Quality
- **Error boundaries** for better error handling
- **Unit tests** implementation
- **E2E testing** setup
- **Code documentation** improvements
- **TypeScript migration** consideration

### Performance
- **Bundle size optimization**
- **Image optimization** strategies
- **Caching strategy** implementation
- **Database query optimization** (when backend added)

### UX Enhancements
- **Loading states** improvement
- **Offline mode** indication
- **Better error messages**
- **Onboarding flow** for new users
- **Help system** and documentation

## Configuration & Deployment

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Build Configuration
- **Vite** as build tool
- **React plugin** for JSX transformation
- **Development server** on port 3000
- **Auto-open** browser on dev start

### Deployment Ready
- **Vercel configuration** included
- **Static site generation** compatible
- **Environment-specific** builds

## Future Roadmap

### Phase 1: Core Enhancement
1. Implement Supabase backend
2. Add flashcard system
3. Improve TTS features
4. Add basic analytics

### Phase 2: Social Features
1. User profiles enhancement
2. Leaderboards
3. Friend system
4. Sharing capabilities

### Phase 3: Advanced Learning
1. Spaced repetition algorithm
2. Personalized learning paths
3. Advanced lesson types
4. AI-powered content generation

### Phase 4: Scale & Monetization
1. Mobile app development
2. Premium features
3. Enterprise features
4. API for third-party integration

## Key Design Decisions

### Local-First Approach
- Prioritized offline functionality
- Fast response times
- Privacy-focused (data stays local)
- Easy deployment without backend

### Gamification Focus
- Duolingo-inspired proven engagement model
- Visual progress tracking
- Achievement system for motivation
- Streak maintenance for habit formation

### Document-Centric Learning
- Transform existing content into lessons
- Support for common document formats
- Automated lesson generation
- Progressive difficulty scaling

### Accessibility Considerations
- Multiple learning modes (visual, auditory)
- Responsive design for all devices
- Clear visual hierarchy
- Keyboard navigation support

## Dependencies Analysis

### Core Dependencies
- **React ecosystem**: Modern, component-based architecture
- **TailwindCSS**: Utility-first styling with custom theme
- **File processing**: Industry-standard libraries (pdfjs, mammoth)
- **Storage**: Robust local storage solution with fallbacks

### Optional Dependencies
- **Supabase**: Backend-as-a-Service for scalability
- **Framer Motion**: Enhanced animations and interactions
- **Lucide React**: Consistent icon system

### Development Dependencies
- **Vite**: Fast build tool and dev server
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing for Tailwind

This context file serves as a comprehensive guide for understanding the current state, capabilities, and future potential of the Kiwi Learn platform.
