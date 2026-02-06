# Setup Scripts

## setup-notion-databases.js

Creates the Notion databases required for Guitar Tracker v3.

### Prerequisites

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Share the parent page (2f851ee9-25cd-8173-9533-f269472ba8d4) with your integration
3. Copy the integration token

### Usage

```bash
# Create .env file
echo "NOTION_API_KEY=ntn_your_token_here" > .env

# Run the script
node scripts/setup-notion-databases.js
```

The script will output the database IDs - add them to your .env file.

### Databases Created

- **Humidity Log**: Tracks temperature and humidity readings
- **Maintenance Log**: Records completed maintenance tasks
