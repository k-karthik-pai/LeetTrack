🚀 DSA Rankboard – MERN Stack

A fully-featured competitive programming tracker and social platform built using the MERN stack.
Users can link their LeetCode, Codeforces, GFG, and CodeChef profiles, track progress, compete on a global leaderboard, and follow other coders to see their activities in a social feed.

This project also includes a weekly email report system that automatically sends users their weekly rank & score improvement.

⭐ Features
🔐 Authentication

Register, Login using JWT

Secure protected routes

🧩 Dashboard

Link DSA profiles

Fetch stats from LeetCode + Codeforces

Auto calculates weighted score

View personal stats history

🏆 Leaderboard

Global competitive ranking

View top 100 coders

Click to view profiles

👤 Public Profile

Show user DSA handles

Followers / Following count

Follow / Unfollow button

📰 Social Feed

Shows activities of people you follow

Displays stats update events

Suggested users to follow

🤖 Stats Fetching

LeetCode GraphQL API

Codeforces Official API

Automatic score calculation

📧 Weekly Email Reports

Cron job runs every Monday 9 AM

Sends personal report with

Score

Rank

Score change

Rank change

📱 Fully Responsive UI

Dark UI theme

Minimal, professional dashboard

🛠 Tech Stack
Frontend

React.js

React Router

Axios

Custom CSS (dark theme)

Backend

Node.js

Express.js

Mongoose

JWT Authentication

Nodemailer (email reports)

Node-Cron (scheduled tasks)

Database

MongoDB / MongoDB Atlas

📁 Folder Structure
dsa-rankboard/
  backend/
    server.js
    package.json
    .env.example
    /routes
    /controllers
    /models
    /services
    /middleware
    /cron
    /utils
  
  frontend/
    package.json
    /public
    /src
      index.js
      App.js
      /pages
      /components
      /context
      /styles

⚙️ Setup & Installation
1️⃣ Clone the repository
git clone https://github.com/<your-username>/dsa-rankboard.git
cd dsa-rankboard

🗄️ Backend Setup
cd backend
npm install

Create .env file:
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000

# Email config
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL="DSA Rankboard <your_email@gmail.com>"

Start backend
npm run dev


Backend runs at:
👉 http://localhost:5000

🎨 Frontend Setup
cd ../frontend
npm install
npm start


Frontend runs at:
👉 http://localhost:3000

🔗 Environment Flow

User logs in → receives JWT

JWT is stored in localStorage

Axios attaches token in headers

Backend authenticates users using middleware

Users link DSA profiles

Backend fetches stats → recalculates score

Leaderboard updates

Weekly Cron sends email reports

📧 Weekly Email Cron

Located in:

backend/cron/weeklyEmailCron.js


Runs automatically every Monday at 9 AM:

Pulls all users

Calculates rank

Sends personalized email

Stores snapshot in DB

📡 API Endpoints
🔐 Auth
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login & get JWT
🧩 User
Method	Endpoint	Description
GET	/api/users/me	Get current user
PUT	/api/users/profiles	Update LC/CF/CC/GFG handles
POST	/api/users/refresh-stats	Fetch stats & recalc score
GET	/api/users/stats	Get stats history
📰 Social
Method	Endpoint	Description
POST	/api/users/:id/follow	Follow a user
POST	/api/users/:id/unfollow	Unfollow a user
GET	/api/users/:id/profile	Public profile
GET	/api/users/feed/activity	Social feed
🏆 Leaderboard
Method	Endpoint	Description
GET	/api/leaderboard	Get top ranked users
🧪 Testing

Use Postman or Thunder Client.
Import the following:

🔑 Add Auth Header
Authorization: Bearer <your_jwt_token>



Database

MongoDB Atlas


📜 License

This project is licensed under the MIT License.

🙌 Author

Chaitanya
DSA Enthusiast | MERN Developer
