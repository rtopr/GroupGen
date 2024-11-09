# GroupGen

GroupGen is an innovative application that allows users to create and interact with AI-powered group conversations. Imagine chatting with anyone you can dream up! Users can create unique members with customized personalities, generate their profile pictures using AI, and engage in dynamic conversations. The application leverages advanced AI models to generate text responses and images based on the conversation history.

## URL

https://groupgen-39162.uc.r.appspot.com/

## Features

- **Create Unique Members**: Customize members with names and personalities.
- **Generate Profile Pictures**: Use AI to generate profile pictures for your members.
- **Engage in Conversations**: Have in-depth, creative, funny, and intelligent conversations with AI-powered members.
- **Image Generation**: Generate images depicting your conversations with one click.
- **AI-Driven Responses**: Choose who you want to respond or let the AI decide for you.
- **Free to Use**: Enjoy all features without any cost.

## Getting Started

### Prerequisites

- **Node.js** (version 20 or later)
- **Firebase Account**: For authentication, database, and storage.
- **Google Cloud Platform Account**: For deploying the application.
- **API Keys**: Obtain API keys from OpenAI, Mistral AI, and Getimg.ai.

## Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/groupgen.git
cd groupgen
```

### Install Dependencies

#### Frontend

```bash
cd client/source
npm install
```

#### Backend

```bash
cd ../../../nodejsAi
npm install
```

### Set Up Firebase Configuration

Replace the placeholders with your Firebase project's configuration in `config/firebase-config.js`:

```javascript
// config/firebase-config.js
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
const app = initializeApp(firebaseConfig);
```

### Set Up Environment Variables

#### Backend

Create an `.env` file in the `nodejsAi` directory with your API keys:

```env
# nodejsAi/.env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
MISTRAL_API_KEY=YOUR_MISTRAL_API_KEY
GETIMG_API_KEY=YOUR_GETIMG_API_KEY
CORS_ORIGIN=https://your-app-url.com
```

> Note: Replace placeholders with your actual API keys. Do not commit this file to version control.

#### Frontend

Create `client/source/app.yaml` with your Firebase environment variables:

```yaml
# client/source/app.yaml
runtime: nodejs20
service: frontend
env: standard
env_variables:
  REACT_APP_FIREBASE_API_KEY: "YOUR_FIREBASE_API_KEY"
  REACT_APP_FIREBASE_AUTH_DOMAIN: "YOUR_PROJECT_ID.firebaseapp.com"
  REACT_APP_FIREBASE_PROJECT_ID: "YOUR_PROJECT_ID"
  REACT_APP_FIREBASE_STORAGE_BUCKET: "YOUR_PROJECT_ID.appspot.com"
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: "YOUR_MESSAGING_SENDER_ID"
  REACT_APP_FIREBASE_APP_ID: "YOUR_APP_ID"
  REACT_APP_FIREBASE_MEASUREMENT_ID: "YOUR_MEASUREMENT_ID"
  REACT_APP_API_URL: "https://your-app-url.com"
  REACT_APP_SOCKET_URL: "wss://your-app-url.com"
handlers:
  - url: /(.*\.(json|ico|js|css|png|jpg|gif|svg|woff|woff2|ttf|eot))$
    static_files: build/\1
    upload: build/.*\.(json|ico|js|css|png|jpg|gif|svg|woff|woff2|ttf|eot)$
  - url: /.*
    static_files: build/index.html
    upload: build/index.html

