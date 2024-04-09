import React, { useState } from "react";
import { LuZoomIn, LuZoomOut } from "react-icons/lu";

function ZoomControls({ onZoomIn, onZoomOut }) {
  const [iconColor, setIconColor] = useState("");
  const [iconColorzo, setIconColorzo] = useState("");
  const handleMouseOver = () => {
    setIconColor("yellow");
  };

  const handleMouseOut = () => {
    setIconColor("");
  };
  const handleMouseOverzoomout = () => {
    setIconColorzo("yellow");
  };
  const handleMouseOutzoomout = () => {
    setIconColorzo("");
  };

  return (
    <>
      <button
        className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
        title="ZoomIn"
        name="ZoomIn"
        // onMouseOver={onZoomIn}
        // onMouseOut={onZoomOut}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={onZoomIn}
      >
        <LuZoomIn style={{ color: iconColor }} />
      </button>
      <button
        className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
        title="ZoomOut"
        name="ZoomOut"
        // onMouseOver={onZoomOut}
        // onMouseOut={onZoomOut}
        onMouseOver={handleMouseOverzoomout}
        onMouseOut={handleMouseOutzoomout}
        onClick={onZoomOut}
      >
        <LuZoomOut style={{ color: iconColorzo }} />
      </button>
    </>
  );
}

export default ZoomControls;
