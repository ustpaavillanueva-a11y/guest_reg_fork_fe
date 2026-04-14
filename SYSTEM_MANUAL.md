# Kekehyu Guest Registration System - User Manual

**Version:** 1.0.0  
**Date:** April 13, 2026  
**System:** Kekehyu Business Hotel Guest Registration & Management

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles & Access](#user-roles--access)
3. [Getting Started](#getting-started)
4. [Features & How to Use](#features--how-to-use)
5. [Dashboard](#dashboard)
6. [Guest Registration](#guest-registration)
7. [Admin Features](#admin-features)
8. [Super Admin Features](#super-admin-features)
9. [PDF & Reports](#pdf--reports)
10. [Mobile App Installation](#mobile-app-installation)
11. [Troubleshooting](#troubleshooting)
12. [Technical Details](#technical-details)

---

## System Overview

The **Kekehyu Guest Registration System** is a comprehensive web-based platform for managing guest registrations and hotel operations. The system provides:

- 📋 **Guest Registration** - Quick multi-step guest check-in process
- 📊 **Analytics & Reports** - Monthly guest comparison, statistics, and trends
- 📑 **PDF Generation** - Auto-generate guest registration documents
- 📱 **PWA Support** - Install as mobile app for offline access
- 🔐 **Role-Based Access** - Admin, Super Admin, and Front Desk roles
- ☁️ **Cloud Deployment** - Hosted on Vercel (Frontend) & Render (Backend)

**System URL:** https://kekehyuguestregistration-59w34qijr.vercel.app

---

## User Roles & Access

### 1. **Front Desk** - Guest Registration
- Register new guests
- View their own registrations
- Update guest information
- Generate and view PDF registrations

### 2. **Admin** - Dashboard & Reports
- View overall dashboard statistics
- See monthly guest comparison chart
- Access guest list and recent registrations
- Generate guest registration PDFs
- View all guest data and registrations

### 3. **Super Admin** - Full System Control
- All Admin features
- User management (create, edit, delete users)
- Hotel settings configuration
- Room types management
- Hotel policies management
- System-wide analytics and reports

---

## Getting Started

### Login Process

1. **Open the app** in your browser: https://kekehyuguestregistration-59w34qijr.vercel.app
2. **Enter credentials:**
   - Email: Your registered email
   - Password: Your password
3. **Click "Login"**
4. **Select your role** if prompted (Admin, Super Admin, or Front Desk)
5. **You're logged in!** 🎉

### First Login Troubleshooting

If login fails:
- Check your internet connection
- Verify email and password are correct
- Clear browser cache (Ctrl+Shift+Delete)
- Try in a different browser
- Contact system administrator

---

## Features & How to Use

### 1. Dashboard

**For Admin/Super Admin:**

The Dashboard shows:

#### Statistics Cards
- **Today** - Guest registrations today
- **This Week** - Total registrations this week
- **This Month** - Total registrations this month
- **This Year** - Total registrations this year

#### Monthly Guest Comparison Chart
- **Green bars** = Current year (2026) registrations
- **Orange bars** = Last year (2025) registrations
- **Hover** over bars to see exact numbers
- Shows which months had most guests

#### Recent Registrations Table
- Latest guest registrations
- Guest name, phone, country, who registered them, date
- **View PDF** button - Click to see guest registration PDF

---

### 2. Guest Registration (Front Desk)

#### Step 1: Personal Information
1. Click **"Register Guest"** from navigation menu
2. Fill in:
   - First Name *
   - Last Name *
   - Email *
   - Phone Number *
   - Country *
3. Click **"Next"**

#### Step 2: Reservation Details
1. Select:
   - Room Type *
   - Check-in Date *
   - Check-out Date *
   - Number of Accompanying Guests
2. If accompanying guests:
   - Add first name, last name for each guest
3. Click **"Next"**

#### Step 3: Agreement & Signature
1. Read hotel policies/agreements
2. Check **"I agree to the terms"** ✓
3. **Sign** in the signature pad (touch/mouse)
4. Click **"Clear"** if you need to sign again
5. Click **"Complete Registration"**

#### Step 4: Success
- Registration PDF auto-generates
- PDF auto-uploads to cloud storage
- You can **view the PDF** or continue

#### View Your Registrations
1. Go to **"My Registrations"** menu
2. See all registrations you created
3. Click **"View PDF"** button to see registration document
4. PDF shows:
   - Guest information
   - Reservation details
   - Signature proof
   - Hotel header with logo

---

### 3. Admin Features

#### Dashboard (Statistics & Analytics)

**Access:** Menu → Dashboard

See at a glance:
- Guest registrations by time period
- Monthly comparison chart (current year vs last year)
- Recent guest registrations list

**Monthly Comparison Chart:**
- X-axis: Months (Jan-Dec)
- Y-axis: Number of guests
- Filter: This year (green) vs last year (orange)
- **Purpose:** Track seasonal trends and compare growth

#### Guest List

**Access:** Menu → Guest List

Features:
- View all registered guests
- Search and filter guests
- Sort by name, date, country, etc.
- Click **"View PDF"** button to see guest registration
- Loads full guest data before showing PDF

#### Recent Registrations

**Access:** Dashboard table or Menu → Recent Registrations

Shows:
- Most recent guest registrations
- Last 10-15 registrations
- Quick access to guest PDFs
- Registered by information (which staff member)

---

### 4. Super Admin Features

#### User Management

**Access:** Menu → User Management

**Create New User:**
1. Click **"Add User"** button
2. Enter:
   - First Name
   - Last Name
   - Email
   - Password
   - Role (Admin, Front Desk, Super Admin)
3. Click **"Create"**

**Edit User:**
1. Click user row
2. Edit fields
3. Click **"Save"**

**Delete User:**
1. Click user row
2. Click **"Delete"** button
3. Confirm deletion

#### Hotel Settings

**Access:** Menu → Settings

Configure:
- Hotel name
- Address
- Phone number
- Email
- Check-in/out times
- Currency
- Policies text

**Save changes** after editing.

#### Room Types

**Access:** Menu → Room Types

**Add Room Type:**
1. Click **"Add Room Type"**
2. Enter:
   - Room type name (e.g., "Deluxe Suite")
   - Base price
   - Max occupancy
   - Description
3. Click **"Save"**

**Edit/Delete:** Select room type and click respective button

#### Hotel Policies

**Access:** Menu → Policies

**Edit Hotel Policies:**
1. Edit policy text
2. Click **"Save"**
3. Policies appear in guest registration agreement

---

## Dashboard

### Statistics Overview

| Stat | Meaning |
|------|---------|
| Today | Guests registered in the last 24 hours |
| This Week | Guests registered in the last 7 days |
| This Month | Guests registered in the current month |
| This Year | Guests registered in the current year |

### Monthly Chart

Shows guest registration trends:
- **Current Year (Green):** 2026 registrations
- **Previous Year (Orange):** 2025 registrations
- **Compare growth** month by month
- **Identify patterns:** Peak seasons, slow periods

**Example use case:**
If March has 35 guests in 2026 vs 20 in 2025, you know there was 75% growth!

---

## Guest Registration

### Multi-Step Process

**3 Simple Steps:**

1. ✍️ **Personal Info** - Get guest details
2. 📅 **Reservation** - Room & dates
3. ✋ **Signature** - Digital signature & agreement

### PDF Generation

**Automatic Process:**
1. When you complete registration → PDF auto-generates
2. PDF uploads to cloud (Supabase)
3. You can view/download immediately
4. Stored securely for future access

**PDF Contains:**
- Hotel header with logo
- Guest information (name, email, phone, country)
- Reservation details (room, dates, companions)
- Guest signature
- Registration date & time

---

## PDF & Reports

### View Guest Registration PDF

1. Go to **"Guest List"** or **"Recent Registrations"**
2. Find guest in table
3. Click **"View PDF"** button with eye icon
4. PDF opens in modal window
5. Download or print using browser controls

### PDF Modal Features

- **Full screen view** (95% viewport width)
- **Zoom** - Use browser zoom (Ctrl + / Ctrl -)
- **Print** - Click print icon or Ctrl+P
- **Download** - Browser download option
- **Close** - Click X or outside modal

### PDF Contents

Each PDF includes:

```
┌─────────────────────────────────┐
│       KEKEHYU HOTEL LOGO         │
│    GUEST REGISTRATION FORM       │
└─────────────────────────────────┘

Guest Information:
  Name: John Doe
  Email: john@example.com
  Phone: +63 912 345 6789
  Country: Philippines

Reservation Details:
  Room Type: Deluxe Suite
  Check-in: April 15, 2026
  Check-out: April 17, 2026
  Companions: 2 guests

[SIGNATURE AREA]

Registration Date: April 13, 2026, 3:45 PM
```

---

## Mobile App Installation

### Install as App on Your Phone

The system supports PWA (Progressive Web App) installation.

#### On Android

1. Open the app in Chrome
2. Look for **"Install App"** button in top right (or notification)
3. Tap **"Install"**
4. App appears on home screen
5. Open anytime, even without internet!

#### On iPhone/iPad

1. Open the app in Safari
2. Tap **Share** (bottom menu)
3. Tap **"Add to Home Screen"**
4. Name the app: "Guest Reg"
5. Tap **"Add"**
6. App appears on home screen

#### What's Available Offline
- ✅ Dashboard (cached)
- ✅ View previous registrations
- ✅ Read hotel information
- ❌ New registrations (needs internet)
- ❌ API requests (needs connection)

---

## Troubleshooting

### Login Issues

**Problem:** "Invalid email or password"
- **Solution:** Check caps lock, verify credentials, reset password if needed

**Problem:** "Network error during login"
- **Solution:** Check internet connection, try again, clear browser cache

**Problem:** "CORS error" in console
- **Solution:** Backend CORS not configured - contact admin

### PDF Issues

**Problem:** "PDF not generating"
- **Solution:** 
  - Check internet connection
  - Wait a few seconds
  - Refresh page and try again
  - Check browser console for errors

**Problem:** "PDF viewer shows black/blank screen"
- **Solution:**
  - Wait for full load (30 seconds max)
  - Refresh browser tab
  - Try different browser
  - Check popup blocker settings

**Problem:** "Can't download PDF"
- **Solution:**
  - Use Print → Save as PDF
  - Try right-click → Save image
  - Check downloads folder

### Guest Registration Issues

**Problem:** "Signature not saving"
- **Solution:**
  - Sign on clear canvas (no scratches)
  - Use mouse or touch, not both
  - Try clearing and signing again
  - Refresh page and retry

**Problem:** "Dates not selectable"
- **Solution:**
  - Check check-out date is after check-in date
  - Past dates cannot be selected
  - Use today or future dates

**Problem:** "Registration not completing"
- **Solution:**
  - Check all required fields (marked with *)
  - Verify signature is present
  - Check agreement checkbox
  - Try again or contact admin

### Performance Issues

**Problem:** "Page loading slowly"
- **Solution:**
  - Clear browser cache
  - Disable browser extensions
  - Try private/incognito mode
  - Check internet speed

**Problem:** "Chart not displaying"
- **Solution:**
  - Wait for data to load
  - Refresh page
  - Check browser console for errors
  - Try different browser

---

## Technical Details

### System Architecture

```
Frontend (Vercel)
  ↓ HTTPS
Backend (Render)
  ↓
Database (Supabase)
  ├─ Guest Data
  ├─ User Accounts
  └─ PDFs Storage
```

### Browser Requirements

- **Chrome** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- Mobile browsers (Safari iOS, Chrome Android)

### System URLs

| Service | URL |
|---------|-----|
| Frontend | https://kekehyuguestregistration-59w34qijr.vercel.app |
| Backend API | https://kekehyu-guest-reg.onrender.com/api |
| API Docs | https://kekehyu-guest-reg.onrender.com/api/docs |
| Supabase | Cloud storage for PDFs |

### API Endpoints (Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User authentication |
| `/guests` | GET | List all guests |
| `/guests/{id}` | GET | Get guest details |
| `/guests/monthly-comparison` | GET | Monthly stats for chart |
| `/guests/statistics` | GET | Period-based stats |

### Data Storage

- **Guest Data:** Supabase PostgreSQL
- **PDFs:** Supabase Storage (signed URLs)
- **User Sessions:** JWT Tokens
- **Offline Data:** Browser LocalStorage (PWA)

---

## Support & Contact

### Frequently Asked Questions

**Q: Can I use the system without internet?**
A: Limited features. Dashboards and previous data are cached, but new registrations require internet.

**Q: How long are PDFs stored?**
A: Indefinitely, unless deleted by admin. PDFs are stored in cloud.

**Q: Can I export guest data?**
A: Contact Super Admin for data export options.

**Q: What if I forget my password?**
A: Contact admin for password reset.

**Q: Can multiple users register guests simultaneously?**
A: Yes, the system supports concurrent registration.

**Q: How often is the monthly chart updated?**
A: In real-time as registrations are added.

---

## Changelog

### Version 1.0.0 (April 13, 2026)
- ✅ Guest registration system launched
- ✅ Dashboard with analytics
- ✅ Monthly comparison chart
- ✅ PDF auto-generation
- ✅ PWA mobile app support
- ✅ Role-based access control
- ✅ Admin panel
- ✅ Super admin configuration
- ✅ Vercel + Render deployment

---

## Document Information

**Document:** System Manual  
**Version:** 1.0  
**Last Updated:** April 13, 2026  
**Author:** Development Team  
**Status:** Active

For technical support or questions, contact your system administrator.

---

**End of Manual**
