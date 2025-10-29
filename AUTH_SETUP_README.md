# Mock Authentication Setup - Quick Start Guide

## 🚀 Overview
Your Quirk Trade Tool now has a mock login system with test users for development and testing!

## 📋 Test User Credentials

### 1. **Admin User** (Full Access)
- **Email:** `admin@quirk.com`
- **Password:** `admin123`
- **Role:** Admin
- **Access:** All dealerships, can manage users, full admin dashboard access

### 2. **General Manager** (Multi-Store Access)
- **Email:** `gm@quirk.com`
- **Password:** `gm123`
- **Role:** General Manager
- **Access:** Multiple dealerships, limited admin access

### 3. **Sales Manager** (Single Store)
- **Email:** `sales@quirk.com`
- **Password:** `sales123`
- **Role:** General Sales Manager
- **Access:** Single dealership only, no admin access

## 🔗 Access URLs

- **Trade Tool Home:** `https://mpalmer79.github.io/quirk-trade-tool/`
- **Login Page:** `https://mpalmer79.github.io/quirk-trade-tool/login/`
- **Admin Dashboard:** `https://mpalmer79.github.io/quirk-trade-tool/admin/`
- **User Management:** `https://mpalmer79.github.io/quirk-trade-tool/users/`

## 📱 How to Use

### Method 1: Quick Login (Fastest)
1. Go to `/login`
2. Click on any of the "Quick Test Login" buttons
3. Automatically logged in and redirected to admin dashboard

### Method 2: Manual Login
1. Go to `/login`
2. Enter email and password from the list above
3. Click "Sign In"
4. Redirected to admin dashboard

## 🔒 Security Features

- ✅ Protected admin routes - only accessible when logged in
- ✅ Permission-based access control
- ✅ Automatic redirect to login for unauthorized access
- ✅ Logout functionality
- ✅ Session persistence (localStorage)

## 🎨 What You Can Test

### As Admin User:
- ✅ View admin dashboard with stats
- ✅ See all 17 dealerships
- ✅ Access user management page
- ✅ Navigate between admin pages
- ✅ Logout functionality

### As General Manager:
- ✅ View admin dashboard (if has MANAGE_USERS permission)
- ✅ See assigned dealerships only
- ❌ Cannot access user management (depends on permissions)

### As Sales Manager:
- ❌ Cannot access admin panel (no MANAGE_USERS permission)
- ✅ Would see "Access Denied" message
- ✅ Can use trade tool normally

## 🔄 Logout

Click the "Logout" button in the navigation bar to:
- Clear session
- Redirect to login page

## 🛠️ Files Modified/Added

1. **NEW:** `/frontend/app/login/page.tsx` - Login page with test users
2. **UPDATED:** `/frontend/components/AdminNav.tsx` - Auto-redirect to login
3. **UPDATED:** `/frontend/app/admin/page.tsx` - Auth check
4. **UPDATED:** `/frontend/app/page.tsx` - Added "Admin Login" button

## 🔮 Future Improvements

This is a mock system for testing. For production, you'll want to:
- Real authentication API
- Secure password hashing
- JWT tokens
- Session management
- Password reset functionality
- Two-factor authentication
- Audit logging

## 💡 Notes

- User data is stored in localStorage (client-side only)
- Refreshing the page maintains your session
- Closing the browser may clear the session (depends on browser settings)
- This is NOT secure for production - it's for testing only!

---

**Ready to test!** Go to `/login` and click one of the Quick Test Login buttons! 🎉
