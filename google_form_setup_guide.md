# Google Form Integration Setup Guide

This guide explains how to set up a Google Form to capture student profile registrations from your Apply Tracker dashboard and extract the required field entry IDs for your `.env` file.

---

## Step 1: Create a Google Form

1. Go to [Google Forms](https://forms.google.com/) and create a new blank form.
2. Title the form **"Apply Tracker User Registration Form"**.
3. Add the following question fields exactly as shown in your form:
   - **Full Name :** (Short answer, Required)
   - **Email Address :** (Short answer, Required)
   - **College / University Name :** (Short answer, Required)
   - **Degree Program :** (Short answer, Required)
   - **Branch / Specialization :** (Short answer, Required)
   - **Year of Passing (YOP) :** (Multiple choice selector: 2024, 2025, 2026, 2027, 2028, 2029, 2030, Required)
   - **Primary Tech Stack :** (Short answer, Required)
   - **How did you discover Apply Tracker? :** (Multiple choice options: Friend / Referral, WhatsApp, Telegram, YouTube, LinkedIn, Other, Required)
   - **Confirmation** (Checkbox option: "I Agree" with text "I consent to providing this information for platform analytics and improvement purposes.", Required)

---

## Step 2: Get the Google Form Submission URL

To submit responses programmatically, we need the `formResponse` submission link:

1. Click the **Send** button at the top right of your Google Form.
2. Select the **Link icon (🔗)** and copy the link (e.g., `https://docs.google.com/forms/d/e/1FAIpQLSfXYZ123.../viewform`).
3. Replace `/viewform` at the end of the URL with `/formResponse`.
4. This is your **Form Submission URL**.
   - **Example**: `https://docs.google.com/forms/d/e/1FAIpQLSfXYZ123.../formResponse`
5. Set this value in your `frontend/.env` file:
   ```env
   VITE_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSfXYZ123.../formResponse
   ```

---

## Step 3: Get the Input Entry IDs

Google Forms maps each question input to a specific unique numeric ID prefix (e.g., `entry.18273645`). You must locate these IDs from the form's HTML code:

1. Open your Google Form in the browser using the public link (the one ending in `/viewform` that you copied in Step 2).
2. Right-click on the input field for the first question (**Full Name :**) and select **Inspect** (or press `F12` and use the element picker).
3. Look at the HTML code of the input element. Look for an attribute named `name` inside the `<input>` or `<textarea>` tag, or inside a parent container.
   - It will look like: `name="entry.123456789"`
4. Repeat this inspection for all fields to find their respective `entry.xxxxxxxxx` IDs:
   - Full Name
   - Email Address
   - College / University Name
   - Degree Program
   - Branch / Specialization
   - Year of Passing (YOP)
   - Primary Tech Stack
   - How did you discover Apply Tracker?
5. Copy these IDs into your environment file.

---

## Step 4: Populate your Environment Variables

Open `frontend/.env` (or create it in the root folder) and fill in the values you extracted:

```env
# Google Form Backend Configuration
VITE_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/YOUR-FORM-ID/formResponse
VITE_GOOGLE_FORM_NAME_ENTRY=entry.111111111
VITE_GOOGLE_FORM_EMAIL_ENTRY=entry.222222222
VITE_GOOGLE_FORM_COLLEGE_ENTRY=entry.333333333
VITE_GOOGLE_FORM_DEGREE_ENTRY=entry.444444444
VITE_GOOGLE_FORM_BRANCH_ENTRY=entry.555555555
VITE_GOOGLE_FORM_YOP_ENTRY=entry.666666666
VITE_GOOGLE_FORM_TECHSTACK_ENTRY=entry.777777777
VITE_GOOGLE_FORM_DISCOVERY_ENTRY=entry.888888888
```

---

## Step 5: Link Google Form to a Google Sheet

To view your registered student profiles in spreadsheet format:
1. Go to your Google Form edit mode page.
2. Click on the **Responses** tab at the top.
3. Click the green **Link to Sheets** icon.
4. Select "Create a new spreadsheet" and click "Create".
5. All profile responses submitted from the onboarding wizard will now automatically populate into this Google Sheet in real time!
