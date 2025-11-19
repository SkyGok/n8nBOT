#!/usr/bin/env node

/**
 * Script to add Supabase nodes to n8n WhatsApp Booking Workflow
 * 
 * Usage: node update-workflow-with-supabase.js
 * 
 * This script:
 * 1. Reads the existing workflow JSON
 * 2. Adds Supabase nodes for:
 *    - Storing WhatsApp messages
 *    - Storing customers
 *    - Storing appointments
 *    - Syncing calendar events
 *    - Updating appointment status
 * 3. Updates node connections
 * 4. Saves the updated workflow
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WORKFLOW_FILE = path.join(__dirname, 'Demo Gokhan.json');
const OUTPUT_FILE = path.join(__dirname, 'Demo Gokhan - With Supabase.json');
const SUPABASE_CREDENTIAL_ID = 'YOUR_SUPABASE_CREDENTIAL_ID'; // Replace with your actual credential ID

// Generate UUID for nodes (simple implementation)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Read existing workflow
function readWorkflow() {
  try {
    const data = fs.readFileSync(WORKFLOW_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading workflow file:', error.message);
    process.exit(1);
  }
}

// Write updated workflow
function writeWorkflow(workflow) {
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2), 'utf8');
    console.log(`✅ Updated workflow saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error writing workflow file:', error.message);
    process.exit(1);
  }
}

// Find node by name
function findNode(workflow, nodeName) {
  return workflow.nodes.find(node => node.name === nodeName);
}

// Find node ID by name
function findNodeId(workflow, nodeName) {
  const node = findNode(workflow, nodeName);
  return node ? node.id : null;
}

// Add Supabase nodes to workflow
function addSupabaseNodes(workflow) {
  const nodes = workflow.nodes;
  const connections = workflow.connections;
  
  // Find reference positions from existing nodes
  const whatsappTrigger = findNode(workflow, 'WhatsApp Trigger');
  const messageRouter = findNode(workflow, 'Message Router');
  const calendarCreate = findNode(workflow, 'Calendar Create');
  const addRows = findNode(workflow, 'Add Rows');
  const updateRows = findNode(workflow, 'Update Rows');
  const mainAgent = findNode(workflow, 'Main Agent');
  
  if (!whatsappTrigger || !messageRouter || !calendarCreate || !addRows) {
    console.error('❌ Required nodes not found in workflow');
    process.exit(1);
  }

  // Calculate positions (spread nodes horizontally)
  const baseX = whatsappTrigger.position[0];
  const baseY = whatsappTrigger.position[1];
  
  // Node 1: Store WhatsApp Message (right after WhatsApp Trigger)
  const storeWhatsAppMessage = {
    parameters: {
      operation: 'insert',
      table: 'whatsapp_messages',
      columns: {
        mappingMode: 'defineBelow',
        value: {
          user_id: null,
          conversation_id: "={{ $json.messages[0].from }}",
          message_id: "={{ $json.messages[0].id }}",
          phone_number: "={{ $json.contacts[0].wa_id }}",
          contact_name: "={{ $json.contacts[0].profile?.name || null }}",
          direction: 'inbound',
          message_type: "={{ $json.messages[0].type || 'text' }}",
          content: "={{ $json.messages[0].text?.body || $json.messages[0].audio?.id || '' }}",
          timestamp: "={{ $json.messages[0].timestamp }}",
          status: 'read',
          metadata: "={{ JSON.stringify($json) }}"
        }
      }
    },
    id: generateUUID(),
    name: 'Store WhatsApp Message (Supabase)',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: [baseX + 200, baseY],
    credentials: {
      supabaseApi: {
        id: SUPABASE_CREDENTIAL_ID,
        name: 'Supabase Production'
      }
    }
  };

  // Node 2: Store Customer (after Main Agent collects info)
  const storeCustomer = {
    parameters: {
      operation: 'upsert',
      table: 'customers',
      matchColumns: ['phone_number'],
      columns: {
        mappingMode: 'defineBelow',
        value: {
          user_id: null,
          phone_number: "={{ $('WhatsApp Trigger').item.json.contacts[0].wa_id }}",
          email: "={{ $fromAI('email', 'the email address') }}",
          full_name: "={{ $fromAI('name', 'the client full name') }}",
          tags: ['whatsapp', 'spa-booking']
        }
      }
    },
    id: generateUUID(),
    name: 'Store Customer (Supabase)',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: [baseX + 400, baseY + 200],
    credentials: {
      supabaseApi: {
        id: SUPABASE_CREDENTIAL_ID,
        name: 'Supabase Production'
      }
    }
  };

  // Node 3: Sync Calendar Event to Supabase (after Calendar Create)
  // THIS IS THE PRIMARY DATA STORAGE - Calendar events are the source of truth
  // Appointments will be derived from calendar events by the calendar sync workflow
  const syncCalendarEvent = {
    parameters: {
      operation: 'insert',
      table: 'calendar_events',
      columns: {
        mappingMode: 'defineBelow',
        value: {
          user_id: null,
          google_event_id: "={{ $('Calendar Create').item.json.id }}",
          title: "={{ $fromAI('title') || $('Calendar Create').item.json.summary }}",
          description: "={{ `Service: ${$fromAI('service_type')}, Client: ${$fromAI('name')}, Therapist: ${$fromAI('therapist_name')}` }}",
          start_time: "={{ $fromAI('start') || $('Calendar Create').item.json.start.dateTime }}",
          end_time: "={{ $fromAI('end') || $('Calendar Create').item.json.end.dateTime }}",
          all_day: false,
          timezone: 'Europe/Riga',
          status: 'confirmed',
          metadata: {
            source: 'whatsapp',
            service_type: "={{ $fromAI('service_type') }}",
            client_name: "={{ $fromAI('name') }}",
            client_email: "={{ $fromAI('email') }}",
            client_phone: "={{ $fromAI('phone') }}",
            therapist_name: "={{ $fromAI('therapist_name') }}",
            notes: "={{ $fromAI('notes') }}"
          }
        }
      }
    },
    id: generateUUID(),
    name: 'Sync Calendar Event (Supabase)',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: [calendarCreate.position[0] + 150, calendarCreate.position[1]],
    credentials: {
      supabaseApi: {
        id: SUPABASE_CREDENTIAL_ID,
        name: 'Supabase Production'
      }
    }
  };

  // Node 4: Store Appointment in Supabase (OPTIONAL - only if you want direct storage)
  // NOTE: Better approach is to let calendar sync workflow handle this
  // This node is kept for backward compatibility but commented out by default
  // Uncomment if you want direct appointment storage instead of deriving from calendar events
  /*
  const storeAppointment = {
    parameters: {
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
            client_name: "={{ $fromAI('name') }}",
            client_email: "={{ $fromAI('email') }}",
            client_phone: "={{ $fromAI('phone') }}",
            service_type: "={{ $fromAI('service_type') }}",
            therapist_name: "={{ $fromAI('therapist_name') }}",
            notes: "={{ $fromAI('notes') }}"
          }
        }
      }
    },
    id: generateUUID(),
    name: 'Store Appointment (Supabase)',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: [addRows.position[0] - 200, addRows.position[1]],
    credentials: {
      supabaseApi: {
        id: SUPABASE_CREDENTIAL_ID,
        name: 'Supabase Production'
      }
    }
  };
  */

  // Node 5: Update Calendar Event Status (for cancellations)
  // Updates calendar event status, which will sync to appointments via calendar sync workflow
  const updateCalendarEventStatus = {
    parameters: {
      operation: 'update',
      table: 'calendar_events',
      filters: {
        filters: [
          {
            keyName: 'google_event_id',
            condition: 'equal',
            keyValue: "={{ $fromAI('calendar_event_id') || $('Calendar Delete').item.json.id }}"
          }
        ]
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          status: 'cancelled'
        }
      }
    },
    id: generateUUID(),
    name: 'Update Calendar Event Status (Supabase)',
    type: 'n8n-nodes-base.supabase',
    typeVersion: 1,
    position: [updateRows.position[0] + 200, updateRows.position[1]],
    credentials: {
      supabaseApi: {
        id: SUPABASE_CREDENTIAL_ID,
        name: 'Supabase Production'
      }
    }
  };

  // Add nodes to workflow
  // NOTE: We sync calendar events, not appointments directly
  // The calendar sync workflow will create appointments from calendar events
  nodes.push(
    storeWhatsAppMessage,
    storeCustomer,
    syncCalendarEvent,
    updateCalendarEventStatus
  );

  // Update connections
  // 1. WhatsApp Trigger -> Store WhatsApp Message -> Message Router
  if (!connections['WhatsApp Trigger']) {
    connections['WhatsApp Trigger'] = { main: [[]] };
  }
  connections['WhatsApp Trigger'].main[0].push({
    node: storeWhatsAppMessage.name,
    type: 'main',
    index: 0
  });

  // Add Store WhatsApp Message -> Message Router connection
  if (!connections[storeWhatsAppMessage.name]) {
    connections[storeWhatsAppMessage.name] = { main: [[]] };
  }
  connections[storeWhatsAppMessage.name].main[0].push({
    node: 'Message Router',
    type: 'main',
    index: 0
  });

  // 2. Calendar Create -> Sync Calendar Event -> Store Appointment -> Add Rows
  if (!connections['Calendar Create']) {
    connections['Calendar Create'] = { main: [[]] };
  }
  // Check if Calendar Create already has connections
  if (connections['Calendar Create'].main[0].length === 0) {
    connections['Calendar Create'].main[0].push({
      node: syncCalendarEvent.name,
      type: 'main',
      index: 0
    });
  } else {
    // Add parallel connection
    connections['Calendar Create'].main[0].push({
      node: syncCalendarEvent.name,
      type: 'main',
      index: 0
    });
  }

  // Sync Calendar Event -> Add Rows (keep existing Google Sheets flow)
  // Calendar events are synced to Supabase, and the calendar sync workflow
  // will create appointments from calendar events automatically
  if (!connections[syncCalendarEvent.name]) {
    connections[syncCalendarEvent.name] = { main: [[]] };
  }
  connections[syncCalendarEvent.name].main[0].push({
    node: 'Add Rows',
    type: 'main',
    index: 0
  });

  // 3. Update Rows -> Update Calendar Event Status (for cancellations)
  if (updateRows && connections['Update Rows']) {
    if (!connections[updateCalendarEventStatus.name]) {
      connections[updateCalendarEventStatus.name] = { main: [[]] };
    }
    // Add parallel connection from Update Rows
    if (connections['Update Rows'].main[0].length > 0) {
      connections['Update Rows'].main[0].push({
        node: updateCalendarEventStatus.name,
        type: 'main',
        index: 0
      });
    }
  }

  // 4. Store Customer - connect from Main Agent when email/name is collected
  // This is trickier - you might want to add this manually or use a Code node
  // For now, we'll add it but note that connection needs manual adjustment
  console.log('⚠️  Note: Store Customer node needs manual connection from Main Agent');

  console.log('✅ Added 4 Supabase nodes to workflow:');
  console.log('   1. Store WhatsApp Message (Supabase)');
  console.log('   2. Store Customer (Supabase)');
  console.log('   3. Sync Calendar Event (Supabase) ← PRIMARY DATA STORAGE');
  console.log('   4. Update Calendar Event Status (Supabase)');
  console.log('');
  console.log('📋 IMPORTANT: Calendar Events are the source of truth!');
  console.log('   - Appointments will be created from calendar events');
  console.log('   - Use the calendar sync workflow to sync calendar_events → appointments');
  console.log('   - This ensures single source of truth (Google Calendar → Supabase calendar_events → appointments)');
}

