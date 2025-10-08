# Fragments-ui

This is the frontend UI for the Fragments microservice project.

## Features
- User authentication via Amazon Cognito
- Fetch and display user fragments from the backend API
- Secure API requests with Authorization headers

## Getting Started

### Prerequisites
- Node.js and npm installed
- Backend Fragments API running (see `../Fragements`)
- AWS Cognito User Pool and App Client set up (for authentication)

### Setup
1. Clone the repository and navigate to the `Fragments-ui` directory:
   ```sh
   cd Fragments-ui
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   API_URL=http://localhost:8080 // use ur ec2 public dns
   AWS_COGNITO_POOL_ID=your_cognito_pool_id
   AWS_COGNITO_CLIENT_ID=your_cognito_client_id
   OAUTH_SIGN_IN_REDIRECT_URL=http://localhost:1234
   ```
4. Start the development server:
   ```sh
   npm start
   ```

## Usage
- Sign in with your Cognito credentials.
- The UI will fetch and display your fragments from the backend.
- If you use invalid credential you will be directed to re enter hte correct credentials.

