# DevSocHackathon2025
2025 devsoc hackathon
By; Tahir, Mahir, Alfis, David
# Project Reco

## 🏹: 1. Motivation 

Picking courses at UNSW can sometimes be challenging, especially as a first year student without a general idea of what they would like to pursue as a career.

Perhaps you're a third year student regretting the decision to do Computer Science entirely, and want to switch to something else but you don't know what. 

Even though UNSW provides a course handbook, traversing something that information heavy can be overwhelming for most students.

What do you search for? How can you filter based on core topics? How can you choose the subjects based on your interests?

The point is, as useful as the UNSW handbook might be, it lacks the personalised experience that we provide with our solution.

This is how our project, Reco, came to be. A course planner app that suggests courses based on a pre-determined criteria that you can choose yourself.

## <img width="32" height="29" alt="image" src="https://github.com/user-attachments/assets/bd94fbce-fb24-46f2-a590-efea9bbff07c" />: 2. Reco 

### 2.1. Product Introduction 

When it comes to choosing subjects, it is often difficult to decide how relevant a course will be for your career or whether it suits your interests. Our product aims to minimise this confusion.

### 2.2. Proposed design

Images of final frontend

## 3. Getting Started

### 3.1. Frontend

```
// Setup
cd ./frontend
npm install

// Running frontend
npm run dev
```

### 3.2. Backend

```
// Setup
cd ./backend
npm install

// Running backend
node index.js
```

### 3.3. DB

We are using `MongoDB Atlas`

1. Navigate to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up using the free plan
3. Once you're in the Atlas dashboard, click on `Data Services` and `Connect`
4. You should see a popup, then click `Connect using VSCode`

6. Create a .env file in ./backend directory and add this line

```bash
MONGO_URI="${your_atlas_url}"
```

## 4. Feature & Reqirements 

### 4.1. Login & Registration

    * Login should require:
        - Email (zID) 
        - Passowrd

    * Registration should require:
        - Email (zID)
        - Password

    * During registration, upon unfocus, application should check:
        - If the email is taken

    * Only allow users to register when the pass the above checks


### 4.2. Course Selection

    * A multi-select search bar that allows you to select completed courses
    
    * A multi-select search bar that allows you to select interests and potential career paths (not yet implemented)
    
    * A button to submit that takes you to recommendations page

### 4.3. Course Recommendations

    * Recommendation dashboard should contain:
        - Course suggestions
        - Tiers (Strong, moderate, weak relevance of courses)
        - Profile
        - Settings button
        - Logout button

    * Users should be able to filter what kind of courses (core, electives, genEd)

    * Hovering on a course gives a brief description and a personalised relevance score

### 4.4. Profile Page

    * Profile should display the following items
        - Profile Image
        - Name
        - Completed courses
        - Interests and potential career paths
    
    * A button should be provided for users to edit their profile
    
    
## 📝: 5. Minor Notes
### 5.1. Stack

* Language  : `JavaScript`
* Front-end : `React, TailwindCSS, React Router DOM, React Query`
* Back-end  : `Express, JWT`
* Database  : `MongoDB`

