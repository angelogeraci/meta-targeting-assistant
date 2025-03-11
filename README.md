# Meta Targeting Assistant

Application that connects Meta and OpenAI APIs to generate advertising targeting criteria suggestions by country.

## Objective

This application allows you to:
- Select a target country
- Add custom categories according to your needs
- Automatically generate relevant criteria by category via OpenAI
- Search for corresponding targeting interests via Meta Marketing API
- Calculate a similarity score between proposed criteria and Meta suggestions
- Export results to CSV for later use

## Features

- **Country Selection**: Choose the target market for your ads
- **Category Management**: Use predefined categories or add your own custom categories
- **Criteria Generation**: Get relevant suggestions via OpenAI by category
- **Meta Interests Search**: Connect to Meta Marketing API to find corresponding interests
- **Similarity Analysis**: Evaluate the relevance of Meta suggestions compared to original criteria
- **Filtering and Sorting**: Organize results to identify the best matches
- **CSV Export**: Export results for use in your ad manager

## Screenshots

(Screenshots coming soon)

## Prerequisites

- Node.js v16+
- Meta developer account with Marketing API access
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/angelogeraci/meta-targeting-assistant.git
cd meta-targeting-assistant
```

### 2. Configure environment variables

Create a `.env` file at the root of the project based on `.env.example`:

```bash
# Server port
PORT=5000

# OpenAI configuration
OPENAI_API_KEY=your_openai_api_key

# Meta configuration
META_ACCESS_TOKEN=your_meta_access_token
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# Environment
NODE_ENV=development
```

### 3. Install dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 4. Start the application

```bash
# Start the application in development mode (server + client)
npm run dev
```

The application will be available at: http://localhost:3000

## Project Structure

```
├── client/               # React frontend application
│   ├── public/           # React public files
│   └── src/              # React source code
│       ├── components/   # React components
│       └── services/     # API services
├── server/               # Node.js backend server
│   ├── routes/           # Express API routes
│   └── services/         # Services (OpenAI, Meta API, similarity)
├── .env.example          # Example environment variables
└── package.json          # npm configuration
```

## Obtaining Required API Keys

### OpenAI API Key
1. Create an account on [OpenAI](https://openai.com/)
2. Access the [API Keys](https://platform.openai.com/account/api-keys) section
3. Create a new API key

### Meta Marketing API Configuration
1. Create an account on [Meta for Developers](https://developers.facebook.com/)
2. Create an application in the "Business" category
3. Add the "Marketing API" product to your application
4. Generate an access token with the necessary permissions

## Usage

1. Select a country from the dropdown menu
2. Choose predefined categories or add your own custom categories
3. Click on "Search for suggestions"
4. Wait for criteria to be generated and Meta suggestions to be retrieved
5. Explore the results in the table, use filters and sort according to your needs
6. Export the results to CSV for use in your advertising campaigns

## License

MIT

## Contributions

Contributions are welcome! Feel free to open an issue or submit a pull request.
