function StudentTable({ students, loading, onEdit, onDelete }) {
  if (loading) return <p className="student-message">Loading students...</p>;
  if (!students.length) return <p className="student-message">No students registered for this class.</p>;

  return (
    <div className="table-container">
      <table className="student-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Class Data</th>
            <th>Face Data</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.student_id}</td>
              <td>{student.full_name}</td>
              <td>{student.email}</td>
              <td>{student.phone || "—"}</td>
              <td>{student.class_code}</td>
              <td>{student.face_data_available ? "Available" : "Not Available"}</td>
              <td className="action-buttons">
                <button type="button" className="edit-button" onClick={() => onEdit(student.id)}>
                  Edit
                </button>
                <button type="button" className="delete-button" onClick={() => onDelete(student)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;