from pydantic import BaseModel

class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: str
    department: str
    designation: str


class EmployeeUpdate(BaseModel):
    name: str
    email: str
    phone: str
    department: str
    designation: str