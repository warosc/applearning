from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class LogEventRequest(BaseModel):
    event_type: str
    details: Optional[Any] = None


class ExamEventSchema(BaseModel):
    id: str
    attempt_id: str
    event_type: str
    details: Optional[Any] = None
    occurred_at: datetime

    model_config = {"from_attributes": True}
