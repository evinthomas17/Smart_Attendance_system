function StudentFilters({
  departments,
  courses,
  semesters,
  classes,
  values,
  loading,
  onChange,
}) {
  return (
    <section className="card student-filters" aria-label="Academic filters">
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

        <div className="form-group">
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            className="filter-input"
            value={values.semester}
            disabled={!values.course || loading.semesters}
            onChange={(event) => onChange("semester", event.target.value)}
          >
            <option value="">{loading.semesters ? "Loading semesters..." : "Select semester"}</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="division">Division</label>
          <select
            id="division"
            className="filter-input"
            value={values.classId}
            disabled={!values.semester || loading.classes}
            onChange={(event) => onChange("classId", event.target.value)}
          >
            <option value="">{loading.classes ? "Loading divisions..." : "Select division"}</option>
            {classes.map((academicClass) => (
              <option key={academicClass.id} value={academicClass.id}>
                {academicClass.division}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export default StudentFilters;