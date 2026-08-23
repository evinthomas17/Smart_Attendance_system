function StudentSearch({ value, disabled, onChange }) {
  return (
    <div className="search-wrapper">
      <input
        className="search-box"
        type="search"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search student by ID, name or email..."
        aria-label="Search students"
      />
    </div>
  );
}

export default StudentSearch;