```

### Build the Frontend

```bash
cd client/source
npm run build
```

## Project Structure

```
groupgen/
├── client/
│   └── source/
│       ├── public/
│       │   ├── index.html
│       │   ├── manifest.json
│       │   └── ...
│       ├── src/
│       │   ├── Components/
│       │   │   ├── Chat/
│       │   │   ├── LLM/
│       │   │   └── ...
│       │   ├── Pages/
│       │   │   ├── LandingPage.jsx
│       │   │   └── ...
│       │   ├── App.js
│       │   ├── App.css
│       │   ├── index.js
│       │   └── ...
│       ├── package.json
│       └── ...
├── nodejsAi/
│   ├── server.js
│   ├── package.json
│   ├── app.yaml
│   └── ...
├── functions/
│   ├── index.js
│   ├── package.json
│   └── ...
├── .gitignore
├── README.md
└── ...
```

### Key Directories and Files

- **client/source**: Contains the React frontend application.
  - **public**: Static files and assets.
  - **src**: Source code for React components and pages.
  - **App.js**: Main application component.
  - **App.css**: Global styles.
  - **index.js**: Entry point for the React application.
  - **package.json**: Frontend dependencies and scripts.
  - **app.yaml**: Configuration for deploying the frontend to Google App Engine.
- **nodejsAi**: Contains the backend server code using Express.js.
  - **server.js**: Main server file handling API endpoints and socket connections.
  - **package.json**: Backend dependencies and scripts.
  - **app.yaml**: Configuration for deploying the backend to Google App Engine.
- **functions**: Contains Firebase Cloud Functions.
  - **index.js**: Entry point for Cloud Functions.
  - **package.json**: Functions dependencies.

### Firebase Configuration

The application uses Firebase for authentication, Firestore for the database, and Cloud Storage for storing images.

## Firestore Structure

```
users
  └── [uid]
      ├── userInfo
      │   └── info
      │       └── defaultMemberId
      ├── chats
      │   └── [chatID]
      │       ├── chatName
      │       ├── createdAt
      │       ├── imageStyle
      │       ├── usersMember
      │       ├── lastOpened
      │       ├── members
      │       │   └── [memberID]
      │       └── messages
      │           └── [messageID]
      │               ├── key
      │               ├── message
      │               ├── messageType
      │               ├── time
      │               └── user
      └── members
          └── [memberID]
              ├── avatarUrl
              ├── name
              └── personality
```

### Firebase Rules

- **Firestore Rules** (firestore.rules): Set up rules to protect user data and define read/write permissions.
- **Storage Rules** (storage.rules): Define permissions for accessing Cloud Storage.

### Cloud Functions

The application uses Firebase Cloud Functions to handle storage operations.

- **saveProfilePicture**
  - Input: `imageUrl`, `memberID`
  - Output: `success`, `url`
  - Description: Saves a profile picture to the user's storage.
- **deleteProfilePicture**
  - Input: `memberID`
  - Output: `success`
  - Description: Deletes a profile picture from the user's storage.
- **saveConversationImage**
  - Input: `imageUrl`, `chatID`, `description`
  - Output: `success`, `url`, `description`
  - Description: Saves conversation images to the user's storage.
- **deleteConversationImage**
  - Input: `chatID`, `fileName`
  - Output: `success`
  - Description: Deletes conversation images from the user's storage.

## AI Integrations

The application leverages several AI models to enhance user experience.

### Text Generation

- **OpenAI GPT-4**: Used for generating chat names, AI responses, and optimizing prompts.
  - Endpoint: `/api/generate-text`
  - Models: `gpt-4`, `gpt-4o-mini`
- **Mistral AI**: Used for generating chat responses.
  - Endpoint: `/api/generate-text-mistral`
  - Model: `mistral-large-latest`

### Image Generation

- **Getimg.ai (FLUX Model)**: Generates images based on conversation history.
  - Endpoint: `/api/generate-image`
  - Model: `flux-schnell`

### API Endpoints

Backend Server (`nodejsAi/server.js`):
- `POST /api/generate-text`: Generates text using OpenAI models.
- `POST /api/generate-text-mistral`: Generates text using Mistral AI.
- `POST /api/generate-image`: Generates images using Getimg.ai.
- `GET /api/test`: Test endpoint to check if the API is working.

## Deployment

### Google Cloud App Engine

The application is configured to be deployed on Google Cloud App Engine with separate services for the frontend and backend.

#### Backend Deployment

```bash
cd nodejsAi
gcloud app deploy
```

#### Frontend Deployment

```bash
cd client/source
gcloud app deploy
```

### Firebase Hosting (Optional)

Alternatively, you can deploy the frontend using Firebase Hosting.

```bash


firebase deploy --only hosting
```

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.