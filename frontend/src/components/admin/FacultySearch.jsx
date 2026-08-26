function FacultySearch({ value, disabled, onChange }) {
  return (
    <div className="search-wrapper">
      <input
        className="search-box"
        type="search"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search faculty by name or email..."
        aria-label="Search faculty"
      />
    </div>
  );
}

export default FacultySearch;