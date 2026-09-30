import pytest
from fastapi.testclient import TestClient

# Assuming main app and models are accessible
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "HelpDesk API is running"}

# Further tests would involve:
# 1. test_user_registration()
# 2. test_ticket_fsm_transition_prevent_closed_reopen() -> testing business logic from Chapter 2.5
# 3. test_sla_escalation_logic() -> testing business logic from Chapter 2.5
