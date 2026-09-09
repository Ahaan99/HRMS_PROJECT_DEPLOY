from app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.employee import Employee

router = APIRouter()

@router.post("/add-employee")
def add_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db)
):

    existing_employee = db.query(Employee).filter(
        Employee.email == employee.email
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Employee already exists"
        )

    new_employee = Employee(
        name=employee.name,
        email=employee.email,
        phone=employee.phone,
        department=employee.department,
        designation=employee.designation
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return {
        "message": "Employee Added Successfully",
        "employee_id": new_employee.id
    }

@router.get("/employees")
def get_employees(
    db: Session = Depends(get_db)
):

    employees = db.query(Employee).all()

    return employees


@router.get("/employees/{employee_id}")

def get_employee(employee_id: int, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:

        return {"message": "Employee Not Found"}

    return employee

# Delete Employee

@router.delete("/employees/{employee_id}")

def delete_employee(employee_id: int, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:

        return {"message": "Employee Not Found"}

    db.delete(employee)

    db.commit()

    return {"message": "Employee Deleted Successfully"}

@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        return {"message": "Employee Not Found"}

    employee.name = employee_data.name
    employee.email = employee_data.email
    employee.phone = employee_data.phone
    employee.department = employee_data.department
    employee.designation = employee_data.designation

    db.commit()

    return {"message": "Employee Updated Successfully"}