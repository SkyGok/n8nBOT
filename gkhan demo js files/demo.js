{
  "name": "Supabase AI Booking Agent",
  "nodes": [
    {
      "parameters": {
        "model": {
          "__rl": true,
          "value": "gpt-4o-mini",
          "mode": "list",
          "cachedResultName": "gpt-4o-mini"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [
        380,
        460
      ],
      "id": "2513ec47-d373-450d-9363-cbcd3ad90f8d",
      "name": "OpenAI Chat Model"
    },
    {
      "parameters": {
        "operation": "getAll",
        "tableId": "therapists",
        "returnAll": true,
        "options": {}
      },
      "type": "n8n-nodes-base.supabaseTool",
      "typeVersion": 1,
      "position": [
        940,
        600
      ],
      "id": "ae73611d-fce2-4ef7-a30d-b81aa0781537",
      "name": "tool_get_therapists",
      "notes": "Reads available therapists"
    },
    {
      "parameters": {
        "tableId": "appointments",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "scheduled_at",
              "fieldValue": "={{ $fromAI(\"appointment_date\", \"the appointment date and time, format: YYYY-MM-DD HH:mm\") }}"
            },
            {
              "fieldId": "client_name",
              "fieldValue": "={{ $fromAI(\"name\", \"the client's full name\") }}"
            },
            {
              "fieldId": "client_phone",
              "fieldValue": "={{ $fromAI(\"phone\", \"the confirmed phone number, no spaces, no '+' sign\") }}"
            },
            {
              "fieldId": "client_email",
              "fieldValue": "={{ $fromAI(\"email\", \"the client's email address\") }}"
            },
            {
              "fieldId": "therapist_name",
              "fieldValue": "={{ $fromAI(\"therapist_name\", \"the name of the therapist\") }}"
            },
            {
              "fieldId": "service_type",
              "fieldValue": "={{ $fromAI(\"service_type\", \"the type of service\") }}"
            },
            {
              "fieldId": "status",
              "fieldValue": "confirmed"
            },
            {
              "fieldId": "notes",
              "fieldValue": "={{ $fromAI(\"notes\", \"any additional notes\") }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabaseTool",
      "typeVersion": 1,
      "position": [
        1080,
        600
      ],
      "id": "58df9029-32c1-476b-8569-5e41c6942af9",
      "name": "tool_create_appointment"
    },
    {
      "parameters": {
        "operation": "getAll",
        "tableId": "appointments",
        "returnAll": true,
        "options": {}
      },
      "type": "n8n-nodes-base.supabaseTool",
      "typeVersion": 1,
      "position": [
        1220,
        600
      ],
      "id": "47f8e174-f73d-4126-a5c4-2ede4b3d9e2e",
      "name": "tool_check_appointments",
      "notes": "Used to check history or overlaps"
    },
    {
      "parameters": {
        "operation": "update",
        "tableId": "appointments",
        "updateKey": "client_email",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "client_email",
              "fieldValue": "={{ $fromAI(\"email\", \"the email of the appointment to update\") }}"
            },
            {
              "fieldId": "status",
              "fieldValue": "={{ $fromAI(\"status\", \"the new status (e.g., cancelled)\") }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabaseTool",
      "typeVersion": 1,
      "position": [
        1360,
        600
      ],
      "id": "4e812b1f-9b1d-4b1d-9393-d795939a4a6b",
      "name": "tool_update_appointment"
    },
    {
      "parameters": {
        "toolDescription": "Use these tools to manage spa appointments and therapists via Supabase.",
        "text": "={{ $fromAI('User_Message', `The user's latest message`, 'string') }}",
        "options": {
          "systemMessage": "You are a Spa Booking Assistant backed by a Supabase database.\n\n### YOUR TOOLS:\n1. **tool_get_therapists**: Fetch the list of active therapists and their working hours.\n2. **tool_check_appointments**: Search existing appointments (use this to check for time conflicts or find a client's booking history).\n3. **tool_create_appointment**: Create a new confirmed booking. REQUIRES: Name, Phone, Date, Therapist, Service.\n4. **tool_update_appointment**: Update the status of a booking (e.g., to 'cancelled').\n\n### RULES:\n- **Availability Check:** Before creating an appointment, ALWAYS check `tool_check_appointments` for that therapist at that time to ensure no overlap.\n- **Therapist Names:** Use `tool_get_therapists` to get the exact spelling of therapist names.\n- **Date Format:** Always convert dates to YYYY-MM-DD HH:mm format.\n- **Phone:** Store phones without spaces or '+' signs.\n\nIf the user asks to book, verify the therapist is free first. If successful, confirm the booking details to the user."
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agentTool",
      "typeVersion": 2.2,
      "position": [
        700,
        460
      ],
      "id": "bc6c637c-d38f-4595-8758-f0f3306f6d3b",
      "name": "Supabase Agent"
    }
  ],
  "connections": {
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "Supabase Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "tool_get_therapists": {
      "ai_tool": [
        [
          {
            "node": "Supabase Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "tool_create_appointment": {
      "ai_tool": [
        [
          {
            "node": "Supabase Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "tool_check_appointments": {
      "ai_tool": [
        [
          {
            "node": "Supabase Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "tool_update_appointment": {
      "ai_tool": [
        [
          {
            "node": "Supabase Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    }
  }
}