// Main execution
function main() {
  console.log('🚀 Starting workflow update...\n');
  
  // Check if workflow file exists
  if (!fs.existsSync(WORKFLOW_FILE)) {
    console.error(`❌ Workflow file not found: ${WORKFLOW_FILE}`);
    process.exit(1);
  }

  // Read workflow
  console.log(`📖 Reading workflow from: ${WORKFLOW_FILE}`);
  const workflow = readWorkflow();
  
  // Check if Supabase credential ID is set
  if (SUPABASE_CREDENTIAL_ID === 'YOUR_SUPABASE_CREDENTIAL_ID') {
    console.warn('\n⚠️  WARNING: Please update SUPABASE_CREDENTIAL_ID in the script!');
    console.warn('   You can find your credential ID in n8n after creating Supabase credentials.\n');
  }

  // Add Supabase nodes
  console.log('🔧 Adding Supabase nodes...\n');
  addSupabaseNodes(workflow);

  // Write updated workflow
  console.log(`\n💾 Saving updated workflow...`);
  writeWorkflow(workflow);

  console.log('\n✨ Workflow update complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Import the new workflow file into n8n');
  console.log('   2. Update SUPABASE_CREDENTIAL_ID in each Supabase node');
  console.log('   3. Manually connect "Store Customer" node from Main Agent');
  console.log('   4. Make sure calendar sync workflow is running (n8n-calendar-supabase-sync-workflow.json)');
  console.log('   5. Test the workflow with a sample booking');
  console.log('   6. Verify calendar events appear in Supabase calendar_events table');
  console.log('   7. Verify appointments are created from calendar events (via sync workflow)\n');
}

// Run script
if (require.main === module) {
  main();
}

module.exports = { addSupabaseNodes, readWorkflow, writeWorkflow };

