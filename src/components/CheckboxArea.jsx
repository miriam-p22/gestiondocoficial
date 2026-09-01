import React from "react";
import "../styles/CheckboxArea.css";

const CheckboxArea = ({ areaName, isChecked, onChange }) => {
  return (
    <label className="checkbox-item">
      <input
        type="checkbox"
        name="area"
        value={areaName}
        checked={isChecked}
        onChange={onChange}
      />
      {areaName}
    </label>
  );
};

export default CheckboxArea;
