# Online Exam Platform: Feature Deep Dive

This document breaks down every major feature of the Online Exam Platform. For each feature, it explains the complete workflow, the libraries used (and why), and the most common interview questions you can expect.

---

## 1. Authentication & Role-Based Access Control (RBAC)

**Overview:**
A highly secure, stateless authentication system using a two-token JWT architecture. It ensures users (Students, Admins, SuperAdmins) can only access the data and routes permitted for their role.

**Complete Workflow:**

1. **Login:** The user submits their email and password.
2. **Verification:** The Node.js backend uses `bcrypt` to compare the password hash in MongoDB.
3. **Token Generation:** The backend creates a short-lived Access Token (15 mins) and a long-lived Refresh Token (7 days).
4. **Delivery:** The Access Token is sent in the JSON response, while the Refresh Token is placed inside a secure `HttpOnly` cookie.
5. **Client State:** The React app stores the Access Token in memory using `Zustand`.
6. **API Requests:** An `Axios Interceptor` automatically attaches the Access Token to the header of every outgoing request.
7. **Backend Protection:** The `verifyToken` middleware checks the token's validity before hitting the controller. The `requireRole` middleware ensures the user has the correct permissions (e.g., stopping a student from viewing the admin dashboard).
8. **Silent Refresh:** If the Access Token expires, a secondary Axios Response Interceptor catches the 401 error, silently asks the backend for a new token using the HttpOnly cookie, and replays the original request.

**Libraries Used:**

- `jsonwebtoken`: Used to create and verify the stateless tokens. Chosen because it prevents the need to query a session database on every single request.
- `bcrypt`: Used for password hashing. Chosen because it includes automatic "salting" making dictionary attacks nearly impossible.
- `cookie-parser`: Express middleware to read the HttpOnly cookies.
- `zustand`: React state management. Chosen because it is significantly lighter and requires less boilerplate than Redux.
- `axios`: For API requests. Chosen specifically for its powerful "Interceptor" feature which allows for the automatic silent-refresh logic.

**Most Likely Interview Questions:**

- _Why did you use two tokens instead of just one?_ (Security. If an Access token is stolen via an XSS attack, the hacker only has 15 minutes. The long-lived Refresh token is safe inside an HttpOnly cookie where JavaScript cannot read it).
- _What is an HttpOnly cookie?_ (A browser cookie that cannot be accessed by client-side scripts, protecting it from Cross-Site Scripting).
- _How did you implement Role-Based Access Control?_ (Using a custom Express middleware that checks the decoded `req.user.role` against an array of permitted roles).

---

## 2. Exam Creation & Question Bank Management

**Overview:**
Allows admins to create reusable questions (with images) and group them into timed exams assigned to specific student batches.

**Complete Workflow:**

1. **Question Creation:** Admin fills out a question form. If there is an image, it is uploaded to the backend.
2. **File Processing:** The backend intercepts the file, uploads it to Cloudinary, receives a URL string, and saves the question to MongoDB.
3. **Exam Assembly:** Admin selects questions from a list, sets a time limit, pass mark, and assigns it to a Batch (class).
4. **Validation:** The backend receives the payload, validates that all required fields are present, and saves the `Exam` document.

**Libraries Used:**

- `mongoose`: MongoDB ODM. Chosen because it enforces strict Schemas (e.g., ensuring an Exam has a `durationMins` field of type Number).
- `multer`: Express middleware for handling multipart/form-data (file uploads).
- `cloudinary`: Third-party cloud storage. Chosen because storing image files directly on a Node.js server consumes too much disk space and bandwidth; Cloudinary provides a fast CDN and a simple URL string to store in the database.

**Most Likely Interview Questions:**

- _How does the image upload process work?_ (Explain the flow: Browser -> Multer -> Cloudinary -> MongoDB).
- _Why use Mongoose instead of the native MongoDB driver?_ (Because native MongoDB lets you save anything. Mongoose provides structure, validation, and relationships via `.populate()`).

---

## 3. Anti-Cheat Exam Taking (The Student Experience)

**Overview:**
A highly secure, proctored environment for students to take tests. It randomizes questions to prevent answer sharing and tracks browser behavior to catch cheating.

**Complete Workflow:**

1. **Initialization:** Student clicks "Start Exam". The backend uses a "seeded randomizer" to shuffle the options (A,B,C,D) uniquely for that specific student, and saves an `optionOrderMap` to the database.
2. **Environment Lock:** The React frontend forces the browser into Fullscreen mode.
3. **Monitoring:** React listens to browser events (`visibilitychange`, `fullscreenchange`). If the student opens a new tab or exits fullscreen, a "Violation" object is pushed to a tracking array.
4. **Progress Tracking:** As the student clicks answers, React tracks the selected options and the exact time spent on each question.

**Libraries Used:**

