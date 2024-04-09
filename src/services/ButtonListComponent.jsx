// ButtonListComponent.js

import React from "react";
import { PiCursorBold } from "react-icons/pi";
import CopyComponent from "./CopyComponent";
import ZoomControls from "./ZoomControls";
import DeleteButton from "./DeleteButton";
import { RiDragDropFill } from "react-icons/ri";
import { ImUndo2 } from "react-icons/im";
import { IoCheckmarkSharp } from "react-icons/io5";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

function ButtonListComponent({
  toggleDrawingMode,
  toggleDrawingModeparent,
  toggleDrawingModechild,
  drawingMode,
  drawingModeparent,
  drawingModechild,
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
}) {
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
      <li>
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
      </li>

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

      <li>
        <button
          className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
          title="Undo"
          name="Undo"
          onClick={handleUndo}
        >
          {/* handleUndoU */}
          <ImUndo2 />
        </button>
      </li>
      <li>
        <input
          type="text"
          placeholder="Enter box name"
          value={boxNameInput}
          onChange={(e) => setBoxNameInput(e.target.value)}
          className="form-control mt-3"
        />
      </li>
    </ul>
  );
}

export default ButtonListComponent;
