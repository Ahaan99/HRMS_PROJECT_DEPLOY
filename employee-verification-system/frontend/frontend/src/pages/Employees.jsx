import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

function Employees() {

  const [employees, setEmployees] = useState([]);

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [department, setDepartment] = useState("");

  const [designation, setDesignation] = useState("");

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {

    try {

      const res = await API.get("/employees");

      setEmployees(res.data);

    } catch (error) {

      console.log("Employee Fetch Error", error);
    }
  };

  const addEmployee = async () => {

    if (
      !name ||
      !email ||
      !phone ||
      !department ||
      !designation
    ) {
      alert("Please fill all fields");
      return;
    }

    try {

      await API.post("/add-employee", {
        name,
        email,
        phone,
        department,
        designation,
      });

      alert("Employee Added Successfully");

      setName("");
      setEmail("");
      setPhone("");
      setDepartment("");
      setDesignation("");

      fetchEmployees();

    } catch (error) {

      console.log(error);

      alert("Add Employee Failed");
    }
  };

  const editEmployee = (emp) => {

    setEditId(emp.id);

    setName(emp.name);

    setEmail(emp.email);

    setPhone(emp.phone);

    setDepartment(emp.department);

    setDesignation(emp.designation);
  };

  const updateEmployee = async () => {

    try {

      await API.put(`/employees/${editId}`, {
        name,
        email,
        phone,
        department,
        designation,
      });

      alert("Employee Updated Successfully");

      setEditId(null);

      setName("");
      setEmail("");
      setPhone("");
      setDepartment("");
      setDesignation("");

      fetchEmployees();

    } catch (error) {

      console.log(error);

      alert("Update Failed");
    }
  };

  const deleteEmployee = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmDelete) {
      return;
    }

    try {

      await API.delete(`/employees/${id}`);

      alert("Employee Deleted Successfully");

      fetchEmployees();

    } catch (error) {

      console.log(error);

      alert("Delete Failed");
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">

        <h2>Employee Management</h2>

        <div className="form-container">

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <input
            type="text"
            placeholder="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />

          {editId ? (

            <button onClick={updateEmployee}>
              Update Employee
            </button>

          ) : (

            <button onClick={addEmployee}>
              Add Employee
            </button>

          )}

        </div>

        <div className="table-wrap"><table>

          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {employees.map((emp) => (

              <tr key={emp.id}>

                <td>{emp.id}</td>

                <td>{emp.name}</td>

                <td>{emp.email}</td>

                <td>{emp.phone}</td>

                <td>{emp.department}</td>

                <td>{emp.designation}</td>

                <td>

                  <button onClick={() => editEmployee(emp)}>
                    Edit
                  </button>

                  <button
                    className="btn-danger" onClick={() => deleteEmployee(emp.id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table></div>

      </div>
    </>
  );
}

export default Employees;