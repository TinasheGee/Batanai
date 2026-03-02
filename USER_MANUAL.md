# Batanai User Manual & Guide

Welcome to **Batanai**, a comprehensive business directory and marketplace platform. This guide covers how to get started, register accounts, and use the platform's core features.

---

## 1. Getting Started

### Accessing the Platform

1.  Ensure the application is running (see `README.md` for technical setup).
2.  Open your web browser and navigate to:
    - `http://localhost:3000` (Local Environment)

### The First Step: Logging In

When you open the application, you will land on the **Login Page**.

- **Existing Users**: Enter your Email and Password to log in.
- **New Users**: You must register first. Choose the option that fits your needs:
  - **"Sign up as Customer"**: If you want to browse businesses and leave reviews.
  - **"Register Business"**: If you own a business and want to list it on the platform.

---

## 2. Guide for Customers

### Registration

1.  Click **"Sign up as Customer"** on the Login page.
2.  Fill in your **Full Name**, **Email**, and create a **Password**.
3.  Click **Sign Up**. You will be redirected to the Login page to sign in with your new credentials.

### Using the Marketplace

Once logged in, you can access the **Marketplace** to find businesses.

- **Navigation**: Use the menu to switch between different views:
  - **Map View**: See businesses plotted geographically.
  - **List View**: A detailed vertical list of businesses.
  - **Grid View**: A card-style layout for browsing.

### Searching & Filtering

Use the search bar at the top of the Marketplace to find what you need.

- **Search**: Type keywords (e.g., "Plumbing", "Coffee").
- **Filters**: You can filter results by:
  - **Category**: Narrow down by industry.
  - **Location**: Find businesses in a specific area.
  - **Rating**: Filter by minimum star rating.
  - **Verified**: Toggle to see only verified businesses.

### Reviews

- Click on a business to view details.
- **Submit a Review**: Select a star rating and write a comment about your experience.
- **View History**: You can see your past reviews in your User Dashboard.

---

## 3. Guide for Business Owners

### Registration

1.  Click **"Register Business"** on the Login page.
2.  Fill in your personal and business details.
3.  **Payment/Confirmation**: You may be asked to confirm your business details (Name and Email) on the Payment page.

### Business Dashboard (`/home`)

After logging in, you are taken to the **Business Homepage**.

- **Navigation**: Use the sidebar to access:
  - **Marketplace**: See how your business appears to others.
  - **Messaging**: (Coming Soon) Chat with customers.
  - **My Network**: (Coming Soon) Connect with other businesses.
- **Promotions**: The top section highlights daily deals and discounts.
- **Profile**: Click "Profile" in the top right to manage your business settings.

---

## 4. For Administrators

### Admin Controls

Admins have special access to maintain the quality of the platform.

- **Verify Businesses**: Admins can view a list of unverified businesses and toggle their status to "Verified". Verified businesses appear with a badge in the marketplace.
- **User Management**: View a list of all registered users and their roles.

---

## 5. Troubleshooting

- **"User already exists"**: Try logging in or use a different email address.
- **"Invalid credentials"**: Double-check your password.
- **Blank Screen**: Ensure the backend server (`npm run dev` in `backend/`) is running on port 5000.
