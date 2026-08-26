function FacultyFilters({
  departments,
  courses,
  values,
  loading,
  onChange,
}) {
  return (
    <section className="card student-filters" aria-label="Faculty academic filters">
      <h2 className="card-title">Select Faculty Details</h2>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            className="filter-input"
            value={values.department}
            onChange={(event) => onChange("department", event.target.value)}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="course">Course</label>
          <select
            id="course"
            className="filter-input"
            value={values.course}
            disabled={!values.department || loading.courses}
            onChange={(event) => onChange("course", event.target.value)}
          >
            <option value="">{loading.courses ? "Loading courses..." : "Select course"}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export default FacultyFilters;