- _No external libraries for anti-cheat!_
- **Native Browser APIs:** `document.fullscreenElement` and `document.visibilityState` were used. Chosen because relying on native APIs is faster and more reliable than heavy third-party packages for basic proctoring.

**Most Likely Interview Questions:**

- _If every student gets shuffled options (A,B,C,D), how does the server grade it?_ (Explain the `optionOrderMap` concept. The server tracks how the test was shuffled, so it can "un-shuffle" the answers before comparing them to the database).
- _How did you detect tab switching?_ (By attaching an event listener to the native browser `visibilitychange` event).
- _What happens if the student's internet drops?_ (A good place to mention how you _would_ improve the app using `LocalStorage` to cache answers).

---

## 4. Automated Scoring, Cron Jobs & Real-Time Notifications

**Overview:**
Instantly grades exams upon submission, forcefully auto-submits exams when the timer runs out, and notifies the teacher instantly.

**Complete Workflow:**

1. **Manual Submission:** Student clicks submit. The backend scoring engine un-shuffles their answers, compares them to the DB, calculates the total percentage, and updates their `Attempt` document.
2. **Auto Submission (Cron):** A background script runs every 60 seconds. It checks the DB for any "pending" attempts where the `(startedAt + durationMins)` is in the past. If found, it forcefully runs the scoring engine and submits it for the student.
3. **Notification:** Once an exam is scored (manually or automatically), the backend emits a Socket.IO event to a specific "Institute Room".
4. **Teacher Dashboard:** The React app receives the socket event and displays a toast notification ("John Doe just finished the Math Exam") without the teacher needing to refresh.

**Libraries Used:**

- `node-cron`: A task scheduler for Node.js. Chosen because it's lightweight and uses standard Linux Cron syntax to execute background tasks on a timer.
- `socket.io`: Enables real-time, bidirectional communication. Chosen over standard WebSockets because it has built-in features for "Rooms" (so we only broadcast notifications to the correct school) and automatic reconnections.

**Most Likely Interview Questions:**

- _What happens if a student just closes their laptop instead of clicking submit?_ (Explain the Node-Cron auto-submit script).
- _Why did you use Socket.IO instead of just normal HTTP requests?_ (Normal HTTP requests require the browser to "ask" the server. Socket.IO allows the server to instantly "push" data to the browser).
- _How do you ensure notifications only go to the right teachers?_ (Using Socket.IO "Rooms". When a teacher logs in, they join a room named after their `instituteId`).

---

## 5. Analytics Dashboard

**Overview:**
Provides teachers with a bird's-eye view of class performance, including score distributions and per-question accuracy.

**Complete Workflow:**

1. **Data Fetching:** React requests the exam summary.
2. **Aggregation:** The backend controller fetches all submitted attempts for that exam. It loops through them to calculate the average score, buckets the scores (e.g., 80-90%), averages the time spent per question, and counts how many students got each specific question correct.
3. **Rendering:** The backend sends a massive JSON object to React.
4. **Visualization:** React uses charting components to draw interactive Bar Charts. When a teacher hovers over a bar, a tooltip shows exact data points.

**Libraries Used:**

- `recharts`: A composable charting library built on React components. Chosen because it is much more "React-friendly" than older libraries like Chart.js. It allows you to build charts by simply nesting JSX tags like `<BarChart>` and `<Tooltip>`.

**Most Likely Interview Questions:**

- _How did you generate the data for the charts?_ (Explain the backend aggregation loop).
- _Why Recharts?_ (Explain its composable JSX nature compared to vanilla JS charting libraries).

---

## 6. Payment & Subscription Integration

**Overview:**
Allows institutes to upgrade their plans (to add more students/admins) by integrating a secure payment gateway.

**Complete Workflow:**

1. **Order Creation:** Teacher clicks "Upgrade". Backend calls Razorpay to create a secure Order (in INR) and returns an `order_id`.
2. **Checkout:** React opens the Razorpay popup using the `order_id` where the user enters card details.
3. **Signature Generation:** Razorpay completes the payment and gives the React app a success signature.
4. **Backend Verification:** React sends the signature to the backend. The backend uses a secret password and the `crypto` library to hash the data using HMAC-SHA256. If the backend's hash matches Razorpay's signature, the database upgrades the user's plan.

**Libraries Used:**

- `razorpay`: The official Node.js SDK. Chosen because it's the industry standard in India and supports UPI.
- `crypto`: A built-in Node.js module. Chosen to securely generate the HMAC-SHA256 hash required for payment verification.

**Most Likely Interview Questions:**

- _How do you prevent a hacker from bypassing the payment by sending a fake "Success" message to your backend?_ (Explain the cryptographic signature verification. If the hacker doesn't know the server's secret Razorpay key, they cannot forge the signature).
- _Explain the entire flow of a Razorpay integration._ (Create Order -> Frontend Checkout -> Backend Signature Verification).
