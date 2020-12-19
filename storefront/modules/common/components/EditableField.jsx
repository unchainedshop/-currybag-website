import COUNTRIES from '../data/countries-list';

const EditableField = ({
  register,
  name,
  value,
  isEditing,
  type = 'text',
  required = false,
}) => {
  if (type === 'country') {
    return isEditing ? (
      <select
        className="form-control"
        name={name}
        defaultValue={value}
        ref={register({ required })}
      >
        <option value="">Please Select...</option>
        {COUNTRIES.map((c, i) => (
          <option value={c.code} key={i}>
            {c.name}
          </option>
        ))}
      </select>
    ) : (
      <div>{COUNTRIES.filter((c) => c.code === value)[0]?.name}</div>
    );
  }
  return isEditing ? (
    <input
      className="form-control"
      type={type}
      name={name}
      defaultValue={value}
      ref={register({ required })}
    />
  ) : (
    <div>{value}</div>
  );
};

export default EditableField;
