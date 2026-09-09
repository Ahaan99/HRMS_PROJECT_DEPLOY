from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: int
    employee_id: int
    document_name: str
    file_path: str
    status: str