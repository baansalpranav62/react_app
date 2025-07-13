# Hotel Registration System

A modern, responsive web application for hotel guest registration with Firebase backend integration. This system allows guests to register online with personal information and document uploads, while providing an admin panel for managing registrations.

## Features

### Guest Registration
- **Personal Information**: Comprehensive form with name, email, phone, date of birth, etc.
- **Address Details**: Full address with city, state, country, and postal code
- **Document Upload**: Secure upload of identity documents (Aadhar, Passport, etc.)
- **Emergency Contact**: Emergency contact information
- **Purpose of Visit**: Business, leisure, conference, wedding, etc.
- **Special Requirements**: Additional notes and requirements

### Admin Panel
- **Authentication**: Secure login for administrators
- **Guest Management**: View, approve, reject, or delete guest registrations
- **Search & Filter**: Search by name, email, phone, or filter by status
- **Document Viewing**: View uploaded identity documents
- **Export Data**: Export guest data to CSV format
- **Real-time Updates**: Live updates of registration status

## Technology Stack

- **Frontend**: React 18 with React Hook Form
- **Backend**: Firebase (Firestore, Storage, Authentication)
- **Styling**: Custom CSS with modern design
- **Icons**: Lucide React icons
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM

## Firebase Setup Guide

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "hotel-registration")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Required Services

#### Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Email/Password" provider
3. Add your first admin user:
   - Go to "Authentication" > "Users"
   - Click "Add user"
   - Email: `admin@hotel.com`
   - Password: `admin123`
   - Click "Add user"

#### Firestore Database
1. Go to "Firestore Database" > "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location closest to your users
4. Click "Done"

#### Storage
1. Go to "Storage" > "Get started"
2. Choose "Start in test mode"
3. Select the same location as Firestore
4. Click "Done"

### Step 3: Configure Firebase Rules

#### Firestore Rules
Go to "Firestore Database" > "Rules" and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to guests collection
    match /guests/{document} {
      allow read, write: if true;
    }
    
    // For production, use more restrictive rules like:
    // match /guests/{document} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

#### Storage Rules
Go to "Storage" > "Rules" and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /identity_docs/{allPaths=**} {
      allow read, write: if true;
    }
    
    // For production, use more restrictive rules like:
    // match /identity_docs/{allPaths=**} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

### Step 4: Get Firebase Configuration

1. In Firebase Console, go to "Project Settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" > Web app icon
4. Enter app name and click "Register app"
5. Copy the Firebase configuration object

### Step 5: Configure Your App

1. Open `src/firebase.js`
2. Replace the configuration object with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Clone or download the project**
   ```bash
   cd hotel-registration-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase** (follow Firebase Setup Guide above)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`
   - Guest registration form will be available at the root URL
   - Admin panel at `http://localhost:3000/admin`

## Usage

### For Guests
1. Visit the registration form
2. Fill in personal information
3. Upload identity document (JPEG, PNG, or PDF, max 5MB)
4. Submit registration
5. Wait for admin approval

### For Administrators
1. Navigate to `/admin`
2. Login with admin credentials
3. View all guest registrations
4. Approve/reject registrations
5. View uploaded documents
6. Export data to CSV

## Deployment

### Firebase Hosting (Recommended)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `build`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Deploy**
   ```bash
   firebase deploy
   ```

### Other Hosting Options
- **Vercel**: Connect GitHub repo and deploy
- **Netlify**: Drag and drop build folder
- **Heroku**: Use buildpack for React apps

## Security Considerations

### For Production Use:

1. **Update Firebase Rules**
   - Restrict Firestore and Storage access to authenticated users only
   - Implement proper data validation

2. **Environment Variables**
   - Store Firebase config in environment variables
   - Use `.env` file for sensitive data

3. **Admin Authentication**
   - Change default admin credentials
   - Implement proper user management
   - Consider multi-factor authentication

4. **Data Validation**
   - Add server-side validation
   - Implement rate limiting
   - Add input sanitization

## Customization

### Adding New Fields
1. Update `GuestRegistration.js` form
2. Modify Firestore data structure
3. Update admin panel display

### Styling
- Modify `src/index.css` for global styles
- Update color scheme in CSS variables
- Add custom themes

### Features
- Email notifications
- PDF generation for registrations
- Room assignment
- Check-in/check-out system

## Support

For issues and questions:
1. Check Firebase console for errors
2. Review browser console for JavaScript errors
3. Verify Firebase configuration and rules
4. Test with fresh incognito window

## License

This project is provided as-is for educational and commercial use. Modify according to your needs.

---

**Note**: This is a basic implementation. For production use, implement proper security measures, data validation, and error handling according to your specific requirements. 