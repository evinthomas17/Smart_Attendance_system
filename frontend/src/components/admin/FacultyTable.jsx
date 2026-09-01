function FacultyTable({ faculty, loading, onDelete, onEdit }) {
  if (loading) return <p className="student-message">Loading faculty...</p>;
  if (!faculty.length) return <p className="student-message">No faculty registered for this course.</p>;

  return (
    <div className="table-container">
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Teaching Course</th>
            <th>Class Teacher</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {faculty.map((member) => (
            <tr key={member.id}>
              <td>{member.full_name}</td>
              <td>{member.email}</td>
              <td>{member.phone || "—"}</td>
              <td>
                {member.teaching_courses && member.teaching_courses.length > 0
                  ? member.teaching_courses.map(c => c.name).join(", ")
                  : "—"}
              </td>
              <td>
                {member.class_teacher
                  ? member.class_teacher.display || "Yes"
                  : "No"}
              </td>
              <td className="action-buttons">
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => onEdit(member)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => onDelete(member)}
                >
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

export default FacultyTable;