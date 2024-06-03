// ButtonListComponent.js

import React, { useState } from "react";
import { PiCursorBold } from "react-icons/pi";
import CopyComponent from "./CopyComponent";
import ZoomControls from "./ZoomControls";
import DeleteButton from "./DeleteButton";
import { RiDragDropFill } from "react-icons/ri";
import { ImUndo2 } from "react-icons/im";
import { IoCheckmarkSharp } from "react-icons/io5";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

function ButtonListComponent({
  handleMove,
  toggleDrawingMode,
  toggleDrawingModeparent,
  toggleDrawingModechild,
  toggleDrawingModeAnchor,
  toggleDrawingModeRollNo,
  toggleDrawingModeQuestionpaper,
  drawingMode,
  drawingModeparent,
  drawingModechild,
  drawingModeRollNo,
  drawingModeAnchor,
  drawingModeQuestionpaper,
  handleCopyBoxClick,
  handlePasteBoxClick,
  selectedBoxIndex,
  selectedchildBoxIndex,
  boxes,
  copiedBox,
  isBoxCopied,
  handleZoomIn,
  handleZoomOut,
  handleDeleteSelectedBox,
  boxNameInput,
  setBoxNameInput,
  drMode,
  toggleDrMode,
  handleUndo,
  isCopyDisabled,
  newBoxName,
  setNewBoxName,
  handleRename,
  handleSave,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  return (
    <ul>
      <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="Cursor"
          name="Cursor"
          onClick={toggleDrawingMode}
        >
          {drawingMode ? (
            <PiCursorBold />
          ) : (
            <PiCursorBold style={{ color: "yellow" }} />
          )}
        </button>
      </li>
      {/* <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="Checker Group"
          name="parent"
          onClick={toggleDrawingModeparent}
        >
          {drawingModeparent ? (
            <IoCheckmarkDoneSharp style={{ color: "yellow" }} />
          ) : (
            <IoCheckmarkDoneSharp />
          )}
        </button>
      </li>
      <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="Checker"
          name="Child"
          onClick={toggleDrawingModechild}
        >
          {drawingModechild ? (
            <IoCheckmarkSharp style={{ color: "yellow" }} />
          ) : (
            <IoCheckmarkSharp />
          )}
        </button>
      </li> */}

      <div>
        <div className="dropdown">
          <button
            className="btn btn-dark dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            aria-expanded="false"
            onClick={toggleDropdown}
          >
            Dropdown
          </button>
          {/* {showDropdown && <>hello</>} */}
          {showDropdown && (
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <li>
                <button
                  className="dropdown-item"
                  title="Checker Group"
                  name="parent"
                  onClick={() => {
                    toggleDrawingModeparent();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  {drawingModeparent ? (
                    <IoCheckmarkDoneSharp style={{ color: "yellow" }} />
                  ) : (
                    <IoCheckmarkDoneSharp />
                  )}
                  Checker Group
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="Checker"
                  name="child"
                  onClick={() => {
                    toggleDrawingModechild();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  {drawingModechild ? (
                    <IoCheckmarkSharp style={{ color: "yellow" }} />
                  ) : (
                    <IoCheckmarkSharp />
                  )}
                  Checker
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="Anchor"
                  name=" Anchor"
                  onClick={() => {
                    toggleDrawingModeAnchor();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  {drawingModeAnchor ? (
                    <IoCheckmarkSharp style={{ color: "yellow" }} />
                  ) : (
                    <IoCheckmarkSharp />
                  )}
                  Anchor
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="RollNumber"
                  name="RollNumber"
                  onClick={() => {
                    toggleDrawingModeRollNo();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  {drawingModeRollNo ? (
                    <IoCheckmarkSharp style={{ color: "yellow" }} />
                  ) : (
                    <IoCheckmarkSharp />
                  )}
                  Roll number
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="Question paper setNo."
                  name="QpNo."
                  onClick={() => {
                    toggleDrawingModeQuestionpaper();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  {drawingModeQuestionpaper ? (
                    <IoCheckmarkSharp style={{ color: "yellow" }} />
                  ) : (
                    <IoCheckmarkSharp />
                  )}
                  Question paper setNo.
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <li>
        <CopyComponent
          handleCopyBoxClick={handleCopyBoxClick}
          handlePasteBoxClick={handlePasteBoxClick}
          selectedBoxIndex={selectedBoxIndex}
          selectedchildBoxIndex={selectedchildBoxIndex}
          boxes={boxes}
          copiedBox={copiedBox}
          isBoxCopied={isBoxCopied}
          isCopyDisabled={isCopyDisabled}
        />
      </li>
      <li>
        <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      </li>
      <li>
        <DeleteButton
          onClick={handleDeleteSelectedBox}
          disabled={selectedBoxIndex === null}
        />
      </li>
      <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="drag"
          name="drag"
          onClick={toggleDrMode}
        >
          {drMode ? (
            // <PiCursorBold />
            // <AiOutlineDrag />

            <RiDragDropFill style={{ color: "yellow" }} />
          ) : (
            // "True drag"
            // "False drag"
            // <RiDragDropFill style={{ color: "yellow" }} />
            <RiDragDropFill />
          )}
        </button>
      </li>
      {/* **********Undo************ */}
      {/* <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="Undo"
          name="Undo"
          onClick={handleUndo}
        >
          <ImUndo2 />
        </button>
      </li> */}

      {/* ************************ */}
      {/* <li>
        <input
          type="text"
          placeholder="Enter box name"
          value={boxNameInput}
          onChange={(e) => setBoxNameInput(e.target.value)}
          className="form-control mt-3"
        />
      </li> */}
      <li>
        {selectedBoxIndex !== null && (
          <div style={{ display: "flex" }}>
            <input
              type="text"
              placeholder="Enter new name"
              value={newBoxName}
              onChange={(e) => setNewBoxName(e.target.value)}
              className="form-control mt-3"
            />
            <button className=" btn btn-rename " onClick={handleRename}>
              Rename
            </button>
          </div>
        )}
      </li>

      <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="drag"
          name="drag"
          onClick={handleSave}
        >
          Save
        </button>
      </li>
    </ul>
  );
}

export default ButtonListComponent;
