import React from "react";
import { MdDelete } from "react-icons/md";

function DeleteButton({ onClick, disabled }) {
  return (
    <button
      className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
      title="Delete"
      onClick={onClick}
      disabled={disabled}
    >
      <MdDelete />
    </button>
  );
}

export default DeleteButton;
