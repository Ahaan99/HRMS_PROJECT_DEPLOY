from pydantic import BaseModel

class BackgroundVerificationCreate(BaseModel):

    employee_id: int
    previous_company: str
    hr_email: str
    feedback: str
    rehire_eligible: str
    criminal_record: str