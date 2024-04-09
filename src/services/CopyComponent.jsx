// CopyComponent.js

import React from "react";
import { FaRegCopy } from "react-icons/fa";
import { FaRegPaste } from "react-icons/fa6";

function CopyComponent({
  handleCopyBoxClick,
  handlePasteBoxClick,
  selectedBoxIndex,
  selectedchildBoxIndex,
  boxes,
  copiedBox,
  isBoxCopied,
  isCopyDisabled,
}) {
  return (
    <>
      <button
        className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
        title="Copy"
        name="copy"
        onClick={handleCopyBoxClick}
        // disabled={selectedBoxIndex === null}
        disabled={selectedBoxIndex === null}
      >
        {isBoxCopied ? (
          <FaRegCopy style={{ color: "yellow" }} />
        ) : (
          <FaRegCopy />
        )}
      </button>
      <button
        className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
        title="Paste"
        name="paste"
        onClick={handlePasteBoxClick}
        disabled={!copiedBox}
      >
        {/* P */}
        <FaRegPaste />
      </button>
    </>
  );
}

export default CopyComponent;
