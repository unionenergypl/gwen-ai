require("dotenv").config();

const { triggerN8n } = require("./services/n8nClient");

const payload = {
  eventType: "GWEN_ENQUIRY_TEST",
  message: "SandboxTest",
  sessionId: "sandbox-n8n-direct-test",
  timestamp: new Date().toISOString(),
  source: "sandbox_direct_test"
};

triggerN8n(payload)
  .then(result => {
    console.log("N8N WEBHOOK TEST:", result);
  })
  .catch(error => {
    console.error("N8N WEBHOOK TEST FAILED:", error.message);
    process.exit(1);
  });
