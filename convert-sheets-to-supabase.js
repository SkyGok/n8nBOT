#!/usr/bin/env node

/**
 * Convert Google Sheets nodes to Supabase nodes in n8n workflow
 * 
 * Usage: node convert-sheets-to-supabase.js
 * 
 * This script:
 * 1. Reads the workflow JSON
 * 2. Finds all Google Sheets nodes
 * 3. Converts them to Supabase nodes
 * 4. Maps field names from Sheets to Supabase columns
 * 5. Updates connections
 * 6. Saves the updated workflow
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WORKFLOW_FILE = path.join(__dirname, 'Demo Gokhan.json');
const OUTPUT_FILE = path.join(__dirname, 'Demo Gokhan - Supabase.json');
const SUPABASE_CREDENTIAL_ID = 'YOUR_SUPABASE_CREDENTIAL_ID'; // Replace with your actual credential ID

// Field mapping: Google Sheets columns → Supabase columns
// Note: Client info (name, email, phone, service_type, notes, therapist_name) stored in metadata JSONB
const APPOINTMENT_FIELD_MAP = {
  'Email': 'metadata.client_email', // Stored in metadata JSONB
  'Appointment Date': 'scheduled_at',
  'Booking Status': 'status',
  'Name': 'metadata.client_name', // Stored in metadata JSONB
  'Service Type': 'metadata.service_type', // Stored in metadata JSONB
  'Therapist Name': 'metadata.therapist_name', // Stored in metadata JSONB
  'Notes': 'metadata.notes', // Stored in metadata JSONB
  'Phone': 'metadata.client_phone' // Stored in metadata JSONB
};

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Read workflow
function readWorkflow() {
  try {
    const data = fs.readFileSync(WORKFLOW_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading workflow file:', error.message);
    process.exit(1);
  }
}

// Write workflow
function writeWorkflow(workflow) {
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2), 'utf8');
    console.log(`✅ Updated workflow saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error writing workflow file:', error.message);
    process.exit(1);
  }
}

// Convert Google Sheets node to Supabase node
function convertSheetsNodeToSupabase(sheetsNode, workflow) {
  const nodeName = sheetsNode.name;
  const operation = sheetsNode.parameters.operation || 'getAll';
  
  console.log(`\n🔄 Converting: ${nodeName} (operation: ${operation})`);

  let supabaseNode = {
    id: sheetsNode.id, // Keep same ID to maintain connections
    name: nodeName.replace('Sheet', '').replace('Rows', 'Appointments').trim() + ' (Supabase)',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: sheetsNode.position,
    credentials: {
      supabaseApi: {
        id: SUPABASE_CREDENTIAL_ID,
        name: 'Supabase Production'
      }
    }
  };

  // Convert based on operation
  switch (operation) {
    case 'getAll':
    case undefined:
      // Read Rows or Read Therapists
      if (nodeName === 'Read Therapists') {
        // For therapists, we'll need a therapists table or use metadata
        // For now, create a select that returns empty (you'll need to create therapists table)
        supabaseNode.parameters = {
          operation: 'select',
          table: 'therapists', // You'll need to create this table
          returnAll: true
        };
        console.log('   ⚠️  Note: Therapists table needs to be created in Supabase');
      } else {
        // Read appointments - appointments table is now source of truth
        supabaseNode.parameters = {
          operation: 'select',
          table: 'appointments',
          filters: {
            filters: [
              {
                keyName: 'scheduled_at',
                condition: 'gte',
                keyValue: '={{ $now }}'
              }
            ]
          },
          returnAll: true
        };
      }
      break;

    case 'append':
      // Add Rows or Write to Therapist Sheet
      if (nodeName === 'Write to Therapist Sheet') {
        // For therapist-specific sheets, store in appointments with therapist metadata
        // Calendar event will be created automatically via trigger
        supabaseNode.parameters = {
          operation: 'insert',
          table: 'appointments',
          columns: {
            mappingMode: 'defineBelow',
            value: {
              user_id: null,
              source: 'whatsapp',
              scheduled_at: "={{ $fromAI('appointment_date', 'YYYY-MM-DD HH:mm format') }}",
              status: 'scheduled',
              calendar_event_id: "={{ $('Calendar Create').item.json.id }}",
              metadata: {
                client_name: "={{ $fromAI('client_name') }}",
                client_phone: "={{ $fromAI('client_phone') }}",
                client_email: "={{ $fromAI('client_email') }}",
                service_type: "={{ $fromAI('service_type') }}",
                notes: "={{ $fromAI('notes') }}",
                therapist_first_name: "={{ $fromAI('therapist_first_name') }}",
                therapist_name: "={{ $fromAI('therapist_name') }}",
                duration: "={{ $fromAI('Duration') || '60' }}"
              }
            }
          }
        };
        console.log('   ✅ Calendar event will be created automatically via database trigger');
      } else {
        // Add Rows - main appointments
        // Appointments table is now the source of truth, calendar events are derived automatically
        supabaseNode.parameters = {
          operation: 'insert',
          table: 'appointments',
          columns: {
            mappingMode: 'defineBelow',
            value: {
              user_id: null,
              source: 'whatsapp',
              scheduled_at: "={{ $fromAI('appointment_date', 'YYYY-MM-DD HH:mm format') }}",
              status: "={{ $fromAI('Booking Status', 'scheduled') || 'scheduled' }}",
              calendar_event_id: "={{ $('Calendar Create').item.json.id }}",
              metadata: {
                client_name: "={{ $fromAI('name') }}",
                client_phone: "={{ $fromAI('phone') }}",
                client_email: "={{ $fromAI('email') }}",
                service_type: "={{ $fromAI('service_type') }}",
                notes: "={{ $fromAI('notes') }}",
                therapist_name: "={{ $fromAI('therapist_name') }}"
              }
            }
          }
        };
        console.log('   ✅ Calendar event will be created automatically via database trigger');
      }
      break;

    case 'update':
      // Update Rows - update appointments, calendar events sync automatically
      supabaseNode.parameters = {
        operation: 'update',
        table: 'appointments',
        filters: {
          filters: [
            {
              keyName: 'metadata->>client_email',
              condition: 'equal',
              keyValue: "={{ $fromAI('email') }}"
            }
          ]
        },
        columns: {
          mappingMode: 'defineBelow',
          value: {
            status: "={{ $fromAI('status', 'cancelled') === 'cancelled' ? 'cancelled' : 'scheduled' }}",
            scheduled_at: "={{ $fromAI('appointment_date', 'YYYY-MM-DD HH:mm format') }}",
            metadata: {
              client_name: "={{ $fromAI('name') }}",
              client_phone: "={{ $fromAI('phone') }}",
              client_email: "={{ $fromAI('email') }}",
              service_type: "={{ $fromAI('service_type') }}",
              notes: "={{ $fromAI('notes') }}",
              therapist_name: "={{ $fromAI('therapist_name') }}"
            }
          }
        }
      };
      console.log('   ✅ Calendar event will be updated automatically via database trigger');
      break;

    default:
      console.log(`   ⚠️  Unknown operation: ${operation}, skipping conversion`);
      return null;
  }

  return supabaseNode;
}

// Convert all Google Sheets nodes
function convertSheetsNodes(workflow) {
  const nodes = workflow.nodes;
  const convertedNodes = [];
  const removedNodeIds = [];

  nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.googleSheetsTool') {
      const supabaseNode = convertSheetsNodeToSupabase(node, workflow);
      if (supabaseNode) {
        convertedNodes.push(supabaseNode);
        removedNodeIds.push(node.id);
        console.log(`   ✅ Converted to: ${supabaseNode.name}`);
      }
    }
  });

  // Remove old Sheets nodes and add Supabase nodes
  workflow.nodes = nodes.filter(node => node.type !== 'n8n-nodes-base.googleSheetsTool');
  workflow.nodes.push(...convertedNodes);

  console.log(`\n📊 Summary:`);
  console.log(`   - Converted ${convertedNodes.length} Google Sheets nodes to Supabase`);
  console.log(`   - Removed ${removedNodeIds.length} Google Sheets nodes`);

  return { convertedNodes, removedNodeIds };
}

// Update agent tool connections
function updateAgentConnections(workflow, convertedNodes) {
  const connections = workflow.connections;
  const nodeMap = new Map();
  
  // Map old node names to new Supabase node names
  const nameMapping = {
    'Read Rows': 'Read Appointments (Supabase)',
    'Add Rows': 'Add Appointments (Supabase)',
    'Update Rows': 'Update Appointments (Supabase)',
    'Read Therapists': 'Read Therapists (Supabase)',
    'Write to Therapist Sheet': 'Write to Therapist Sheet (Supabase)'
  };

  convertedNodes.forEach(node => {
    // Find matching old name
    for (const [oldName, newName] of Object.entries(nameMapping)) {
      if (node.name.includes(oldName.replace('Sheet', '').replace('Rows', 'Appointments'))) {
        nodeMap.set(oldName, node.name);
        break;
      }
    }
  });

  // Update Sheets Agent tool connections
  Object.keys(connections).forEach(nodeName => {
    if (nodeName.includes('Sheets Agent') || nodeName === 'Sheets Agent') {
      const agentConnections = connections[nodeName];
      if (agentConnections && agentConnections.ai_tool) {
        agentConnections.ai_tool.forEach(toolConnections => {
          toolConnections.forEach(conn => {
            if (nameMapping[conn.node]) {
              conn.node = nodeMap.get(nameMapping[conn.node]) || conn.node;
            }
          });
        });
      }
    }
  });

  console.log('\n🔗 Updated agent tool connections');
}

// Main execution
function main() {
  console.log('🚀 Starting Google Sheets to Supabase conversion...\n');
  
  if (!fs.existsSync(WORKFLOW_FILE)) {
    console.error(`❌ Workflow file not found: ${WORKFLOW_FILE}`);
    process.exit(1);
  }

  if (SUPABASE_CREDENTIAL_ID === 'YOUR_SUPABASE_CREDENTIAL_ID') {
    console.warn('⚠️  WARNING: Please update SUPABASE_CREDENTIAL_ID in the script!\n');
  }

  console.log(`📖 Reading workflow from: ${WORKFLOW_FILE}`);
  const workflow = readWorkflow();

  console.log('🔧 Converting Google Sheets nodes to Supabase...\n');
  const { convertedNodes } = convertSheetsNodes(workflow);

  console.log('\n🔗 Updating connections...');
  updateAgentConnections(workflow, convertedNodes);

  console.log(`\n💾 Saving updated workflow...`);
  writeWorkflow(workflow);

  console.log('\n✨ Conversion complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Create therapists table in Supabase (if using Read Therapists)');
  console.log('   2. Update SUPABASE_CREDENTIAL_ID in each Supabase node');
  console.log('   3. Update Sheets Agent prompt to reference Supabase instead of Google Sheets');
  console.log('   4. Test the workflow with a sample booking');
  console.log('   5. Verify data appears in Supabase appointments table');
  console.log('   6. Verify calendar events are created automatically (check calendar_events table)\n');
  
  console.log('📝 Important Notes:');
  console.log('   - Appointments are stored in appointments table (source of truth)');
  console.log('   - Calendar events are created automatically via database triggers');
  console.log('   - Schema fields: scheduled_at, status, source, calendar_event_id');
  console.log('   - Client info (name, email, phone, service_type, notes, therapist_name) stored in metadata JSONB');
  console.log('   - Run APPOINTMENTS_TABLE_SCHEMA.sql first to set up triggers');
  console.log('   - Update Sheets Agent system message to use Supabase terminology\n');
}

if (require.main === module) {
  main();
}

module.exports = { convertSheetsNodes, convertSheetsNodeToSupabase };
