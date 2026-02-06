#!/usr/bin/env node
// Creates Notion databases for Guitar Tracker v3
// Run: node scripts/setup-notion-databases.js

import { Client } from '@notionhq/client';
import 'dotenv/config';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PARENT_PAGE_ID = '2f851ee9-25cd-8173-9533-f269472ba8d4';

async function createHumidityLogDatabase() {
  console.log('Creating Humidity Log database...');

  const response = await notion.databases.create({
    parent: { page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'Humidity Log' } }],
    properties: {
      'Reading ID': {
        title: {}
      },
      'Guitar': {
        select: {
          options: [
            { name: 'GS Mini', color: 'blue' },
            { name: 'PRS CE24', color: 'purple' }
          ]
        }
      },
      'Humidity': {
        number: {
          format: 'number'
        }
      },
      'Temperature': {
        number: {
          format: 'number'
        }
      },
      'Location': {
        select: {
          options: [
            { name: 'Case', color: 'green' },
            { name: 'Room', color: 'blue' },
            { name: 'Storage', color: 'gray' }
          ]
        }
      },
      'Source': {
        select: {
          options: [
            { name: 'Manual', color: 'default' },
            { name: 'Govee', color: 'green' },
            { name: 'Inkbird', color: 'blue' }
          ]
        }
      },
      'Timestamp': {
        date: {}
      },
      'Alert Level': {
        select: {
          options: [
            { name: 'Normal', color: 'green' },
            { name: 'Warning', color: 'yellow' },
            { name: 'Critical', color: 'red' }
          ]
        }
      }
    }
  });

  console.log(`✓ Humidity Log created: ${response.id}`);
  return response.id;
}

async function createMaintenanceLogDatabase() {
  console.log('Creating Maintenance Log database...');

  const response = await notion.databases.create({
    parent: { page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'Maintenance Log' } }],
    properties: {
      'Event': {
        title: {}
      },
      'Guitar': {
        select: {
          options: [
            { name: 'GS Mini', color: 'blue' },
            { name: 'PRS CE24', color: 'purple' }
          ]
        }
      },
      'Task ID': {
        rich_text: {}
      },
      'Category': {
        select: {
          options: [
            { name: 'Daily', color: 'green' },
            { name: 'Weekly', color: 'blue' },
            { name: 'Monthly', color: 'purple' },
            { name: 'Quarterly', color: 'orange' },
            { name: 'Annual', color: 'red' },
            { name: 'Setup', color: 'gray' }
          ]
        }
      },
      'Completed Date': {
        date: {}
      },
      'Notes': {
        rich_text: {}
      }
    }
  });

  console.log(`✓ Maintenance Log created: ${response.id}`);
  return response.id;
}

async function main() {
  console.log('Guitar Tracker - Notion Database Setup\n');

  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY not found in environment variables');
    console.error('   Create a .env file with: NOTION_API_KEY=ntn_...');
    process.exit(1);
  }

  try {
    const humidityLogId = await createHumidityLogDatabase();
    const maintenanceLogId = await createMaintenanceLogDatabase();

    console.log('\n✅ All databases created successfully!\n');
    console.log('Add these to your .env file:');
    console.log(`NOTION_HUMIDITY_LOG_ID=${humidityLogId}`);
    console.log(`NOTION_MAINTENANCE_LOG_ID=${maintenanceLogId}`);

  } catch (error) {
    console.error('❌ Error creating databases:', error.message);
    process.exit(1);
  }
}

main();
