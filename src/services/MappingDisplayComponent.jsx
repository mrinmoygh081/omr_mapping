// MappingDisplayComponent.js

import React from "react";

function MappingDisplayComponent({
  boxes,
  selectedBoxIndex,
  handleSelectBoxClick,
  handleMouseDownOnBox,
  handleMouseUpOnBox,
  handleMouseMoveOnBox,
}) {
  return (
    <div>
      {boxes.map((box, index) => (
        <div
          key={index}
          onClick={() => handleSelectBoxClick(index)}
          onMouseDown={(event) => handleMouseDownOnBox(event, index)}
          onMouseUp={handleMouseUpOnBox}
          onMouseMove={handleMouseMoveOnBox}
          style={{
            border:
              selectedBoxIndex === index
                ? "2px solid orange"
                : "1px solid black",
            margin: "5px",
            padding: "5px",
            display: "inline-block",
          }}
        >
          <p>
            Box {index + 1} ID: {box.id}
            <br />
            Box {index + 1} Name: {box.name}
            <br />
            Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
            {box.end.x}, {box.end.y})
          </p>
          {box.mode === "parent" && (
            <div>
              <p>Child Boxes:</p>
              {box.children.map((childBox, childIndex) => (
                <p key={childIndex}>
                  Box {childIndex + 1} ID: {childBox.id}
                  <br />
                  Child Box {childIndex + 1} Coordinates: ({childBox.start.x},{" "}
                  {childBox.start.y}) - ({childBox.end.x}, {childBox.end.y})
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MappingDisplayComponent;
