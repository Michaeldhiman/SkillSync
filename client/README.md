# SkillSync Frontend

A React-based frontend for the SkillSync application that allows developers to connect, showcase their skills, and collaborate on projects.

## Features

### Profile Management
- **ProfileForm Component**: A comprehensive form for users to complete their profile
- **Profile Fields**:
  - Name (optional if already captured at signup)
  - Skills (multi-select with add/remove functionality)
  - Goals (multi-select with add/remove functionality)
  - Mode (dropdown: Online, Offline, Hybrid)
  - Availability (text input for scheduling preferences)
  - Profile Picture Upload (optional)

### User Experience
- **Profile Setup Flow**: New users are guided to complete their profile after signup
- **Profile Editing**: Existing users can edit their profile information
- **Responsive Design**: Modern UI with Tailwind CSS styling
- **Form Validation**: Client-side validation and error handling

## Components

### ProfileForm.jsx
The main profile form component that handles:
- User input for all profile fields
- Skills and goals management (add/remove)
- File upload for profile pictures
- Form submission to backend API
- Success/error message display

**Props:**
- `user`: Current user object
- `onProfileUpdate`: Callback function when profile is updated
- `isEditing`: Boolean to determine if in edit mode

**Usage:**
```jsx
import ProfileForm from '../components/ProfileForm';

<ProfileForm 
  user={currentUser} 
  onProfileUpdate={handleProfileUpdate}
  isEditing={true}
/>
```

## Pages

### Profile.jsx
Main profile page that displays user information and allows editing.

### ProfileSetup.jsx
Dedicated page for new users to complete their profile setup.

## API Integration

The ProfileForm component integrates with the backend API:
- **POST** `/api/users/profile/update` - Updates user profile
- **GET** `/api/users/profile` - Retrieves user profile data

## Styling

Built with Tailwind CSS featuring:
- Gradient backgrounds
- Modern card designs
- Responsive grid layouts
- Interactive hover effects
- Loading states and animations

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Navigate to `/profile-setup` to test the ProfileForm component

## File Structure

```
src/
├── components/
│   └── ProfileForm.jsx          # Main profile form component
├── pages/
│   ├── Profile.jsx              # Main profile page
│   └── ProfileSetup.jsx         # Profile setup page
└── App.jsx                      # Main app with routing
```

## Dependencies

- React 18+
- React Router DOM
- Tailwind CSS
- Modern JavaScript (ES6+)
