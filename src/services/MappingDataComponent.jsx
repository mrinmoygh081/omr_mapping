// MappingDataComponent.js

import React from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { BsCheck, BsCheckAll } from "react-icons/bs";

function MappingDataComponent({
  boxes,
  selectedBoxIndex,
  selectedchildBoxIndex,
  handleSelectBoxClick,
  handleSelectChildBoxClick,
}) {
  return (
    <div
      className="mapping_data"
      style={{
        "max-height": "500px" /* Set a fixed height for the container */,
        "overflow-y": "auto",
      }}
    >
      <ul>
        {boxes &&
          boxes.map((box, index) => (
            <li key={index}>
              <p
                onClick={() => handleSelectBoxClick(index)}
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
                {box?.mode === "parent" ? (
                  box?.isOpen ? (
                    <>
                      <FaMinus className="plusminus" />{" "}
                      <BsCheckAll className="type" /> <span>{box?.name}</span>
                      <span>{index + 1}</span>
                    </>
                  ) : (
                    <>
                      <FaPlus className="plusminus" />{" "}
                      <BsCheckAll className="type" /> <span>{box?.name}</span>
                      <span>{index + 1}</span>
                    </>
                  )
                ) : (
                  <span>
                    <BsCheck className="type" /> <span>{box?.name}</span>
                    <span>C {index + 1}</span>
                  </span>
                )}
              </p>
              {box?.mode === "parent" && box.isOpen && (
                <ul className="drop">
                  {/* <p>Child Boxes:</p> */}
                  {box.children.map((childBox, childIndex) => (
                    <li key={childIndex}>
                      <p
                        onClick={() =>
                          handleSelectChildBoxClick(childIndex, index)
                        }
                        style={{
                          border:
                            selectedchildBoxIndex === childIndex
                              ? "2px solid green"
                              : "1px solid black",
                          margin: "5px",
                          padding: "5px",
                          display: "inline-block",
                        }}
                      >
                        childBox.name{childIndex + 1}
                        <br />
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default MappingDataComponent;
