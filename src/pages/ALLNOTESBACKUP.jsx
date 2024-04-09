import React, { useEffect, useState, useCallback } from "react";
import MappingDataComponent from "../services/MappingDataComponent";
import MappingDisplayComponent from "../services/MappingDisplayComponent";
import ButtonListComponent from "../services/ButtonListComponent";
function Templateimage({ images }) {
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [startCoordinates, setStartCoordinates] = useState({
    x: null,
    y: null,
  });
  const [drMode, setDrMode] = useState(false);
  const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingModeparent, setDrawingModeparent] = useState(false);
  const [drawingModechild, setDrawingModechild] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [boxNameInput, setBoxNameInput] = useState("");

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draggedBoxIndex, setDraggedBoxIndex] = useState(null);
  const [originalMousePosition, setOriginalMousePosition] = useState(null);

  // ****************************************************
  const handleMouseDownOnBox = (event, index) => {
    setDraggedBoxIndex(index);
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setOriginalMousePosition({ x, y });
  };

  const handleMouseUpOnBox = () => {
    setDraggedBoxIndex(null);
    setOriginalMousePosition(null);
  };

  const handleMouseMoveOnBox = (event) => {
    if (drMode && draggedBoxIndex !== null && originalMousePosition !== null) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const deltaX = x - originalMousePosition.x;
      const deltaY = y - originalMousePosition.y;

      const updatedBoxes = [...boxes];
      const draggedBox = updatedBoxes[draggedBoxIndex];

      draggedBox.start.x += deltaX;
      draggedBox.start.y += deltaY;
      draggedBox.end.x += deltaX;
      draggedBox.end.y += deltaY;

      if (draggedBox.mode === "parent") {
        draggedBox.children.forEach((childBox) => {
          childBox.start.x += deltaX;
          childBox.start.y += deltaY;
          childBox.end.x += deltaX;
          childBox.end.y += deltaY;
        });
      }

      setBoxes(updatedBoxes);
      setOriginalMousePosition({ x, y });
      draw();
    }
  };

  // ****************************************************

  // Function to add state to history
  const addToHistory = (newState) => {
    setHistory((prevHistory) => [
      ...prevHistory.slice(0, historyIndex + 1),
      newState,
    ]);
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  // Function to handle undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      setBoxes(history[historyIndex - 1]);
    }
  };

  // useEffect to update history whenever boxes state changes
  useEffect(() => {
    addToHistory(boxes);
  }, [boxes]);

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
    return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
  };

  const uploadImage = (image) => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    const img = new Image();
    img.src = URL.createObjectURL(image);
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    // console.log("Hey i am image", image);
    setImage(img);
  };

  const handleMouseDown = (event) => {
    if (drMode) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor;
      const y = (event.clientY - rect.top) / zoomFactor;

      // Check if the click is inside any of the boxes or their children
      let clickedBoxIndex = -1;
      let clickedChildIndex = -1;

      boxes.forEach((box, index) => {
        if (
          x >= box.start.x &&
          x <= box.end.x &&
          y >= box.start.y &&
          y <= box.end.y
        ) {
          clickedBoxIndex = index;
        }

        if (box.mode === "parent" && box.children) {
          box.children.forEach((childBox, childIndex) => {
            if (
              x >= childBox.start.x &&
              x <= childBox.end.x &&
              y >= childBox.start.y &&
              y <= childBox.end.y
            ) {
              clickedBoxIndex = index;
              clickedChildIndex = childIndex;
            }
          });
        }
      });

      // If a box or its child is clicked, select it
      if (clickedBoxIndex !== -1) {
        handleSelectBoxClick(clickedBoxIndex);
      }

      if (clickedChildIndex !== -1) {
        handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
      }
    } else if (drawingModeparent || drawingModechild) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor;
      const y = (event.clientY - rect.top) / zoomFactor;

      setStartCoordinates({ x, y });
      setEndCoordinates({ x, y });
      setDragging(true);
    }
  };

  const handleMouseUp = () => {
    if (drawingMode) {
      setDragging(false);

      if (startCoordinates.x !== null && endCoordinates.x !== null) {
        const minHeight = 7; // Minimum height requirement
        const minWidth = 7; // Minimum width requirement

        // Calculate height and width of the box
        const height = Math.abs(endCoordinates.y - startCoordinates.y);
        const width = Math.abs(endCoordinates.x - startCoordinates.x);

        // Check if height and width meet the minimum requirement
        if (height >= minHeight && width >= minWidth) {
          let newBox;

          if (drawingModeparent) {
            newBox = {
              id: generateUniqueId(),
              name: boxNameInput,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "parent",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
              children: [],
            };
          } else {
            newBox = {
              id: generateUniqueId(),
              name: boxNameInput,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "child",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
            };

            const insideParent = boxes.some(
              (box) =>
                box.mode === "parent" &&
                newBox.start.x > box.start.x &&
                newBox.start.y > box.start.y &&
                newBox.end.x < box.end.x &&
                newBox.end.y < box.end.y
            );
            console.log("insideParent", insideParent);

            if (insideParent) {
              const parentIndex = boxes.findIndex(
                (box) =>
                  box.mode === "parent" &&
                  newBox.start.x > box.start.x &&
                  newBox.start.y > box.start.y &&
                  newBox.end.x < box.end.x &&
                  newBox.end.y < box.end.y
              );
              console.log("parentIndex", parentIndex);

              const updatedBoxes = [...boxes];
              updatedBoxes[parentIndex].children.push(newBox);
              setBoxes(updatedBoxes);

              return;
            }
          }

          setBoxes([...boxes, newBox]);
          // console.log("hello jii ", boxes);
          setBoxNameInput("");
          console.log(
            "Boxes data:",
            JSON.stringify([...boxes, newBox], null, 2)
          );
        } else {
          console.log("Minimum height and width requirement not met");
        }
      }
    }
  };

  const handleMouseMove = (event) => {
    if (drawingMode && dragging) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor;
      const y = (event.clientY - rect.top) / zoomFactor;
      setEndCoordinates({ x, y });
      draw();
    }
  };

  const handleZoomIn = () => {
    // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

    setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
    // console.log(zoomFactor, "hey i am zoom out factor");
  };

  const draw = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      context.drawImage(
        image,
        0,
        0,
        canvas.width * zoomFactor,
        canvas.height * zoomFactor
      );
    }

    boxes.forEach((box, index) => {
      if (box.mode === "parent") {
        context.strokeStyle = "green";
      } else {
        context.strokeStyle = "red";
      }

      // Check if the current box is selected
      if (index === selectedBoxIndex) {
        context.strokeStyle = "orange"; // Change stroke color for the selected box
      }

      context.lineWidth = 2;
      context.strokeRect(
        box.start.x * zoomFactor,
        box.start.y * zoomFactor,
        (box.end.x - box.start.x) * zoomFactor,
        (box.end.y - box.start.y) * zoomFactor
      );

      if (box.mode === "parent") {
        box.children.forEach((childBox, childIndex) => {
          console.log("hey i am child index...", index);
          if (
            index === selectedBoxIndex &&
            childIndex === selectedchildBoxIndex
          ) {
            context.strokeStyle = "orange"; // Change stroke color for the selected child box
          } else {
            context.strokeStyle = "blue"; // Default stroke color for child boxes
          }

          // context.strokeStyle = "blue";
          context.strokeRect(
            childBox.start.x * zoomFactor,
            childBox.start.y * zoomFactor,
            childBox.width * zoomFactor,
            childBox.height * zoomFactor
          );
        });
      }
    });

    if (drawingMode && dragging) {
      context.strokeStyle = drawingModeparent ? "pink" : "yellow";
      context.lineWidth = 2;
      context.strokeRect(
        startCoordinates.x * zoomFactor,
        startCoordinates.y * zoomFactor,
        (endCoordinates.x - startCoordinates.x) * zoomFactor,
        (endCoordinates.y - startCoordinates.y) * zoomFactor
      );
      // Display box name for the dragged box
      context.fillStyle = "black";
      context.font = "12px Arial";
      context.fillText(
        boxNameInput,
        startCoordinates.x * zoomFactor + 5,
        startCoordinates.y * zoomFactor + 15
      );
    }
  };

  //  selected box , copy ,paste
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

  const [copiedBox, setCopiedBox] = useState(null);
  const [isBoxCopied, setIsBoxCopied] = useState(false);
  const handleSelectBoxClick = (index) => {
    setSelectedBoxIndex(index);
    setIsBoxCopied(false);
    setBoxes((prevBoxes) => {
      const newBoxes = [...prevBoxes];
      const box = newBoxes[index];

      if (box.mode === "parent") {
        box.isOpen = !box.isOpen;
      }

      return newBoxes;
    });
  };

  const handleSelectChildBoxClick = (childindex, index) => {
    // console.log("hey i am parent index....", index);

    // console.log("hey i am child index....", childindex);
    // setSelectedBoxIndex(index);
    // setSelectedchildBoxIndex(childindex);

    // setIsBoxCopied(false);
    if (selectedchildBoxIndex === childindex) {
      // If the same child box is clicked again, unselect it
      setSelectedchildBoxIndex(null);
      setIsBoxCopied(false); // Reset copied flag
    } else {
      setSelectedBoxIndex(index); // Select the parent box
      setSelectedchildBoxIndex(childindex); // Select the child box
      setIsBoxCopied(false); // Reset copied flag
    }
  };

  const handleCopyBoxClick = useCallback(() => {
    if (selectedBoxIndex !== null && boxes.length > 0) {
      // if (boxes[selectedBoxIndex].children.length > 0) {
      const selectedBox = boxes[selectedBoxIndex];
      // console.log(
      //   "hey i am selected box hehehehehhe..",
      //   selectedBox.children.length
      // );
      // console.log("hey i am selected box mode..", selectedBox.mode);
      // setCopiedBox(selectedBox);
      // setIsBoxCopied(true); // Set the flag to true when a box is copied
      // console.log("Box copied:", selectedBox);
      // } else {
      //   const selectedBox = boxes[selectedBoxIndex];
      //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
      //   setIsBoxCopied(true);
      //   console.log("Hey i am copied child box....", copiedBox);
      // }

      if (selectedBox.mode === "parent") {
        if (selectedBox.children.length <= 0) {
          console.log("hey i am selected box mode..", selectedBox.mode);
          setCopiedBox(selectedBox);
          setIsBoxCopied(true); // Set the flag to true when a box is copied
          console.log("Box copied:", selectedBox);
        } else {
          // console.log("hey i am selected box mode..", selectedBox);
          // console.log(
          //   "hey i am selected box child mode..",
          //   selectedBox.children[selectedchildBoxIndex].id
          // );
          if (selectedchildBoxIndex !== null) {
            // If a child box is selected, copy only that child
            const selectedChildBox =
              selectedBox.children[selectedchildBoxIndex];
            console.log("Child Box copied:", selectedChildBox);
            setCopiedBox(selectedChildBox);
            setIsBoxCopied(true);
          } else {
            // If no child box is selected, copy the entire parent along with its children
            if (selectedBox.mode === "parent") {
              console.log("Parent Box copied:", selectedBox);
              setCopiedBox(selectedBox);
              setIsBoxCopied(true);
            }
          }

          console.log("Hey i have child and parent both");
        }
      } else if (selectedBox.mode === "child") {
        console.log("hey i am selected box mode..", selectedBox.mode);
        setCopiedBox(selectedBox);
        setIsBoxCopied(true); // Set the flag to true when a box is copied
        console.log("Box copied:", selectedBox);
      }
    }
  }, [selectedBoxIndex, selectedchildBoxIndex, boxes]);

  const handlePasteBoxClick = useCallback(() => {
    if (copiedBox) {
      // const updatedBoxes = [...boxes, { ...copiedBox }];
      // setBoxes(updatedBoxes);
      // console.log("Box pasted:", copiedBox);
      // Adjust the start and end coordinates of the copied box
      const adjustedCopiedBox = {
        ...copiedBox,
        id: generateUniqueId(),
        start: { x: 0, y: 0 },
        end: {
          x: copiedBox.width,
          y: copiedBox.height,
        },
      };
      // If the copied box is a parent box with children, adjust their positions
      if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
        adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
          const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
          return {
            ...childBox,
            id: newChildId,
            start: {
              x: childBox.start.x - copiedBox.start.x,
              y: childBox.start.y - copiedBox.start.y,
            },
            end: {
              x: childBox.end.x - copiedBox.start.x,
              y: childBox.end.y - copiedBox.start.y,
            },
          };
        });
      }
      const updatedBoxes = [...boxes, adjustedCopiedBox];
      setBoxes(updatedBoxes);
      console.log("Box pasted:", adjustedCopiedBox);
    }
  }, [copiedBox, boxes]);

  // till here copy paste functionality
  // Ctrl + C functionality

  const handleDeleteSelectedBox = () => {
    if (selectedBoxIndex !== null) {
      if (selectedchildBoxIndex !== null) {
        // If a child box is selected, delete only that child box
        const updatedBoxes = [...boxes];
        updatedBoxes[selectedBoxIndex].children.splice(
          selectedchildBoxIndex,
          1
        );
        setSelectedchildBoxIndex(null); // Unselect the child box
        setBoxes(updatedBoxes);
        console.log("Child Box deleted");
      } else {
        // If no child box is selected, delete the entire parent box
        const updatedBoxes = [...boxes];
        updatedBoxes.splice(selectedBoxIndex, 1);
        setSelectedBoxIndex(null);
        setBoxes(updatedBoxes);
        console.log("Box deleted");
      }
    }
  };

  useEffect(() => {
    draw();
  }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

  useEffect(() => {
    if (images) {
      uploadImage(images);
    }
  }, [images]);
  // const toggleDrawingMode = () => {
  //   setDrawingMode(!drawingMode);
  //   setDragging(false);
  // };
  const toggleDrawingMode = () => {
    if (drMode === true) {
      setDrawingMode(false);
    } else {
      setDrawingMode(!drawingMode);
    }

    if (drawingMode === true) {
      setDragging(false);
    }
  };

  const toggleDrawingModeparent = () => {
    setDrawingModeparent(!drawingModeparent);
    setDragging(false);

    if (drawingModechild === true) {
      setDrawingModechild(!drawingModechild);
    }
  };

  const toggleDrawingModechild = () => {
    setDrawingModechild(!drawingModechild);
    setDragging(false);

    if (drawingModeparent === true) {
      setDrawingModeparent(!drawingModeparent);
    }
  };
  const toggleDrMode = () => {
    setDrMode(!drMode);

    if (!drMode) {
      setDrawingMode(false);
      setDrawingModeparent(false);
      setDrawingModechild(false);
      setDragging(false);
    }
  };

  return (
    <>
      <div className="map_header ria shadow">
        <div className="container">
          <ButtonListComponent
            toggleDrawingMode={toggleDrawingMode}
            toggleDrawingModeparent={toggleDrawingModeparent}
            toggleDrawingModechild={toggleDrawingModechild}
            drawingMode={drawingMode}
            drawingModeparent={drawingModeparent}
            drawingModechild={drawingModechild}
            handleCopyBoxClick={handleCopyBoxClick}
            handlePasteBoxClick={handlePasteBoxClick}
            selectedBoxIndex={selectedBoxIndex}
            selectedchildBoxIndex={selectedchildBoxIndex}
            boxes={boxes}
            copiedBox={copiedBox}
            isBoxCopied={isBoxCopied}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleDeleteSelectedBox={handleDeleteSelectedBox}
            boxNameInput={boxNameInput}
            setBoxNameInput={setBoxNameInput}
            drMode={drMode}
            toggleDrMode={toggleDrMode}
            handleUndo={handleUndo}
            isCopyDisabled={boxes.length === 0} // Pass the disabled prop based on the condition
          />
          <button onClick={toggleDrMode}>
            {drMode ? "True" : "False"} Drag
          </button>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-8">
            <canvas
              id="canvas"
              width={800} // Set the width of the canvas as needed
              height={1200} // Set the height of the canvas as needed
              // className="w-100"
              style={{
                border: "1px solid green",
                marginTop: "40px",
                marginRight: "100px",
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            />

            {/* <MappingDisplayComponent
              boxes={boxes}
              selectedBoxIndex={selectedBoxIndex}
              handleSelectBoxClick={handleSelectBoxClick}
              handleMouseDownOnBox = {handleMouseDownOnBox}
              handleMouseUpOnBox = {handleMouseUpOnBox}
              handleMouseMoveOnBox = {handleMouseMoveOnBox}
            /> */}
          </div>
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
                  Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) -
                  ({box.end.x}, {box.end.y})
                </p>
                {box.mode === "parent" && (
                  <div>
                    <p>Child Boxes:</p>
                    {box.children.map((childBox, childIndex) => (
                      <p key={childIndex}>
                        Box {childIndex + 1} ID: {childBox.id}
                        <br />
                        Child Box {childIndex + 1} Coordinates: (
                        {childBox.start.x}, {childBox.start.y}) - (
                        {childBox.end.x}, {childBox.end.y})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <MappingDataComponent
            boxes={boxes}
            selectedBoxIndex={selectedBoxIndex}
            selectedchildBoxIndex={selectedchildBoxIndex}
            handleSelectBoxClick={handleSelectBoxClick}
            handleSelectChildBoxClick={handleSelectChildBoxClick}
          />
        </div>
      </div>
    </>
  );
}

export default Templateimage;



// *********************************************************************
// Above code is last date update................

// import React, { useEffect, useState, useCallback } from "react";
// import MappingDataComponent from "../services/MappingDataComponent";
// import MappingDisplayComponent from "../services/MappingDisplayComponent";
// import ButtonListComponent from "../services/ButtonListComponent";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [drMode, setDrMode] = useState(false);
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(false);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(false);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");

//   const [history, setHistory] = useState([]);
//   const [historyIndex, setHistoryIndex] = useState(-1);
//   const [draggedBoxIndex, setDraggedBoxIndex] = useState(null);
//   const [originalMousePosition, setOriginalMousePosition] = useState(null);

//   // ****************************************************
//   const handleMouseDownOnBox = (event, index) => {
//     setDraggedBoxIndex(index);
//     const canvas = document.getElementById("canvas");
//     const rect = canvas.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;
//     setOriginalMousePosition({ x, y });
//   };

//   const handleMouseUpOnBox = () => {
//     setDraggedBoxIndex(null);
//     setOriginalMousePosition(null);
//   };

//   const handleMouseMoveOnBox = (event) => {
//     if (drMode && draggedBoxIndex !== null && originalMousePosition !== null) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = event.clientX - rect.left;
//       const y = event.clientY - rect.top;

//       const deltaX = x - originalMousePosition.x;
//       const deltaY = y - originalMousePosition.y;

//       const updatedBoxes = [...boxes];
//       const draggedBox = updatedBoxes[draggedBoxIndex];

//       draggedBox.start.x += deltaX;
//       draggedBox.start.y += deltaY;
//       draggedBox.end.x += deltaX;
//       draggedBox.end.y += deltaY;

//       if (draggedBox.mode === "parent") {
//         draggedBox.children.forEach((childBox) => {
//           childBox.start.x += deltaX;
//           childBox.start.y += deltaY;
//           childBox.end.x += deltaX;
//           childBox.end.y += deltaY;
//         });
//       }

//       setBoxes(updatedBoxes);
//       setOriginalMousePosition({ x, y });
//       draw();
//     }
//   };

//   // ****************************************************

//   // Function to add state to history

//   // const handleCanvasMouseMove = (event) => {
//   //   if (
//   //     dragging &&
//   //     draggedBoxIndex !== null &&
//   //     originalMousePosition !== null
//   //   ) {
//   //     const canvas = document.getElementById("canvas");
//   //     const rect = canvas.getBoundingClientRect();
//   //     const x = event.clientX - rect.left;
//   //     const y = event.clientY - rect.top;

//   //     const deltaX = x - originalMousePosition.x;
//   //     const deltaY = y - originalMousePosition.y;

//   //     const updatedBoxes = [...boxes];
//   //     const draggedBox = updatedBoxes[draggedBoxIndex];

//   //     draggedBox.start.x += deltaX;
//   //     draggedBox.start.y += deltaY;
//   //     draggedBox.end.x += deltaX;
//   //     draggedBox.end.y += deltaY;

//   //     if (draggedBox.mode === "parent") {
//   //       draggedBox.children.forEach((childBox) => {
//   //         childBox.start.x += deltaX;
//   //         childBox.start.y += deltaY;
//   //         childBox.end.x += deltaX;
//   //         childBox.end.y += deltaY;
//   //       });
//   //     }

//   //     setBoxes(updatedBoxes);
//   //     setOriginalMousePosition({ x, y });
//   //     draw();
//   //   }
//   // };
//   const handleCanvasMouseMove = (event) => {
//     if (drMode && dragging && selectedBoxIndex !== null) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       const deltaX = x - originalMousePosition.x;
//       const deltaY = y - originalMousePosition.y;

//       const updatedBoxes = [...boxes];
//       const draggedBox = updatedBoxes[selectedBoxIndex];

//       draggedBox.start.x += deltaX;
//       draggedBox.start.y += deltaY;
//       draggedBox.end.x += deltaX;
//       draggedBox.end.y += deltaY;

//       if (draggedBox.mode === "parent") {
//         draggedBox.children.forEach((childBox) => {
//           childBox.start.x += deltaX;
//           childBox.start.y += deltaY;
//           childBox.end.x += deltaX;
//           childBox.end.y += deltaY;
//         });
//       }

//       setBoxes(updatedBoxes);
//       setOriginalMousePosition({ x, y });
//       draw();
//     }
//   };

//   useEffect(() => {
//     const canvas = document.getElementById("canvas");

//     canvas.addEventListener("mousemove", handleCanvasMouseMove);

//     return () => {
//       canvas.removeEventListener("mousemove", handleCanvasMouseMove);
//     };
//   }, []);

//   const addToHistory = (newState) => {
//     setHistory((prevHistory) => [
//       ...prevHistory.slice(0, historyIndex + 1),
//       newState,
//     ]);
//     setHistoryIndex((prevIndex) => prevIndex + 1);
//   };

//   // Function to handle undo action
//   const handleUndo = () => {
//     if (historyIndex > 0) {
//       setHistoryIndex((prevIndex) => prevIndex - 1);
//       setBoxes(history[historyIndex - 1]);
//     }
//   };

//   // useEffect to update history whenever boxes state changes
//   useEffect(() => {
//     addToHistory(boxes);
//   }, [boxes]);

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   // const handleMouseDown = (event) => {
//   //   if (drMode) {
//   //     const canvas = document.getElementById("canvas");
//   //     const rect = canvas.getBoundingClientRect();
//   //     const x = (event.clientX - rect.left) / zoomFactor;
//   //     const y = (event.clientY - rect.top) / zoomFactor;

//   //     // Check if the click is inside any of the boxes or their children
//   //     let clickedBoxIndex = -1;
//   //     let clickedChildIndex = -1;

//   //     boxes.forEach((box, index) => {
//   //       if (
//   //         x >= box.start.x &&
//   //         x <= box.end.x &&
//   //         y >= box.start.y &&
//   //         y <= box.end.y
//   //       ) {
//   //         clickedBoxIndex = index;
//   //       }

//   //       if (box.mode === "parent" && box.children) {
//   //         box.children.forEach((childBox, childIndex) => {
//   //           if (
//   //             x >= childBox.start.x &&
//   //             x <= childBox.end.x &&
//   //             y >= childBox.start.y &&
//   //             y <= childBox.end.y
//   //           ) {
//   //             clickedBoxIndex = index;
//   //             clickedChildIndex = childIndex;
//   //           }
//   //         });
//   //       }
//   //     });

//   //     // If a box or its child is clicked, select it
//   //     if (clickedBoxIndex !== -1) {
//   //       handleSelectBoxClick(clickedBoxIndex);
//   //     }

//   //     if (clickedChildIndex !== -1) {
//   //       handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
//   //     }
//   //   } else if (drawingModeparent || drawingModechild) {
//   //     const canvas = document.getElementById("canvas");
//   //     const rect = canvas.getBoundingClientRect();
//   //     const x = (event.clientX - rect.left) / zoomFactor;
//   //     const y = (event.clientY - rect.top) / zoomFactor;

//   //     setStartCoordinates({ x, y });
//   //     setEndCoordinates({ x, y });
//   //     setDragging(true);
//   //   }
//   // };
//   const handleMouseDown = (event) => {
//     if (drMode) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       // Check if the click is inside any of the boxes or their children
//       let clickedBoxIndex = -1;
//       let clickedChildIndex = -1;

//       boxes.forEach((box, index) => {
//         if (
//           x >= box.start.x &&
//           x <= box.end.x &&
//           y >= box.start.y &&
//           y <= box.end.y
//         ) {
//           clickedBoxIndex = index;
//         }

//         if (box.mode === "parent" && box.children) {
//           box.children.forEach((childBox, childIndex) => {
//             if (
//               x >= childBox.start.x &&
//               x <= childBox.end.x &&
//               y >= childBox.start.y &&
//               y <= childBox.end.y
//             ) {
//               clickedBoxIndex = index;
//               clickedChildIndex = childIndex;
//             }
//           });
//         }
//       });

//       // If a box or its child is clicked, select it
//       if (clickedBoxIndex !== -1) {
//         handleSelectBoxClick(clickedBoxIndex);
//         setDragging(true); // Start dragging the selected box
//         const box = boxes[clickedBoxIndex];
//         setOriginalMousePosition({ x: box.start.x, y: box.start.y });
//       }

//       if (clickedChildIndex !== -1) {
//         handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
//         setDragging(true); // Start dragging the selected child box
//         const childBox = boxes[clickedBoxIndex].children[clickedChildIndex];
//         setOriginalMousePosition({ x: childBox.start.x, y: childBox.start.y });
//       }
//     } else if (drawingModeparent || drawingModechild) {
//       // Handle drawing mode logic
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//     }
//   };
//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         const minHeight = 7; // Minimum height requirement
//         const minWidth = 7; // Minimum width requirement

//         // Calculate height and width of the box
//         const height = Math.abs(endCoordinates.y - startCoordinates.y);
//         const width = Math.abs(endCoordinates.x - startCoordinates.x);

//         // Check if height and width meet the minimum requirement
//         if (height >= minHeight && width >= minWidth) {
//           let newBox;

//           if (drawingModeparent) {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "parent",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//               children: [],
//             };
//           } else {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "child",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//             };

//             const insideParent = boxes.some(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("insideParent", insideParent);

//             if (insideParent) {
//               const parentIndex = boxes.findIndex(
//                 (box) =>
//                   box.mode === "parent" &&
//                   newBox.start.x > box.start.x &&
//                   newBox.start.y > box.start.y &&
//                   newBox.end.x < box.end.x &&
//                   newBox.end.y < box.end.y
//               );
//               console.log("parentIndex", parentIndex);

//               const updatedBoxes = [...boxes];
//               updatedBoxes[parentIndex].children.push(newBox);
//               setBoxes(updatedBoxes);

//               return;
//             }
//           }

//           setBoxes([...boxes, newBox]);
//           // console.log("hello jii ", boxes);
//           setBoxNameInput("");
//           console.log(
//             "Boxes data:",
//             JSON.stringify([...boxes, newBox], null, 2)
//           );
//         } else {
//           console.log("Minimum height and width requirement not met");
//         }
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box, index) => {
//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       // Check if the current box is selected
//       if (index === selectedBoxIndex) {
//         context.strokeStyle = "orange"; // Change stroke color for the selected box
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox, childIndex) => {
//           console.log("hey i am child index...", index);
//           if (
//             index === selectedBoxIndex &&
//             childIndex === selectedchildBoxIndex
//           ) {
//             context.strokeStyle = "orange"; // Change stroke color for the selected child box
//           } else {
//             context.strokeStyle = "blue"; // Default stroke color for child boxes
//           }

//           // context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //  selected box , copy ,paste
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   const handleSelectChildBoxClick = (childindex, index) => {
//     // console.log("hey i am parent index....", index);

//     // console.log("hey i am child index....", childindex);
//     // setSelectedBoxIndex(index);
//     // setSelectedchildBoxIndex(childindex);

//     // setIsBoxCopied(false);
//     if (selectedchildBoxIndex === childindex) {
//       // If the same child box is clicked again, unselect it
//       setSelectedchildBoxIndex(null);
//       setIsBoxCopied(false); // Reset copied flag
//     } else {
//       setSelectedBoxIndex(index); // Select the parent box
//       setSelectedchildBoxIndex(childindex); // Select the child box
//       setIsBoxCopied(false); // Reset copied flag
//     }
//   };

//   const handleCopyBoxClick = useCallback(() => {
//     if (selectedBoxIndex !== null && boxes.length > 0) {
//       // if (boxes[selectedBoxIndex].children.length > 0) {
//       const selectedBox = boxes[selectedBoxIndex];
//       // console.log(
//       //   "hey i am selected box hehehehehhe..",
//       //   selectedBox.children.length
//       // );
//       // console.log("hey i am selected box mode..", selectedBox.mode);
//       // setCopiedBox(selectedBox);
//       // setIsBoxCopied(true); // Set the flag to true when a box is copied
//       // console.log("Box copied:", selectedBox);
//       // } else {
//       //   const selectedBox = boxes[selectedBoxIndex];
//       //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
//       //   setIsBoxCopied(true);
//       //   console.log("Hey i am copied child box....", copiedBox);
//       // }

//       if (selectedBox.mode === "parent") {
//         if (selectedBox.children.length <= 0) {
//           console.log("hey i am selected box mode..", selectedBox.mode);
//           setCopiedBox(selectedBox);
//           setIsBoxCopied(true); // Set the flag to true when a box is copied
//           console.log("Box copied:", selectedBox);
//         } else {
//           // console.log("hey i am selected box mode..", selectedBox);
//           // console.log(
//           //   "hey i am selected box child mode..",
//           //   selectedBox.children[selectedchildBoxIndex].id
//           // );
//           if (selectedchildBoxIndex !== null) {
//             // If a child box is selected, copy only that child
//             const selectedChildBox =
//               selectedBox.children[selectedchildBoxIndex];
//             console.log("Child Box copied:", selectedChildBox);
//             setCopiedBox(selectedChildBox);
//             setIsBoxCopied(true);
//           } else {
//             // If no child box is selected, copy the entire parent along with its children
//             if (selectedBox.mode === "parent") {
//               console.log("Parent Box copied:", selectedBox);
//               setCopiedBox(selectedBox);
//               setIsBoxCopied(true);
//             }
//           }

//           console.log("Hey i have child and parent both");
//         }
//       } else if (selectedBox.mode === "child") {
//         console.log("hey i am selected box mode..", selectedBox.mode);
//         setCopiedBox(selectedBox);
//         setIsBoxCopied(true); // Set the flag to true when a box is copied
//         console.log("Box copied:", selectedBox);
//       }
//     }
//   }, [selectedBoxIndex, selectedchildBoxIndex, boxes]);

//   const handlePasteBoxClick = useCallback(() => {
//     if (copiedBox) {
//       // const updatedBoxes = [...boxes, { ...copiedBox }];
//       // setBoxes(updatedBoxes);
//       // console.log("Box pasted:", copiedBox);
//       // Adjust the start and end coordinates of the copied box
//       const adjustedCopiedBox = {
//         ...copiedBox,
//         id: generateUniqueId(),
//         start: { x: 0, y: 0 },
//         end: {
//           x: copiedBox.width,
//           y: copiedBox.height,
//         },
//       };
//       // If the copied box is a parent box with children, adjust their positions
//       if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
//         adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
//           const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
//           return {
//             ...childBox,
//             id: newChildId,
//             start: {
//               x: childBox.start.x - copiedBox.start.x,
//               y: childBox.start.y - copiedBox.start.y,
//             },
//             end: {
//               x: childBox.end.x - copiedBox.start.x,
//               y: childBox.end.y - copiedBox.start.y,
//             },
//           };
//         });
//       }
//       const updatedBoxes = [...boxes, adjustedCopiedBox];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", adjustedCopiedBox);
//     }
//   }, [copiedBox, boxes]);

//   // till here copy paste functionality
//   // Ctrl + C functionality

//   const handleDeleteSelectedBox = () => {
//     if (selectedBoxIndex !== null) {
//       if (selectedchildBoxIndex !== null) {
//         // If a child box is selected, delete only that child box
//         const updatedBoxes = [...boxes];
//         updatedBoxes[selectedBoxIndex].children.splice(
//           selectedchildBoxIndex,
//           1
//         );
//         setSelectedchildBoxIndex(null); // Unselect the child box
//         setBoxes(updatedBoxes);
//         console.log("Child Box deleted");
//       } else {
//         // If no child box is selected, delete the entire parent box
//         const updatedBoxes = [...boxes];
//         updatedBoxes.splice(selectedBoxIndex, 1);
//         setSelectedBoxIndex(null);
//         setBoxes(updatedBoxes);
//         console.log("Box deleted");
//       }
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   // const toggleDrawingMode = () => {
//   //   setDrawingMode(!drawingMode);
//   //   setDragging(false);
//   // };
//   const toggleDrawingMode = () => {
//     if (drMode === true) {
//       setDrawingMode(false);
//     } else {
//       setDrawingMode(!drawingMode);
//     }

//     if (drawingMode === true) {
//       setDragging(false);
//     }
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };
//   const toggleDrMode = () => {
//     setDrMode(!drMode);

//     if (!drMode) {
//       setDrawingMode(false);
//       setDrawingModeparent(false);
//       setDrawingModechild(false);
//       setDragging(false);
//     }
//   };

//   return (
//     <>
//       <div className="map_header ria shadow">
//         <div className="container">
//           <ButtonListComponent
//             toggleDrawingMode={toggleDrawingMode}
//             toggleDrawingModeparent={toggleDrawingModeparent}
//             toggleDrawingModechild={toggleDrawingModechild}
//             drawingMode={drawingMode}
//             drawingModeparent={drawingModeparent}
//             drawingModechild={drawingModechild}
//             handleCopyBoxClick={handleCopyBoxClick}
//             handlePasteBoxClick={handlePasteBoxClick}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             boxes={boxes}
//             copiedBox={copiedBox}
//             isBoxCopied={isBoxCopied}
//             handleZoomIn={handleZoomIn}
//             handleZoomOut={handleZoomOut}
//             handleDeleteSelectedBox={handleDeleteSelectedBox}
//             boxNameInput={boxNameInput}
//             setBoxNameInput={setBoxNameInput}
//             drMode={drMode}
//             toggleDrMode={toggleDrMode}
//             handleUndo={handleUndo}
//             isCopyDisabled={boxes.length === 0} // Pass the disabled prop based on the condition
//           />
//           <button onClick={toggleDrMode}>
//             {drMode ? "True" : "False"} Drag
//           </button>
//         </div>
//       </div>
//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }}
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />

//             {/* <MappingDisplayComponent
//               boxes={boxes}
//               selectedBoxIndex={selectedBoxIndex}
//               handleSelectBoxClick={handleSelectBoxClick}
//               handleMouseDownOnBox = {handleMouseDownOnBox}
//               handleMouseUpOnBox = {handleMouseUpOnBox}
//               handleMouseMoveOnBox = {handleMouseMoveOnBox}
//             /> */}
//           </div>
//           <div>
//             {boxes.map((box, index) => (
//               <div
//                 key={index}
//                 onClick={() => handleSelectBoxClick(index)}
//                 onMouseDown={(event) => handleMouseDownOnBox(event, index)}
//                 onMouseUp={handleMouseUpOnBox}
//                 onMouseMove={handleMouseMoveOnBox}
//                 style={{
//                   border:
//                     selectedBoxIndex === index
//                       ? "2px solid orange"
//                       : "1px solid black",
//                   margin: "5px",
//                   padding: "5px",
//                   display: "inline-block",
//                 }}
//               >
//                 <p>
//                   Box {index + 1} ID: {box.id}
//                   <br />
//                   Box {index + 1} Name: {box.name}
//                   <br />
//                   Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) -
//                   ({box.end.x}, {box.end.y})
//                 </p>
//                 {box.mode === "parent" && (
//                   <div>
//                     <p>Child Boxes:</p>
//                     {box.children.map((childBox, childIndex) => (
//                       <p key={childIndex}>
//                         Box {childIndex + 1} ID: {childBox.id}
//                         <br />
//                         Child Box {childIndex + 1} Coordinates: (
//                         {childBox.start.x}, {childBox.start.y}) - (
//                         {childBox.end.x}, {childBox.end.y})
//                       </p>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//           <MappingDataComponent
//             boxes={boxes}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             handleSelectBoxClick={handleSelectBoxClick}
//             handleSelectChildBoxClick={handleSelectChildBoxClick}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;











//last update below are the code...date:- 05.04.2024
// ************************************
// Undo functionality
// ************************************


// import React, { useEffect, useState, useCallback } from "react";
// import MappingDataComponent from "../services/MappingDataComponent";
// import MappingDisplayComponent from "../services/MappingDisplayComponent";
// import ButtonListComponent from "../services/ButtonListComponent";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [drMode, setDrMode] = useState(false);
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(false);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(false);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");

//   const [history, setHistory] = useState([]);
//   const [historyIndex, setHistoryIndex] = useState(-1);

//   // Function to add state to history
//   const addToHistory = (newState) => {
//     setHistory((prevHistory) => [
//       ...prevHistory.slice(0, historyIndex + 1),
//       newState,
//     ]);
//     setHistoryIndex((prevIndex) => prevIndex + 1);
//   };

//   // Function to handle undo action
//   const handleUndo = () => {
//     if (historyIndex > 0) {
//       setHistoryIndex((prevIndex) => prevIndex - 1);
//       setBoxes(history[historyIndex - 1]);
//     }
//   };

//   // useEffect to update history whenever boxes state changes
//   useEffect(() => {
//     addToHistory(boxes);
//   }, [boxes]);

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     if (drMode) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       // Check if the click is inside any of the boxes or their children
//       let clickedBoxIndex = -1;
//       let clickedChildIndex = -1;

//       boxes.forEach((box, index) => {
//         if (
//           x >= box.start.x &&
//           x <= box.end.x &&
//           y >= box.start.y &&
//           y <= box.end.y
//         ) {
//           clickedBoxIndex = index;
//         }

//         if (box.mode === "parent" && box.children) {
//           box.children.forEach((childBox, childIndex) => {
//             if (
//               x >= childBox.start.x &&
//               x <= childBox.end.x &&
//               y >= childBox.start.y &&
//               y <= childBox.end.y
//             ) {
//               clickedBoxIndex = index;
//               clickedChildIndex = childIndex;
//             }
//           });
//         }
//       });

//       // If a box or its child is clicked, select it
//       if (clickedBoxIndex !== -1) {
//         handleSelectBoxClick(clickedBoxIndex);
//       }

//       if (clickedChildIndex !== -1) {
//         handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
//       }
//     } else if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         const minHeight = 7; // Minimum height requirement
//         const minWidth = 7; // Minimum width requirement

//         // Calculate height and width of the box
//         const height = Math.abs(endCoordinates.y - startCoordinates.y);
//         const width = Math.abs(endCoordinates.x - startCoordinates.x);

//         // Check if height and width meet the minimum requirement
//         if (height >= minHeight && width >= minWidth) {
//           let newBox;

//           if (drawingModeparent) {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "parent",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//               children: [],
//             };
//           } else {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "child",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//             };

//             const insideParent = boxes.some(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("insideParent", insideParent);

//             if (insideParent) {
//               const parentIndex = boxes.findIndex(
//                 (box) =>
//                   box.mode === "parent" &&
//                   newBox.start.x > box.start.x &&
//                   newBox.start.y > box.start.y &&
//                   newBox.end.x < box.end.x &&
//                   newBox.end.y < box.end.y
//               );
//               console.log("parentIndex", parentIndex);

//               const updatedBoxes = [...boxes];
//               updatedBoxes[parentIndex].children.push(newBox);
//               setBoxes(updatedBoxes);

//               return;
//             }
//           }

//           setBoxes([...boxes, newBox]);
//           // console.log("hello jii ", boxes);
//           setBoxNameInput("");
//           console.log(
//             "Boxes data:",
//             JSON.stringify([...boxes, newBox], null, 2)
//           );
//         } else {
//           console.log("Minimum height and width requirement not met");
//         }
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box, index) => {
//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       // Check if the current box is selected
//       if (index === selectedBoxIndex) {
//         context.strokeStyle = "orange"; // Change stroke color for the selected box
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox, childIndex) => {
//           console.log("hey i am child index...", index);
//           if (
//             index === selectedBoxIndex &&
//             childIndex === selectedchildBoxIndex
//           ) {
//             context.strokeStyle = "orange"; // Change stroke color for the selected child box
//           } else {
//             context.strokeStyle = "blue"; // Default stroke color for child boxes
//           }

//           // context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //  selected box , copy ,paste
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   const handleSelectChildBoxClick = (childindex, index) => {
//     // console.log("hey i am parent index....", index);

//     // console.log("hey i am child index....", childindex);
//     // setSelectedBoxIndex(index);
//     // setSelectedchildBoxIndex(childindex);

//     // setIsBoxCopied(false);
//     if (selectedchildBoxIndex === childindex) {
//       // If the same child box is clicked again, unselect it
//       setSelectedchildBoxIndex(null);
//       setIsBoxCopied(false); // Reset copied flag
//     } else {
//       setSelectedBoxIndex(index); // Select the parent box
//       setSelectedchildBoxIndex(childindex); // Select the child box
//       setIsBoxCopied(false); // Reset copied flag
//     }
//   };

//   const handleCopyBoxClick = useCallback(() => {
//     if (selectedBoxIndex !== null && boxes.length > 0) {
//       // if (boxes[selectedBoxIndex].children.length > 0) {
//       const selectedBox = boxes[selectedBoxIndex];
//       // console.log(
//       //   "hey i am selected box hehehehehhe..",
//       //   selectedBox.children.length
//       // );
//       // console.log("hey i am selected box mode..", selectedBox.mode);
//       // setCopiedBox(selectedBox);
//       // setIsBoxCopied(true); // Set the flag to true when a box is copied
//       // console.log("Box copied:", selectedBox);
//       // } else {
//       //   const selectedBox = boxes[selectedBoxIndex];
//       //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
//       //   setIsBoxCopied(true);
//       //   console.log("Hey i am copied child box....", copiedBox);
//       // }

//       if (selectedBox.mode === "parent") {
//         if (selectedBox.children.length <= 0) {
//           console.log("hey i am selected box mode..", selectedBox.mode);
//           setCopiedBox(selectedBox);
//           setIsBoxCopied(true); // Set the flag to true when a box is copied
//           console.log("Box copied:", selectedBox);
//         } else {
//           // console.log("hey i am selected box mode..", selectedBox);
//           // console.log(
//           //   "hey i am selected box child mode..",
//           //   selectedBox.children[selectedchildBoxIndex].id
//           // );
//           if (selectedchildBoxIndex !== null) {
//             // If a child box is selected, copy only that child
//             const selectedChildBox =
//               selectedBox.children[selectedchildBoxIndex];
//             console.log("Child Box copied:", selectedChildBox);
//             setCopiedBox(selectedChildBox);
//             setIsBoxCopied(true);
//           } else {
//             // If no child box is selected, copy the entire parent along with its children
//             if (selectedBox.mode === "parent") {
//               console.log("Parent Box copied:", selectedBox);
//               setCopiedBox(selectedBox);
//               setIsBoxCopied(true);
//             }
//           }

//           console.log("Hey i have child and parent both");
//         }
//       } else if (selectedBox.mode === "child") {
//         console.log("hey i am selected box mode..", selectedBox.mode);
//         setCopiedBox(selectedBox);
//         setIsBoxCopied(true); // Set the flag to true when a box is copied
//         console.log("Box copied:", selectedBox);
//       }
//     }
//   }, [selectedBoxIndex, selectedchildBoxIndex, boxes]);

//   const handlePasteBoxClick = useCallback(() => {
//     if (copiedBox) {
//       // const updatedBoxes = [...boxes, { ...copiedBox }];
//       // setBoxes(updatedBoxes);
//       // console.log("Box pasted:", copiedBox);
//       // Adjust the start and end coordinates of the copied box
//       const adjustedCopiedBox = {
//         ...copiedBox,
//         id: generateUniqueId(),
//         start: { x: 0, y: 0 },
//         end: {
//           x: copiedBox.width,
//           y: copiedBox.height,
//         },
//       };
//       // If the copied box is a parent box with children, adjust their positions
//       if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
//         adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
//           const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
//           return {
//             ...childBox,
//             id: newChildId,
//             start: {
//               x: childBox.start.x - copiedBox.start.x,
//               y: childBox.start.y - copiedBox.start.y,
//             },
//             end: {
//               x: childBox.end.x - copiedBox.start.x,
//               y: childBox.end.y - copiedBox.start.y,
//             },
//           };
//         });
//       }
//       const updatedBoxes = [...boxes, adjustedCopiedBox];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", adjustedCopiedBox);
//     }
//   }, [copiedBox, boxes]);

//   // till here copy paste functionality
//   // Ctrl + C functionality

//   const handleDeleteSelectedBox = () => {
//     if (selectedBoxIndex !== null) {
//       if (selectedchildBoxIndex !== null) {
//         // If a child box is selected, delete only that child box
//         const updatedBoxes = [...boxes];
//         updatedBoxes[selectedBoxIndex].children.splice(
//           selectedchildBoxIndex,
//           1
//         );
//         setSelectedchildBoxIndex(null); // Unselect the child box
//         setBoxes(updatedBoxes);
//         console.log("Child Box deleted");
//       } else {
//         // If no child box is selected, delete the entire parent box
//         const updatedBoxes = [...boxes];
//         updatedBoxes.splice(selectedBoxIndex, 1);
//         setSelectedBoxIndex(null);
//         setBoxes(updatedBoxes);
//         console.log("Box deleted");
//       }
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   // const toggleDrawingMode = () => {
//   //   setDrawingMode(!drawingMode);
//   //   setDragging(false);
//   // };
//   const toggleDrawingMode = () => {
//     if (drMode === true) {
//       setDrawingMode(false);
//     } else {
//       setDrawingMode(!drawingMode);
//     }

//     if (drawingMode === true) {
//       setDragging(false);
//     }
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };
//   const toggleDrMode = () => {
//     setDrMode(!drMode);

//     if (!drMode) {
//       setDrawingMode(false);
//       setDrawingModeparent(false);
//       setDrawingModechild(false);
//       setDragging(false);
//     }
//   };

//   return (
//     <>
//       <div className="map_header ria shadow">
//         <div className="container">
//           <ButtonListComponent
//             toggleDrawingMode={toggleDrawingMode}
//             toggleDrawingModeparent={toggleDrawingModeparent}
//             toggleDrawingModechild={toggleDrawingModechild}
//             drawingMode={drawingMode}
//             drawingModeparent={drawingModeparent}
//             drawingModechild={drawingModechild}
//             handleCopyBoxClick={handleCopyBoxClick}
//             handlePasteBoxClick={handlePasteBoxClick}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             boxes={boxes}
//             copiedBox={copiedBox}
//             isBoxCopied={isBoxCopied}
//             handleZoomIn={handleZoomIn}
//             handleZoomOut={handleZoomOut}
//             handleDeleteSelectedBox={handleDeleteSelectedBox}
//             boxNameInput={boxNameInput}
//             setBoxNameInput={setBoxNameInput}
//             drMode={drMode}
//             toggleDrMode={toggleDrMode}
//             handleUndo={handleUndo}
//             isCopyDisabled={boxes.length === 0} // Pass the disabled prop based on the condition
//           />
//           <button onClick={toggleDrMode}>
//             {drMode ? "True" : "False"} Drag
//           </button>
//         </div>
//       </div>
//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }}
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />

//             <MappingDisplayComponent
//               boxes={boxes}
//               selectedBoxIndex={selectedBoxIndex}
//               handleSelectBoxClick={handleSelectBoxClick}
//             />
//           </div>

//           <MappingDataComponent
//             boxes={boxes}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             handleSelectBoxClick={handleSelectBoxClick}
//             handleSelectChildBoxClick={handleSelectChildBoxClick}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

//last update below and above are the code...date:- 05.04.2024
// first modification
// import React, { useEffect, useState, useCallback } from "react";
// import MappingDataComponent from "../services/MappingDataComponent";
// import MappingDisplayComponent from "../services/MappingDisplayComponent";
// import ButtonListComponent from "../services/ButtonListComponent";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [drMode, setDrMode] = useState(false);
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(false);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   // const handleMouseDown = (event) => {
//   // console.log("hey i am  handleMouseDown event", event);
//   // if (drawingModeparent || drawingModechild) {
//   //   const canvas = document.getElementById("canvas");
//   //   const rect = canvas.getBoundingClientRect();
//   //   const x = (event.clientX - rect.left) / zoomFactor;
//   //   const y = (event.clientY - rect.top) / zoomFactor;

//   //   setStartCoordinates({ x, y });
//   //   setEndCoordinates({ x, y });
//   //   setDragging(true);
//   //   console.log("heyyy i am start co-ordianate", startCoordinates);
//   //   console.log("heyyy i am end co-ordianate", endCoordinates);
//   //   }
//   // };
//   // const handleMouseDown = (event) => {
//   //   if (drMode) {
//   //     const canvas = document.getElementById("canvas");
//   //     const rect = canvas.getBoundingClientRect();
//   //     const x = (event.clientX - rect.left) / zoomFactor;
//   //     const y = (event.clientY - rect.top) / zoomFactor;

//   //     // Check if the click is inside any of the boxes
//   //     const clickedBoxIndex = boxes.findIndex(
//   //       (box) =>
//   //         x >= box.start.x &&
//   //         x <= box.end.x &&
//   //         y >= box.start.y &&
//   //         y <= box.end.y
//   //     );

//   //     // If a box is clicked, select it
//   //     if (clickedBoxIndex !== -1) {
//   //       handleSelectBoxClick(clickedBoxIndex);
//   //     }
//   //   } else if (drawingModeparent || drawingModechild) {
//   //     // Your existing logic for drawing mode...
//   //     if (drawingModeparent || drawingModechild) {
//   //       const canvas = document.getElementById("canvas");
//   //       const rect = canvas.getBoundingClientRect();
//   //       const x = (event.clientX - rect.left) / zoomFactor;
//   //       const y = (event.clientY - rect.top) / zoomFactor;

//   //       setStartCoordinates({ x, y });
//   //       setEndCoordinates({ x, y });
//   //       setDragging(true);
//   //       console.log("heyyy i am start co-ordianate", startCoordinates);
//   //       console.log("heyyy i am end co-ordianate", endCoordinates);
//   //     }
//   //   }
//   // };
//   // selecting also the box drawned inside
//   // const handleMouseDown = (event) => {
//   //   if (drMode) {
//   //     const canvas = document.getElementById("canvas");
//   //     const rect = canvas.getBoundingClientRect();
//   //     const x = (event.clientX - rect.left) / zoomFactor;
//   //     const y = (event.clientY - rect.top) / zoomFactor;

//   //     // Check if the click is inside any of the boxes or their children
//   //     let clickedBoxIndex = -1;
//   //     let clickedChildIndex = -1;

//   //     boxes.forEach((box, index) => {
//   //       if (
//   //         x >= box.start.x &&
//   //         x <= box.end.x &&
//   //         y >= box.start.y &&
//   //         y <= box.end.y
//   //       ) {
//   //         clickedBoxIndex = index;
//   //         return;
//   //       }

//   //       if (box.children) {
//   //         box.children.forEach((childBox, childIndex) => {
//   //           if (
//   //             x >= childBox.start.x &&
//   //             x <= childBox.end.x &&
//   //             y >= childBox.start.y &&
//   //             y <= childBox.end.y
//   //           ) {
//   //             clickedBoxIndex = index;
//   //             clickedChildIndex = childIndex;
//   //             return;
//   //           }
//   //         });
//   //       }
//   //     });

//   //     // If a box or its child is clicked, select it
//   //     if (clickedBoxIndex !== -1) {
//   //       handleSelectBoxClick(clickedBoxIndex);
//   //     }

//   //     if (clickedChildIndex !== -1) {
//   //       handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
//   //     }
//   //   } else if (drawingModeparent || drawingModechild) {
//   //     // Your existing logic for drawing mode...
//   //     if (drawingModeparent || drawingModechild) {
//   //       const canvas = document.getElementById("canvas");
//   //       const rect = canvas.getBoundingClientRect();
//   //       const x = (event.clientX - rect.left) / zoomFactor;
//   //       const y = (event.clientY - rect.top) / zoomFactor;

//   //       setStartCoordinates({ x, y });
//   //       setEndCoordinates({ x, y });
//   //       setDragging(true);
//   //       console.log("heyyy i am start co-ordianate", startCoordinates);
//   //       console.log("heyyy i am end co-ordianate", endCoordinates);
//   //     }
//   //   }
//   // };
//   const handleMouseDown = (event) => {
//     if (drMode) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       // Check if the click is inside any of the boxes or their children
//       let clickedBoxIndex = -1;
//       let clickedChildIndex = -1;

//       boxes.forEach((box, index) => {
//         if (
//           x >= box.start.x &&
//           x <= box.end.x &&
//           y >= box.start.y &&
//           y <= box.end.y
//         ) {
//           clickedBoxIndex = index;
//         }

//         if (box.mode === "parent" && box.children) {
//           box.children.forEach((childBox, childIndex) => {
//             if (
//               x >= childBox.start.x &&
//               x <= childBox.end.x &&
//               y >= childBox.start.y &&
//               y <= childBox.end.y
//             ) {
//               clickedBoxIndex = index;
//               clickedChildIndex = childIndex;
//             }
//           });
//         }
//       });

//       // If a box or its child is clicked, select it
//       if (clickedBoxIndex !== -1) {
//         handleSelectBoxClick(clickedBoxIndex);
//       }

//       if (clickedChildIndex !== -1) {
//         handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
//       }
//     } else if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         const minHeight = 7; // Minimum height requirement
//         const minWidth = 7; // Minimum width requirement

//         // Calculate height and width of the box
//         const height = Math.abs(endCoordinates.y - startCoordinates.y);
//         const width = Math.abs(endCoordinates.x - startCoordinates.x);

//         // Check if height and width meet the minimum requirement
//         if (height >= minHeight && width >= minWidth) {
//           let newBox;

//           if (drawingModeparent) {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "parent",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//               children: [],
//             };
//           } else {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "child",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//             };

//             const insideParent = boxes.some(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("insideParent", insideParent);

//             if (insideParent) {
//               const parentIndex = boxes.findIndex(
//                 (box) =>
//                   box.mode === "parent" &&
//                   newBox.start.x > box.start.x &&
//                   newBox.start.y > box.start.y &&
//                   newBox.end.x < box.end.x &&
//                   newBox.end.y < box.end.y
//               );
//               console.log("parentIndex", parentIndex);

//               const updatedBoxes = [...boxes];
//               updatedBoxes[parentIndex].children.push(newBox);
//               setBoxes(updatedBoxes);

//               return;
//             }
//           }

//           setBoxes([...boxes, newBox]);
//           // console.log("hello jii ", boxes);
//           setBoxNameInput("");
//           console.log(
//             "Boxes data:",
//             JSON.stringify([...boxes, newBox], null, 2)
//           );
//         } else {
//           console.log("Minimum height and width requirement not met");
//         }
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   // const draw = () => {
//   //   const canvas = document.getElementById("canvas");
//   //   const context = canvas.getContext("2d");
//   //   context.clearRect(0, 0, canvas.width, canvas.height);

//   //   if (image) {
//   //     context.drawImage(
//   //       image,
//   //       0,
//   //       0,
//   //       canvas.width * zoomFactor,
//   //       canvas.height * zoomFactor
//   //     );
//   //   }

//   //   boxes.forEach((box) => {
//   //     //   console.log("hey i am bixxxx", box);

//   //     if (box.mode === "parent") {
//   //       context.strokeStyle = "green";
//   //     } else {
//   //       context.strokeStyle = "red";
//   //     }

//   //     context.lineWidth = 2;
//   //     context.strokeRect(
//   //       box.start.x * zoomFactor,
//   //       box.start.y * zoomFactor,
//   //       (box.end.x - box.start.x) * zoomFactor,
//   //       (box.end.y - box.start.y) * zoomFactor
//   //     );

//   //     if (box.mode === "parent") {
//   //       box.children.forEach((childBox) => {
//   //         context.strokeStyle = "blue";
//   //         context.strokeRect(
//   //           childBox.start.x * zoomFactor,
//   //           childBox.start.y * zoomFactor,
//   //           childBox.width * zoomFactor,
//   //           childBox.height * zoomFactor
//   //         );
//   //       });
//   //     }
//   //   });

//   //   if (drawingMode && dragging) {
//   //     context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//   //     context.lineWidth = 2;
//   //     context.strokeRect(
//   //       startCoordinates.x * zoomFactor,
//   //       startCoordinates.y * zoomFactor,
//   //       (endCoordinates.x - startCoordinates.x) * zoomFactor,
//   //       (endCoordinates.y - startCoordinates.y) * zoomFactor
//   //     );
//   //     // Display box name for the dragged box
//   //     context.fillStyle = "black";
//   //     context.font = "12px Arial";
//   //     context.fillText(
//   //       boxNameInput,
//   //       startCoordinates.x * zoomFactor + 5,
//   //       startCoordinates.y * zoomFactor + 15
//   //     );
//   //   }
//   // };

//   //   Copy paste functionality....

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box, index) => {
//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       // Check if the current box is selected
//       if (index === selectedBoxIndex) {
//         context.strokeStyle = "orange"; // Change stroke color for the selected box
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox, childIndex) => {
//           console.log("hey i am child index...", index);
//           if (
//             index === selectedBoxIndex &&
//             childIndex === selectedchildBoxIndex
//           ) {
//             context.strokeStyle = "orange"; // Change stroke color for the selected child box
//           } else {
//             context.strokeStyle = "blue"; // Default stroke color for child boxes
//           }

//           // context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //  selected box , copy ,paste
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   const handleSelectChildBoxClick = (childindex, index) => {
//     // console.log("hey i am parent index....", index);

//     // console.log("hey i am child index....", childindex);
//     // setSelectedBoxIndex(index);
//     // setSelectedchildBoxIndex(childindex);

//     // setIsBoxCopied(false);
//     if (selectedchildBoxIndex === childindex) {
//       // If the same child box is clicked again, unselect it
//       setSelectedchildBoxIndex(null);
//       setIsBoxCopied(false); // Reset copied flag
//     } else {
//       setSelectedBoxIndex(index); // Select the parent box
//       setSelectedchildBoxIndex(childindex); // Select the child box
//       setIsBoxCopied(false); // Reset copied flag
//     }
//   };

//   const handleCopyBoxClick = useCallback(() => {
//     if (selectedBoxIndex !== null) {
//       // if (boxes[selectedBoxIndex].children.length > 0) {
//       const selectedBox = boxes[selectedBoxIndex];
//       // console.log(
//       //   "hey i am selected box hehehehehhe..",
//       //   selectedBox.children.length
//       // );
//       // console.log("hey i am selected box mode..", selectedBox.mode);
//       // setCopiedBox(selectedBox);
//       // setIsBoxCopied(true); // Set the flag to true when a box is copied
//       // console.log("Box copied:", selectedBox);
//       // } else {
//       //   const selectedBox = boxes[selectedBoxIndex];
//       //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
//       //   setIsBoxCopied(true);
//       //   console.log("Hey i am copied child box....", copiedBox);
//       // }

//       if (selectedBox.mode === "parent") {
//         if (selectedBox.children.length <= 0) {
//           console.log("hey i am selected box mode..", selectedBox.mode);
//           setCopiedBox(selectedBox);
//           setIsBoxCopied(true); // Set the flag to true when a box is copied
//           console.log("Box copied:", selectedBox);
//         } else {
//           // console.log("hey i am selected box mode..", selectedBox);
//           // console.log(
//           //   "hey i am selected box child mode..",
//           //   selectedBox.children[selectedchildBoxIndex].id
//           // );
//           if (selectedchildBoxIndex !== null) {
//             // If a child box is selected, copy only that child
//             const selectedChildBox =
//               selectedBox.children[selectedchildBoxIndex];
//             console.log("Child Box copied:", selectedChildBox);
//             setCopiedBox(selectedChildBox);
//             setIsBoxCopied(true);
//           } else {
//             // If no child box is selected, copy the entire parent along with its children
//             if (selectedBox.mode === "parent") {
//               console.log("Parent Box copied:", selectedBox);
//               setCopiedBox(selectedBox);
//               setIsBoxCopied(true);
//             }
//           }

//           console.log("Hey i have child and parent both");
//         }
//       } else if (selectedBox.mode === "child") {
//         console.log("hey i am selected box mode..", selectedBox.mode);
//         setCopiedBox(selectedBox);
//         setIsBoxCopied(true); // Set the flag to true when a box is copied
//         console.log("Box copied:", selectedBox);
//       }
//     }
//   }, [selectedBoxIndex, selectedchildBoxIndex, boxes]);

//   const handlePasteBoxClick = useCallback(() => {
//     if (copiedBox) {
//       // const updatedBoxes = [...boxes, { ...copiedBox }];
//       // setBoxes(updatedBoxes);
//       // console.log("Box pasted:", copiedBox);
//       // Adjust the start and end coordinates of the copied box
//       const adjustedCopiedBox = {
//         ...copiedBox,
//         id: generateUniqueId(),
//         start: { x: 0, y: 0 },
//         end: {
//           x: copiedBox.width,
//           y: copiedBox.height,
//         },
//       };
//       // If the copied box is a parent box with children, adjust their positions
//       if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
//         adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
//           const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
//           return {
//             ...childBox,
//             id: newChildId,
//             start: {
//               x: childBox.start.x - copiedBox.start.x,
//               y: childBox.start.y - copiedBox.start.y,
//             },
//             end: {
//               x: childBox.end.x - copiedBox.start.x,
//               y: childBox.end.y - copiedBox.start.y,
//             },
//           };
//         });
//       }
//       const updatedBoxes = [...boxes, adjustedCopiedBox];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", adjustedCopiedBox);
//     }
//   }, [copiedBox, boxes]);

//   // till here copy paste functionality
//   // Ctrl + C functionality

//   const handleDeleteSelectedBox = () => {
//     if (selectedBoxIndex !== null) {
//       if (selectedchildBoxIndex !== null) {
//         // If a child box is selected, delete only that child box
//         const updatedBoxes = [...boxes];
//         updatedBoxes[selectedBoxIndex].children.splice(
//           selectedchildBoxIndex,
//           1
//         );
//         setSelectedchildBoxIndex(null); // Unselect the child box
//         setBoxes(updatedBoxes);
//         console.log("Child Box deleted");
//       } else {
//         // If no child box is selected, delete the entire parent box
//         const updatedBoxes = [...boxes];
//         updatedBoxes.splice(selectedBoxIndex, 1);
//         setSelectedBoxIndex(null);
//         setBoxes(updatedBoxes);
//         console.log("Box deleted");
//       }
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   // const toggleDrawingMode = () => {
//   //   setDrawingMode(!drawingMode);
//   //   setDragging(false);
//   // };
//   const toggleDrawingMode = () => {
//     if (drMode === true) {
//       setDrawingMode(false);
//     } else {
//       setDrawingMode(!drawingMode);
//     }

//     if (drawingMode === true) {
//       setDragging(false);
//     }
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };
//   const toggleDrMode = () => {
//     setDrMode(!drMode);

//     if (!drMode) {
//       setDrawingMode(false);
//       setDrawingModeparent(false);
//       setDrawingModechild(false);
//       setDragging(false);
//     }
//   };

//   return (
//     <>
//       <div className="map_header ria shadow">
//         <div className="container">
//           <ButtonListComponent
//             toggleDrawingMode={toggleDrawingMode}
//             toggleDrawingModeparent={toggleDrawingModeparent}
//             toggleDrawingModechild={toggleDrawingModechild}
//             drawingMode={drawingMode}
//             drawingModeparent={drawingModeparent}
//             drawingModechild={drawingModechild}
//             handleCopyBoxClick={handleCopyBoxClick}
//             handlePasteBoxClick={handlePasteBoxClick}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             boxes={boxes}
//             copiedBox={copiedBox}
//             isBoxCopied={isBoxCopied}
//             handleZoomIn={handleZoomIn}
//             handleZoomOut={handleZoomOut}
//             handleDeleteSelectedBox={handleDeleteSelectedBox}
//             boxNameInput={boxNameInput}
//             setBoxNameInput={setBoxNameInput}
//             drMode={drMode}
//             toggleDrMode={toggleDrMode}
//           />
//           <button onClick={toggleDrMode}>
//             {drMode ? "True" : "False"} Drag
//           </button>
//         </div>
//       </div>
//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }}
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />

//             <MappingDisplayComponent
//               boxes={boxes}
//               selectedBoxIndex={selectedBoxIndex}
//               handleSelectBoxClick={handleSelectBoxClick}
//             />
//           </div>

//           <MappingDataComponent
//             boxes={boxes}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             handleSelectBoxClick={handleSelectBoxClick}
//             handleSelectChildBoxClick={handleSelectChildBoxClick}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// *********************************************************************************
// import React, { useEffect, useState, useCallback } from "react";
// import MappingDataComponent from "../services/MappingDataComponent";
// import MappingDisplayComponent from "../services/MappingDisplayComponent";
// import ButtonListComponent from "../services/ButtonListComponent";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });

//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(false);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         const minHeight = 7; // Minimum height requirement
//         const minWidth = 7; // Minimum width requirement

//         // Calculate height and width of the box
//         const height = Math.abs(endCoordinates.y - startCoordinates.y);
//         const width = Math.abs(endCoordinates.x - startCoordinates.x);

//         // Check if height and width meet the minimum requirement
//         if (height >= minHeight && width >= minWidth) {
//           let newBox;

//           if (drawingModeparent) {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "parent",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//               children: [],
//             };
//           } else {
//             newBox = {
//               id: generateUniqueId(),
//               name: boxNameInput,
//               start: { ...startCoordinates },
//               end: { ...endCoordinates },
//               mode: "child",
//               height: Math.abs(endCoordinates.y - startCoordinates.y),
//               width: Math.abs(endCoordinates.x - startCoordinates.x),
//             };

//             const insideParent = boxes.some(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("insideParent", insideParent);

//             if (insideParent) {
//               const parentIndex = boxes.findIndex(
//                 (box) =>
//                   box.mode === "parent" &&
//                   newBox.start.x > box.start.x &&
//                   newBox.start.y > box.start.y &&
//                   newBox.end.x < box.end.x &&
//                   newBox.end.y < box.end.y
//               );
//               console.log("parentIndex", parentIndex);

//               const updatedBoxes = [...boxes];
//               updatedBoxes[parentIndex].children.push(newBox);
//               setBoxes(updatedBoxes);

//               return;
//             }
//           }

//           setBoxes([...boxes, newBox]);
//           // console.log("hello jii ", boxes);
//           setBoxNameInput("");
//           console.log(
//             "Boxes data:",
//             JSON.stringify([...boxes, newBox], null, 2)
//           );
//         } else {
//           console.log("Minimum height and width requirement not met");
//         }
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   // const draw = () => {
//   //   const canvas = document.getElementById("canvas");
//   //   const context = canvas.getContext("2d");
//   //   context.clearRect(0, 0, canvas.width, canvas.height);

//   //   if (image) {
//   //     context.drawImage(
//   //       image,
//   //       0,
//   //       0,
//   //       canvas.width * zoomFactor,
//   //       canvas.height * zoomFactor
//   //     );
//   //   }

//   //   boxes.forEach((box) => {
//   //     //   console.log("hey i am bixxxx", box);

//   //     if (box.mode === "parent") {
//   //       context.strokeStyle = "green";
//   //     } else {
//   //       context.strokeStyle = "red";
//   //     }

//   //     context.lineWidth = 2;
//   //     context.strokeRect(
//   //       box.start.x * zoomFactor,
//   //       box.start.y * zoomFactor,
//   //       (box.end.x - box.start.x) * zoomFactor,
//   //       (box.end.y - box.start.y) * zoomFactor
//   //     );

//   //     if (box.mode === "parent") {
//   //       box.children.forEach((childBox) => {
//   //         context.strokeStyle = "blue";
//   //         context.strokeRect(
//   //           childBox.start.x * zoomFactor,
//   //           childBox.start.y * zoomFactor,
//   //           childBox.width * zoomFactor,
//   //           childBox.height * zoomFactor
//   //         );
//   //       });
//   //     }
//   //   });

//   //   if (drawingMode && dragging) {
//   //     context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//   //     context.lineWidth = 2;
//   //     context.strokeRect(
//   //       startCoordinates.x * zoomFactor,
//   //       startCoordinates.y * zoomFactor,
//   //       (endCoordinates.x - startCoordinates.x) * zoomFactor,
//   //       (endCoordinates.y - startCoordinates.y) * zoomFactor
//   //     );
//   //     // Display box name for the dragged box
//   //     context.fillStyle = "black";
//   //     context.font = "12px Arial";
//   //     context.fillText(
//   //       boxNameInput,
//   //       startCoordinates.x * zoomFactor + 5,
//   //       startCoordinates.y * zoomFactor + 15
//   //     );
//   //   }
//   // };

//   //   Copy paste functionality....

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box, index) => {
//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       // Check if the current box is selected
//       if (index === selectedBoxIndex) {
//         context.strokeStyle = "orange"; // Change stroke color for the selected box
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox, childIndex) => {
//           console.log("hey i am child index...", index);
//           if (
//             index === selectedBoxIndex &&
//             childIndex === selectedchildBoxIndex
//           ) {
//             context.strokeStyle = "orange"; // Change stroke color for the selected child box
//           } else {
//             context.strokeStyle = "blue"; // Default stroke color for child boxes
//           }

//           // context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //  selected box , copy ,paste
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   const handleSelectChildBoxClick = (childindex, index) => {
//     // console.log("hey i am parent index....", index);

//     // console.log("hey i am child index....", childindex);
//     // setSelectedBoxIndex(index);
//     // setSelectedchildBoxIndex(childindex);

//     // setIsBoxCopied(false);
//     if (selectedchildBoxIndex === childindex) {
//       // If the same child box is clicked again, unselect it
//       setSelectedchildBoxIndex(null);
//       setIsBoxCopied(false); // Reset copied flag
//     } else {
//       setSelectedBoxIndex(index); // Select the parent box
//       setSelectedchildBoxIndex(childindex); // Select the child box
//       setIsBoxCopied(false); // Reset copied flag
//     }
//   };

//   const handleCopyBoxClick = useCallback(() => {
//     if (selectedBoxIndex !== null) {
//       // if (boxes[selectedBoxIndex].children.length > 0) {
//       const selectedBox = boxes[selectedBoxIndex];
//       // console.log(
//       //   "hey i am selected box hehehehehhe..",
//       //   selectedBox.children.length
//       // );
//       // console.log("hey i am selected box mode..", selectedBox.mode);
//       // setCopiedBox(selectedBox);
//       // setIsBoxCopied(true); // Set the flag to true when a box is copied
//       // console.log("Box copied:", selectedBox);
//       // } else {
//       //   const selectedBox = boxes[selectedBoxIndex];
//       //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
//       //   setIsBoxCopied(true);
//       //   console.log("Hey i am copied child box....", copiedBox);
//       // }

//       if (selectedBox.mode === "parent") {
//         if (selectedBox.children.length <= 0) {
//           console.log("hey i am selected box mode..", selectedBox.mode);
//           setCopiedBox(selectedBox);
//           setIsBoxCopied(true); // Set the flag to true when a box is copied
//           console.log("Box copied:", selectedBox);
//         } else {
//           // console.log("hey i am selected box mode..", selectedBox);
//           // console.log(
//           //   "hey i am selected box child mode..",
//           //   selectedBox.children[selectedchildBoxIndex].id
//           // );
//           if (selectedchildBoxIndex !== null) {
//             // If a child box is selected, copy only that child
//             const selectedChildBox =
//               selectedBox.children[selectedchildBoxIndex];
//             console.log("Child Box copied:", selectedChildBox);
//             setCopiedBox(selectedChildBox);
//             setIsBoxCopied(true);
//           } else {
//             // If no child box is selected, copy the entire parent along with its children
//             if (selectedBox.mode === "parent") {
//               console.log("Parent Box copied:", selectedBox);
//               setCopiedBox(selectedBox);
//               setIsBoxCopied(true);
//             }
//           }

//           console.log("Hey i have child and parent both");
//         }
//       } else if (selectedBox.mode === "child") {
//         console.log("hey i am selected box mode..", selectedBox.mode);
//         setCopiedBox(selectedBox);
//         setIsBoxCopied(true); // Set the flag to true when a box is copied
//         console.log("Box copied:", selectedBox);
//       }
//     }
//   }, [selectedBoxIndex, selectedchildBoxIndex, boxes]);

//   const handlePasteBoxClick = useCallback(() => {
//     if (copiedBox) {
//       // const updatedBoxes = [...boxes, { ...copiedBox }];
//       // setBoxes(updatedBoxes);
//       // console.log("Box pasted:", copiedBox);
//       // Adjust the start and end coordinates of the copied box
//       const adjustedCopiedBox = {
//         ...copiedBox,
//         id: generateUniqueId(),
//         start: { x: 0, y: 0 },
//         end: {
//           x: copiedBox.width,
//           y: copiedBox.height,
//         },
//       };
//       // If the copied box is a parent box with children, adjust their positions
//       if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
//         adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
//           const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
//           return {
//             ...childBox,
//             id: newChildId,
//             start: {
//               x: childBox.start.x - copiedBox.start.x,
//               y: childBox.start.y - copiedBox.start.y,
//             },
//             end: {
//               x: childBox.end.x - copiedBox.start.x,
//               y: childBox.end.y - copiedBox.start.y,
//             },
//           };
//         });
//       }
//       const updatedBoxes = [...boxes, adjustedCopiedBox];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", adjustedCopiedBox);
//     }
//   }, [copiedBox, boxes]);

//   // till here copy paste functionality
//   // Ctrl + C functionality

//   const handleDeleteSelectedBox = () => {
//     if (selectedBoxIndex !== null) {
//       if (selectedchildBoxIndex !== null) {
//         // If a child box is selected, delete only that child box
//         const updatedBoxes = [...boxes];
//         updatedBoxes[selectedBoxIndex].children.splice(
//           selectedchildBoxIndex,
//           1
//         );
//         setSelectedchildBoxIndex(null); // Unselect the child box
//         setBoxes(updatedBoxes);
//         console.log("Child Box deleted");
//       } else {
//         // If no child box is selected, delete the entire parent box
//         const updatedBoxes = [...boxes];
//         updatedBoxes.splice(selectedBoxIndex, 1);
//         setSelectedBoxIndex(null);
//         setBoxes(updatedBoxes);
//         console.log("Box deleted");
//       }
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <div className="map_header ria shadow">
//         <div className="container">
//           <ButtonListComponent
//             toggleDrawingMode={toggleDrawingMode}
//             toggleDrawingModeparent={toggleDrawingModeparent}
//             toggleDrawingModechild={toggleDrawingModechild}
//             drawingMode={drawingMode}
//             drawingModeparent={drawingModeparent}
//             drawingModechild={drawingModechild}
//             handleCopyBoxClick={handleCopyBoxClick}
//             handlePasteBoxClick={handlePasteBoxClick}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             boxes={boxes}
//             copiedBox={copiedBox}
//             isBoxCopied={isBoxCopied}
//             handleZoomIn={handleZoomIn}
//             handleZoomOut={handleZoomOut}
//             handleDeleteSelectedBox={handleDeleteSelectedBox}
//             boxNameInput={boxNameInput}
//             setBoxNameInput={setBoxNameInput}
//           />
//         </div>
//       </div>
//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }}
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />

//             <MappingDisplayComponent
//               boxes={boxes}
//               selectedBoxIndex={selectedBoxIndex}
//               handleSelectBoxClick={handleSelectBoxClick}
//             />
//           </div>

//           <MappingDataComponent
//             boxes={boxes}
//             selectedBoxIndex={selectedBoxIndex}
//             selectedchildBoxIndex={selectedchildBoxIndex}
//             handleSelectBoxClick={handleSelectBoxClick}
//             handleSelectChildBoxClick={handleSelectChildBoxClick}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// Last modification on date :- 04.04.2024*************************************************

// import React, { useEffect, useState, useCallback } from "react";
// import { BsCheck, BsCheckAll } from "react-icons/bs";
// import { MdDelete } from "react-icons/md";
// import { FaMinus, FaPlus, FaRegCopy, FaSearch } from "react-icons/fa";
// import { PiCursorBold } from "react-icons/pi";
// import map1 from "../data/map1.json";
// import { LuZoomIn, LuZoomOut } from "react-icons/lu";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });

//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(false);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const [iconColor, setIconColor] = useState("");
//   const [iconColorzo, setIconColorzo] = useState("");

//   const handleMouseOver = () => {
//     setIconColor("yellow");
//   };

//   const handleMouseOut = () => {
//     setIconColor("");
//   };

//   const handleMouseOverzoomout = () => {
//     setIconColorzo("yellow");
//   };
//   const handleMouseOutzoomout = () => {
//     setIconColorzo("");
//   };

//   const [data, setData] = useState(map1);
//   const handleDropDown = (item) => {
//     console.log(item);
//   };

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         // console.log("hello jii ", boxes);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   const handleSelectChildBoxClick = (childindex, index) => {
//     // console.log("hey i am parent index....", index);

//     // console.log("hey i am child index....", childindex);
//     // setSelectedBoxIndex(index);
//     // setSelectedchildBoxIndex(childindex);

//     // setIsBoxCopied(false);
//     if (selectedchildBoxIndex === childindex) {
//       // If the same child box is clicked again, unselect it
//       setSelectedchildBoxIndex(null);
//       setIsBoxCopied(false); // Reset copied flag
//     } else {
//       setSelectedBoxIndex(index); // Select the parent box
//       setSelectedchildBoxIndex(childindex); // Select the child box
//       setIsBoxCopied(false); // Reset copied flag
//     }
//   };

//   const handleCopyBoxClick = useCallback(() => {
//     if (selectedBoxIndex !== null) {
//       // if (boxes[selectedBoxIndex].children.length > 0) {
//       const selectedBox = boxes[selectedBoxIndex];
//       // console.log(
//       //   "hey i am selected box hehehehehhe..",
//       //   selectedBox.children.length
//       // );
//       // console.log("hey i am selected box mode..", selectedBox.mode);
//       // setCopiedBox(selectedBox);
//       // setIsBoxCopied(true); // Set the flag to true when a box is copied
//       // console.log("Box copied:", selectedBox);
//       // } else {
//       //   const selectedBox = boxes[selectedBoxIndex];
//       //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
//       //   setIsBoxCopied(true);
//       //   console.log("Hey i am copied child box....", copiedBox);
//       // }

//       if (selectedBox.mode === "parent") {
//         if (selectedBox.children.length <= 0) {
//           console.log("hey i am selected box mode..", selectedBox.mode);
//           setCopiedBox(selectedBox);
//           setIsBoxCopied(true); // Set the flag to true when a box is copied
//           console.log("Box copied:", selectedBox);
//         } else {
//           // console.log("hey i am selected box mode..", selectedBox);
//           // console.log(
//           //   "hey i am selected box child mode..",
//           //   selectedBox.children[selectedchildBoxIndex].id
//           // );
//           if (selectedchildBoxIndex !== null) {
//             // If a child box is selected, copy only that child
//             const selectedChildBox =
//               selectedBox.children[selectedchildBoxIndex];
//             console.log("Child Box copied:", selectedChildBox);
//             setCopiedBox(selectedChildBox);
//             setIsBoxCopied(true);
//           } else {
//             // If no child box is selected, copy the entire parent along with its children
//             if (selectedBox.mode === "parent") {
//               console.log("Parent Box copied:", selectedBox);
//               setCopiedBox(selectedBox);
//               setIsBoxCopied(true);
//             }
//           }

//           console.log("Hey i have child and parent both");
//         }
//       } else if (selectedBox.mode === "child") {
//         console.log("hey i am selected box mode..", selectedBox.mode);
//         setCopiedBox(selectedBox);
//         setIsBoxCopied(true); // Set the flag to true when a box is copied
//         console.log("Box copied:", selectedBox);
//       }
//     }
//   }, [selectedBoxIndex, selectedchildBoxIndex,  boxes]);
//   // ... (existing code)

//   const handlePasteBoxClick = useCallback(() => {
//     if (copiedBox) {
//       // const updatedBoxes = [...boxes, { ...copiedBox }];
//       // setBoxes(updatedBoxes);
//       // console.log("Box pasted:", copiedBox);
//       // Adjust the start and end coordinates of the copied box
//       const adjustedCopiedBox = {
//         ...copiedBox,
//         id: generateUniqueId(),
//         start: { x: 0, y: 0 },
//         end: {
//           x: copiedBox.width,
//           y: copiedBox.height,
//         },
//       };
//       // If the copied box is a parent box with children, adjust their positions
//       if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
//         adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
//           const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
//           return {
//             ...childBox,
//             id: newChildId,
//             start: {
//               x: childBox.start.x - copiedBox.start.x,
//               y: childBox.start.y - copiedBox.start.y,
//             },
//             end: {
//               x: childBox.end.x - copiedBox.start.x,
//               y: childBox.end.y - copiedBox.start.y,
//             },
//           };
//         });
//       }
//       const updatedBoxes = [...boxes, adjustedCopiedBox];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", adjustedCopiedBox);
//     }
//   }, [copiedBox, boxes]);
//   // ... (existing code)

//   // till here copy paste functionality
//   // Ctrl + C functionality
//   // Add the following useEffect to listen for the Ctrl+C key combination
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       // Check if Ctrl (or Command on Mac) key is pressed and the pressed key is 'c'
//       if ((event.ctrlKey || event.metaKey) && event.key === "c") {
//         handleCopyBoxClick();
//       }
//     };

//     // Add event listener for keydown
//     document.addEventListener("keydown", handleKeyDown);

//     // Remove the event listener when the component is unmounted
//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [handleCopyBoxClick]);
//   // Ctrl + V functionality
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       // Check if Ctrl (or Command on Mac) key is pressed and the pressed key is 'v'
//       if ((event.ctrlKey || event.metaKey) && event.key === "v") {
//         handlePasteBoxClick();
//       }
//     };

//     // Add event listener for keydown
//     document.addEventListener("keydown", handleKeyDown);

//     // Remove the event listener when the component is unmounted
//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [handlePasteBoxClick]);

//   // Delete functionality for the selected box
//   // const handleDeleteSelectedBox = () => {
//   //   if (selectedBoxIndex !== null) {
//   //     const updatedBoxes = [...boxes];
//   //     updatedBoxes.splice(selectedBoxIndex, 1);
//   //     setSelectedBoxIndex(null);
//   //     setBoxes(updatedBoxes);
//   //     console.log("Box deleted");
//   //   }
//   // };

//   const handleDeleteSelectedBox = () => {
//     if (selectedBoxIndex !== null) {
//       if (selectedchildBoxIndex !== null) {
//         // If a child box is selected, delete only that child box
//         const updatedBoxes = [...boxes];
//         updatedBoxes[selectedBoxIndex].children.splice(
//           selectedchildBoxIndex,
//           1
//         );
//         setSelectedchildBoxIndex(null); // Unselect the child box
//         setBoxes(updatedBoxes);
//         console.log("Child Box deleted");
//       } else {
//         // If no child box is selected, delete the entire parent box
//         const updatedBoxes = [...boxes];
//         updatedBoxes.splice(selectedBoxIndex, 1);
//         setSelectedBoxIndex(null);
//         setBoxes(updatedBoxes);
//         console.log("Box deleted");
//       }
//     }
//   };

//   const handleToggleBox = (index) => {
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   useEffect(() => {
//     draw();
//   }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }

//     // Update the isOpen property for the selected parent box
//     //   if (
//     //     selectedBoxIndex !== null &&
//     //     boxes[selectedBoxIndex]?.mode === "parent"
//     //   ) {
//     //     const updatedBoxes = [...boxes];
//     //     updatedBoxes[selectedBoxIndex].isOpen =
//     //       !updatedBoxes[selectedBoxIndex]?.isOpen;
//     //     setBoxes(updatedBoxes);
//     //   }
//   };

//   return (
//     <>
//       <div className="map_header ria shadow">
//         <div className="container">
//           <ul>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Cursor"
//                 name="Cursor"
//                 onClick={toggleDrawingMode}
//               >
//                 {/* <PiCursorBold /> */}
//                 {drawingMode ? (
//                   <PiCursorBold />
//                 ) : (
//                   <PiCursorBold style={{ color: "yellow" }} />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker Group"
//                 name="parent"
//                 onClick={toggleDrawingModeparent}
//               >
//                 {drawingModeparent ? (
//                   <span style={{ color: "yellow" }}>CG</span>
//                 ) : (
//                   "CG"
//                 )}
//                 {/* {drawingModeparent ? "Dp" : "Ep"}    */}
//                 {/* <FaSearch /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker"
//                 name="Child"
//                 onClick={toggleDrawingModechild}
//               >
//                 {drawingModechild ? (
//                   <span style={{ color: "yellow" }}>C</span>
//                 ) : (
//                   "C"
//                 )}

//                 {/* {drawingModechild ? "Dc" : "Ec"} */}
//                 {/* <CiEdit /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Copy"
//                 name="copy"
//                 onClick={handleCopyBoxClick}
//                 disabled={selectedBoxIndex === null}
//               >
//                 {/* <FaSearch />C */}
//                 {/* <FaRegCopy /> */}
//                 {isBoxCopied ? (
//                   <FaRegCopy style={{ color: "yellow" }} />
//                 ) : (
//                   <FaRegCopy />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Paste"
//                 name="paste"
//                 onClick={handlePasteBoxClick}
//                 disabled={!copiedBox}
//               >
//                 {/* <FaSearch /> */}P
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomIn"
//                 name="ZoomIn"
//                 onMouseOver={handleMouseOver}
//                 onMouseOut={handleMouseOut}
//                 onClick={handleZoomIn}
//               >
//                 <LuZoomIn style={{ color: iconColor }} />
//                 {/* style={{ color: iconColor }}  */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomOut"
//                 name="ZoomOut"
//                 onMouseOver={handleMouseOverzoomout}
//                 onMouseOut={handleMouseOutzoomout}
//                 onClick={handleZoomOut}
//               >
//                 {/* <FaSearch /> Zout */}
//                 <LuZoomOut style={{ color: iconColorzo }} />
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomOut"
//                 name="ZoomOut"
//                 onClick={handleDeleteSelectedBox}
//                 disabled={selectedBoxIndex === null}
//               >
//                 {/* <FaSearch /> Zout */}
//                 <MdDelete />
//               </button>
//             </li>
//             <li>
//               <input
//                 type="text"
//                 placeholder="Enter box name"
//                 value={boxNameInput}
//                 onChange={(e) => setBoxNameInput(e.target.value)}
//                 className="form-control mt-3"
//               />
//             </li>
//           </ul>
//         </div>
//       </div>
//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             {/* <div className="mapping_image"> */}
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }} // Add border for visualization
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />
//             <div>
//               {boxes.map((box, index) => (
//                 <div
//                   key={index}
//                   onClick={() => handleSelectBoxClick(index)}
//                   style={{
//                     border:
//                       selectedBoxIndex === index
//                         ? "2px solid orange"
//                         : "1px solid black",
//                     margin: "5px",
//                     padding: "5px",
//                     display: "inline-block",
//                   }}
//                 >
//                   <p>
//                     Box {index + 1} ID: {box.id}
//                     <br />
//                     Box {index + 1} Name: {box.name}
//                     <br />
//                     Box {index + 1} Coordinates: ({box.start.x}, {box.start.y})
//                     - ({box.end.x}, {box.end.y})
//                   </p>
//                   {box.mode === "parent" && (
//                     <div>
//                       <p>Child Boxes:</p>
//                       {box.children.map((childBox, childIndex) => (
//                         <p key={childIndex}>
//                           Box {childIndex + 1} ID: {childBox.id}
//                           <br />
//                           Child Box {childIndex + 1} Coordinates: (
//                           {childBox.start.x}, {childBox.start.y}) - (
//                           {childBox.end.x}, {childBox.end.y})
//                         </p>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="mapping_data">
//             <ul>
//               {boxes &&
//                 boxes.map((box, index) => (
//                   <li key={index}>
//                     {/* <p onClick={() => handleToggleBox(index)}> */}
//                     <p
//                       onClick={() => handleSelectBoxClick(index)}
//                       style={{
//                         border:
//                           selectedBoxIndex === index
//                             ? "2px solid orange"
//                             : "1px solid black",
//                         margin: "5px",
//                         padding: "5px",
//                         display: "inline-block",
//                       }}
//                     >
//                       {box?.mode === "parent" ? (
//                         box?.isOpen ? (
//                           <>
//                             <FaMinus className="plusminus" />{" "}
//                             <BsCheckAll className="type" />{" "}
//                             <span>{box?.mode}Q</span>
//                             <span>{index + 1}</span>
//                           </>
//                         ) : (
//                           <>
//                             <FaPlus className="plusminus" />{" "}
//                             <BsCheckAll className="type" />{" "}
//                             <span>{box?.mode}Q</span>
//                             <span>{index + 1}</span>
//                           </>
//                         )
//                       ) : (
//                         <span>
//                           <BsCheck className="type" /> <span>{box?.mode}</span>
//                           <span>C {index + 1}</span>
//                         </span>
//                       )}
//                     </p>
//                     {box?.mode === "parent" && box.isOpen && (
//                       <ul className="drop">
//                         <p>Child Boxes:</p>

//                         {box.children.map((childBox, childIndex) => (
//                           <li key={childIndex}>
//                             <p
//                               onClick={() =>
//                                 handleSelectChildBoxClick(childIndex, index)
//                               }
//                               style={{
//                                 border:
//                                   selectedchildBoxIndex === childIndex
//                                     ? "2px solid green"
//                                     : "1px solid black",
//                                 margin: "5px",
//                                 padding: "5px",
//                                 display: "inline-block",
//                               }}
//                             >
//                               Child {childIndex + 1}
//                               <br />
//                             </p>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </li>
//                 ))}
//             </ul>
//           </div>

//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// *******************************content discription of above code ************************************************

// allow alow the multiple selections of the boxes
// Last day code date;- 03.04.2024(all code are working including the following changes)
// 1. select the individual boxes i.e the individual child boxes  present in the parent
// 2. the selected individual boxes can be individually deleted , copied etc
// 3. when you again click on the individual selected box the box will be unselected
// 4. this feature is only for selected child box which is present in the parent box.
//    for the boxes independent (children or parent boxes) this feature is not there
//5. when the parent box (containing children) is selected and the child(within the parent box)
//will be selected then when we will use the copy functionality the child box will be copied
//or deleted if you want to copy parent then you have to disable the child selection. Once
//you disable the child selection then you can copy the parent alongwith their children(
//Note: individual selection of the parent(which containing child) will result only the
// parent selection alongwith their children)
//ctrl+v,ctrl+c --->check it is also woking in this code

// import React, { useEffect, useState, useCallback } from "react";
// import { BsCheck, BsCheckAll } from "react-icons/bs";
// import { MdDelete } from "react-icons/md";
// import { FaMinus, FaPlus, FaRegCopy, FaSearch } from "react-icons/fa";
// import { PiCursorBold } from "react-icons/pi";
// import map1 from "../data/map1.json";
// import { LuZoomIn, LuZoomOut } from "react-icons/lu";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });

//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(false);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const [iconColor, setIconColor] = useState("");
//   const [iconColorzo, setIconColorzo] = useState("");

//   const handleMouseOver = () => {
//     setIconColor("yellow");
//   };

//   const handleMouseOut = () => {
//     setIconColor("");
//   };

//   const handleMouseOverzoomout = () => {
//     setIconColorzo("yellow");
//   };
//   const handleMouseOutzoomout = () => {
//     setIconColorzo("");
//   };

//   const [data, setData] = useState(map1);
//   const handleDropDown = (item) => {
//     console.log(item);
//   };

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         // console.log("hello jii ", boxes);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   const handleCopyBoxClick = useCallback(() => {
//     if (selectedBoxIndex !== null) {
//       const selectedBox = boxes[selectedBoxIndex];
//       setCopiedBox(selectedBox);
//       setIsBoxCopied(true); // Set the flag to true when a box is copied
//       console.log("Box copied:", selectedBox);
//     }
//   }, [selectedBoxIndex, boxes]);
//   // ... (existing code)

//   const handlePasteBoxClick = useCallback(() => {
//     if (copiedBox) {
//       // const updatedBoxes = [...boxes, { ...copiedBox }];
//       // setBoxes(updatedBoxes);
//       // console.log("Box pasted:", copiedBox);
//       // Adjust the start and end coordinates of the copied box
//       const adjustedCopiedBox = {
//         ...copiedBox,
//         id: generateUniqueId(),
//         start: { x: 0, y: 0 },
//         end: {
//           x: copiedBox.width,
//           y: copiedBox.height,
//         },
//       };
//       // If the copied box is a parent box with children, adjust their positions
//       if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
//         adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
//           const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
//           return {
//             ...childBox,
//             id: newChildId,
//             start: {
//               x: childBox.start.x - copiedBox.start.x,
//               y: childBox.start.y - copiedBox.start.y,
//             },
//             end: {
//               x: childBox.end.x - copiedBox.start.x,
//               y: childBox.end.y - copiedBox.start.y,
//             },
//           };
//         });
//       }
//       const updatedBoxes = [...boxes, adjustedCopiedBox];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", adjustedCopiedBox);
//     }
//   }, [copiedBox, boxes]);
//   // ... (existing code)

//   // till here copy paste functionality
//   // Ctrl + C functionality
//   // Add the following useEffect to listen for the Ctrl+C key combination
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       // Check if Ctrl (or Command on Mac) key is pressed and the pressed key is 'c'
//       if ((event.ctrlKey || event.metaKey) && event.key === "c") {
//         handleCopyBoxClick();
//       }
//     };

//     // Add event listener for keydown
//     document.addEventListener("keydown", handleKeyDown);

//     // Remove the event listener when the component is unmounted
//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [handleCopyBoxClick]);
//   // Ctrl + V functionality
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       // Check if Ctrl (or Command on Mac) key is pressed and the pressed key is 'v'
//       if ((event.ctrlKey || event.metaKey) && event.key === "v") {
//         handlePasteBoxClick();
//       }
//     };

//     // Add event listener for keydown
//     document.addEventListener("keydown", handleKeyDown);

//     // Remove the event listener when the component is unmounted
//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [handlePasteBoxClick]);

//   // Delete functionality for the selected box
//   const handleDeleteSelectedBox = () => {
//     if (selectedBoxIndex !== null) {
//       const updatedBoxes = [...boxes];
//       updatedBoxes.splice(selectedBoxIndex, 1);
//       setSelectedBoxIndex(null);
//       setBoxes(updatedBoxes);
//       console.log("Box deleted");
//     }
//   };
//   const handleToggleBox = (index) => {
//     setBoxes((prevBoxes) => {
//       const newBoxes = [...prevBoxes];
//       const box = newBoxes[index];

//       if (box.mode === "parent") {
//         box.isOpen = !box.isOpen;
//       }

//       return newBoxes;
//     });
//   };

//   useEffect(() => {
//     draw();
//   }, [draw, image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }

//     // Update the isOpen property for the selected parent box
//     //   if (
//     //     selectedBoxIndex !== null &&
//     //     boxes[selectedBoxIndex]?.mode === "parent"
//     //   ) {
//     //     const updatedBoxes = [...boxes];
//     //     updatedBoxes[selectedBoxIndex].isOpen =
//     //       !updatedBoxes[selectedBoxIndex]?.isOpen;
//     //     setBoxes(updatedBoxes);
//     //   }
//   };

//   return (
//     <>
//       <div className="map_header ria shadow">
//         <div className="container">
//           <ul>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Cursor"
//                 name="Cursor"
//                 onClick={toggleDrawingMode}
//               >
//                 {/* <PiCursorBold /> */}
//                 {drawingMode ? (
//                   <PiCursorBold />
//                 ) : (
//                   <PiCursorBold style={{ color: "yellow" }} />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker Group"
//                 name="parent"
//                 onClick={toggleDrawingModeparent}
//               >
//                 {drawingModeparent ? (
//                   <span style={{ color: "yellow" }}>CG</span>
//                 ) : (
//                   "CG"
//                 )}
//                 {/* {drawingModeparent ? "Dp" : "Ep"}    */}
//                 {/* <FaSearch /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker"
//                 name="Child"
//                 onClick={toggleDrawingModechild}
//               >
//                 {drawingModechild ? (
//                   <span style={{ color: "yellow" }}>C</span>
//                 ) : (
//                   "C"
//                 )}

//                 {/* {drawingModechild ? "Dc" : "Ec"} */}
//                 {/* <CiEdit /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Copy"
//                 name="copy"
//                 onClick={handleCopyBoxClick}
//                 disabled={selectedBoxIndex === null}
//               >
//                 {/* <FaSearch />C */}
//                 {/* <FaRegCopy /> */}
//                 {isBoxCopied ? (
//                   <FaRegCopy style={{ color: "yellow" }} />
//                 ) : (
//                   <FaRegCopy />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Paste"
//                 name="paste"
//                 onClick={handlePasteBoxClick}
//                 disabled={!copiedBox}
//               >
//                 {/* <FaSearch /> */}P
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomIn"
//                 name="ZoomIn"
//                 onMouseOver={handleMouseOver}
//                 onMouseOut={handleMouseOut}
//                 onClick={handleZoomIn}
//               >
//                 <LuZoomIn style={{ color: iconColor }} />
//                 {/* style={{ color: iconColor }}  */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomOut"
//                 name="ZoomOut"
//                 onMouseOver={handleMouseOverzoomout}
//                 onMouseOut={handleMouseOutzoomout}
//                 onClick={handleZoomOut}
//               >
//                 {/* <FaSearch /> Zout */}
//                 <LuZoomOut style={{ color: iconColorzo }} />
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomOut"
//                 name="ZoomOut"
//                 onClick={handleDeleteSelectedBox}
//                 disabled={selectedBoxIndex === null}
//               >
//                 {/* <FaSearch /> Zout */}
//                 <MdDelete />
//               </button>
//             </li>
//             <li>
//               <input
//                 type="text"
//                 placeholder="Enter box name"
//                 value={boxNameInput}
//                 onChange={(e) => setBoxNameInput(e.target.value)}
//                 className="form-control mt-3"
//               />
//             </li>
//           </ul>
//         </div>
//       </div>
//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             {/* <div className="mapping_image"> */}
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }} // Add border for visualization
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />
//             <div>
//               {boxes.map((box, index) => (
//                 <div
//                   key={index}
//                   onClick={() => handleSelectBoxClick(index)}
//                   style={{
//                     border:
//                       selectedBoxIndex === index
//                         ? "2px solid orange"
//                         : "1px solid black",
//                     margin: "5px",
//                     padding: "5px",
//                     display: "inline-block",
//                   }}
//                 >
//                   <p>
//                     Box {index + 1} ID: {box.id}
//                     <br />
//                     Box {index + 1} Name: {box.name}
//                     <br />
//                     Box {index + 1} Coordinates: ({box.start.x}, {box.start.y})
//                     - ({box.end.x}, {box.end.y})
//                   </p>
//                   {box.mode === "parent" && (
//                     <div>
//                       <p>Child Boxes:</p>
//                       {box.children.map((childBox, childIndex) => (
//                         <p key={childIndex}>
//                           Box {childIndex + 1} ID: {childBox.id}
//                           <br />
//                           Child Box {childIndex + 1} Coordinates: (
//                           {childBox.start.x}, {childBox.start.y}) - (
//                           {childBox.end.x}, {childBox.end.y})
//                         </p>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="mapping_data">
//             <ul>
//               {boxes &&
//                 boxes.map((box, index) => (
//                   <li key={index}>
//                     {/* <p onClick={() => handleToggleBox(index)}> */}
//                     <p
//                       onClick={() => handleSelectBoxClick(index)}
//                       style={{
//                         border:
//                           selectedBoxIndex === index
//                             ? "2px solid orange"
//                             : "1px solid black",
//                         margin: "5px",
//                         padding: "5px",
//                         display: "inline-block",
//                       }}
//                     >
//                       {box?.mode === "parent" ? (
//                         box?.isOpen ? (
//                           <>
//                             <FaMinus className="plusminus" />{" "}
//                             <BsCheckAll className="type" />{" "}
//                             <span>{box?.mode}Q</span>
//                             <span>{index + 1}</span>
//                           </>
//                         ) : (
//                           <>
//                             <FaPlus className="plusminus" />{" "}
//                             <BsCheckAll className="type" />{" "}
//                             <span>{box?.mode}Q</span>
//                             <span>{index + 1}</span>
//                           </>
//                         )
//                       ) : (
//                         <span>
//                           <BsCheck className="type" /> <span>{box?.mode}</span>
//                           <span>C {index + 1}</span>
//                         </span>
//                       )}
//                     </p>
//                     {box?.mode === "parent" && box.isOpen && (
//                       <ul className="drop">
//                         <p>Child Boxes:</p>

//                         {box.children.map((childBox, childIndex) => (
//                           <li key={childIndex}>
//                             Child {childIndex + 1}
//                             <br />
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </li>
//                 ))}
//             </ul>
//           </div>
//           {/* <div className="col-12 col-md-4">

//           </div> */}
//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// Above is the last backup code from date 02.04.2024
// ************************************************************
// last update on 26.02.2023
// import React, { useEffect, useState } from "react";
// import { BsCheck, BsCheckAll } from "react-icons/bs";

// import { FaMinus, FaPlus, FaRegCopy, FaSearch } from "react-icons/fa";
// import { PiCursorBold } from "react-icons/pi";
// import map1 from "../data/map1.json";
// import { LuZoomIn, LuZoomOut } from "react-icons/lu";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const [iconColor, setIconColor] = useState("");
//   const [iconColorzo, setIconColorzo] = useState("");

//   const handleMouseOver = () => {
//     setIconColor("yellow");
//   };

//   const handleMouseOut = () => {
//     setIconColor("");
//   };

//   const handleMouseOverzoomout = () => {
//     setIconColorzo("yellow");
//   };
//   const handleMouseOutzoomout = () => {
//     setIconColorzo("");
//   };

//   const [data, setData] = useState(map1);
//   const handleDropDown = (item) => {
//     console.log(item);
//   };

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//   };

//   const handleCopyBoxClick = () => {
//     if (selectedBoxIndex !== null) {
//       const selectedBox = boxes[selectedBoxIndex];
//       setCopiedBox(selectedBox);
//       setIsBoxCopied(true); // Set the flag to true when a box is copied
//       console.log("Box copied:", selectedBox);
//     }
//   };

//   const handlePasteBoxClick = () => {
//     if (copiedBox) {
//       const updatedBoxes = [...boxes, { ...copiedBox }];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", copiedBox);
//     }
//   };
//   // till here copy paste functionality

//   useEffect(() => {
//     draw();
//   }, [image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <div className="map_header shadow">
//         <div className="container">
//           <ul>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Cursor"
//                 name="Cursor"
//                 onClick={toggleDrawingMode}
//               >
//                 {/* <PiCursorBold /> */}
//                 {drawingMode ? (
//                   <PiCursorBold />
//                 ) : (
//                   <PiCursorBold style={{ color: "yellow" }} />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker Group"
//                 name="parent"
//                 onClick={toggleDrawingModeparent}
//               >
//                 {drawingModeparent ? (
//                   <span style={{ color: "yellow" }}>CG</span>
//                 ) : (
//                   "CG"
//                 )}
//                 {/* {drawingModeparent ? "Dp" : "Ep"}    */}
//                 {/* <FaSearch /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker"
//                 name="Child"
//                 onClick={toggleDrawingModechild}
//               >
//                 {drawingModechild ? (
//                   <span style={{ color: "yellow" }}>C</span>
//                 ) : (
//                   "C"
//                 )}

//                 {/* {drawingModechild ? "Dc" : "Ec"} */}
//                 {/* <CiEdit /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Copy"
//                 name="copy"
//                 onClick={handleCopyBoxClick}
//                 disabled={selectedBoxIndex === null}
//               >
//                 {/* <FaSearch />C */}
//                 {/* <FaRegCopy /> */}
//                 {isBoxCopied ? (
//                   <FaRegCopy style={{ color: "yellow" }} />
//                 ) : (
//                   <FaRegCopy />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Paste"
//                 name="paste"
//                 onClick={handlePasteBoxClick}
//                 disabled={!copiedBox}
//               >
//                 {/* <FaSearch /> */}P
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomIn"
//                 name="ZoomIn"
//                 onMouseOver={handleMouseOver}
//                 onMouseOut={handleMouseOut}
//                 onClick={handleZoomIn}
//               >
//                 <LuZoomIn style={{ color: iconColor }} />
//                 {/* style={{ color: iconColor }}  */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomOut"
//                 name="ZoomOut"
//                 onMouseOver={handleMouseOverzoomout}
//                 onMouseOut={handleMouseOutzoomout}
//                 onClick={handleZoomOut}
//               >
//                 {/* <FaSearch /> Zout */}
//                 <LuZoomOut style={{ color: iconColorzo }} />
//               </button>
//             </li>
//             <li>
//               <input
//                 type="text"
//                 placeholder="Enter box name"
//                 value={boxNameInput}
//                 onChange={(e) => setBoxNameInput(e.target.value)}
//                 className="form-control mt-3"
//               />
//             </li>
//           </ul>
//         </div>
//       </div>

//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             {/* <div className="mapping_image"> */}
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }} // Add border for visualization
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />
//           </div>
//           <div className="col-12 col-md-4">
//             <div className="mapping_data">
//               <ul>
//                 {data &&
//                   data.map((item, i) => (
//                     <li key={i}>
//                       <p onClick={() => handleDropDown(item)}>
//                         {item?.type === "checker-group" ? (
//                           item?.isOpen ? (
//                             <>
//                               <FaPlus className="plusminus" />{" "}
//                               <BsCheckAll className="type" />{" "}
//                               <span>{item?.name}</span>
//                             </>
//                           ) : (
//                             <>
//                               <FaMinus className="plusminus" />{" "}
//                               <BsCheckAll className="type" />{" "}
//                               <span>{item?.name}</span>
//                             </>
//                           )
//                         ) : (
//                           <span>
//                             <BsCheck className="type" /> {item?.name}
//                           </span>
//                         )}
//                       </p>
//                       {item?.type === "checker-group" && (
//                         <ul className="drop">
//                           {item?.child.length > 0 &&
//                             item?.child.map((it, index) => (
//                               <li key={index}>{it?.name}</li>
//                             ))}
//                         </ul>
//                       )}
//                     </li>
//                   ))}
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div>
//         {boxes.map((box, index) => (
//           <div
//             key={index}
//             onClick={() => handleSelectBoxClick(index)}
//             style={{
//               border:
//                 selectedBoxIndex === index
//                   ? "2px solid orange"
//                   : "1px solid black",
//               margin: "5px",
//               padding: "5px",
//               display: "inline-block",
//             }}
//           >
//             <p>
//               Box {index + 1} ID: {box.id}
//               <br />
//               Box {index + 1} Name: {box.name}
//               <br />
//               Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//               {box.end.x}, {box.end.y})
//             </p>
//             {box.mode === "parent" && (
//               <div>
//                 <p>Child Boxes:</p>
//                 {box.children.map((childBox, childIndex) => (
//                   <p key={childIndex}>
//                     Box {childIndex + 1} ID: {childBox.id}
//                     <br />
//                     Child Box {childIndex + 1} Coordinates: ({childBox.start.x},{" "}
//                     {childBox.start.y}) - ({childBox.end.x}, {childBox.end.y})
//                   </p>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </>
//   );
// }

// export default Templateimage;

//3rd code ..this code is working
// import React, { useEffect, useState } from "react";

// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [copiedBox, setCopiedBox] = useState(null);

//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//   };

//   const handleCopyBoxClick = () => {
//     if (selectedBoxIndex !== null) {
//       const selectedBox = boxes[selectedBoxIndex];
//       setCopiedBox(selectedBox);
//       console.log("Box copied:", selectedBox);
//     }
//   };

//   const handlePasteBoxClick = () => {
//     if (copiedBox) {
//       const updatedBoxes = [...boxes, { ...copiedBox }];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", copiedBox);
//     }
//   };
//   // till here copy paste functionality

//   useEffect(() => {
//     draw();
//   }, [image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <button onClick={toggleDrawingMode}>
//         {drawingMode ? "Enable " : "Disable"}
//       </button>
//       <button onClick={toggleDrawingModeparent}>
//         {drawingModeparent ? "Disable parent" : "Enable parent"}
//       </button>
//       <button onClick={toggleDrawingModechild}>
//         {drawingModechild ? "Disable child" : "Enable child"}
//       </button>

//       <button onClick={handleCopyBoxClick} disabled={selectedBoxIndex === null}>
//         Copy Selected Box
//       </button>

//       <button onClick={handlePasteBoxClick} disabled={!copiedBox}>
//         Paste Box
//       </button>
//       <input
//         type="text"
//         placeholder="Enter box name"
//         value={boxNameInput}
//         onChange={(e) => setBoxNameInput(e.target.value)}
//       />
//       <div className="col-12 col-md-8">
//         {/* <div className="mapping_image"> */}
//         <canvas
//           id="canvas"
//           width={800} // Set the width of the canvas as needed
//           height={1200} // Set the height of the canvas as needed
//           // className="w-100"
//           style={{ border: "1px solid green" }} // Add border for visualization
//           onMouseDown={handleMouseDown}
//           onMouseUp={handleMouseUp}
//           onMouseMove={handleMouseMove}
//         />
//       </div>
//       {/* </div> */}
//       <div>
//         {boxes.map((box, index) => (
//           <div
//             key={index}
//             onClick={() => handleSelectBoxClick(index)}
//             style={{
//               border:
//                 selectedBoxIndex === index
//                   ? "2px solid orange"
//                   : "1px solid black",
//               margin: "5px",
//               padding: "5px",
//               display: "inline-block",
//             }}
//           >
//             <p>
//               Box {index + 1} ID: {box.id}
//               <br />
//               Box {index + 1} Name: {box.name}
//               <br />
//               Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//               {box.end.x}, {box.end.y})
//             </p>
//             {box.mode === "parent" && (
//               <div>
//                 <p>Child Boxes:</p>
//                 {box.children.map((childBox, childIndex) => (
//                   <p key={childIndex}>
//                     Box {childIndex + 1} ID: {childBox.id}
//                     <br />
//                     Child Box {childIndex + 1} Coordinates: ({childBox.start.x},{" "}
//                     {childBox.start.y}) - ({childBox.end.x}, {childBox.end.y})
//                   </p>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//       <div>
//         <button onClick={handleZoomIn}>Zoom In</button>
//         <button onClick={handleZoomOut}>Zoom Out</button>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// 2nd modification code is working
// import React, { useEffect, useState } from "react";

// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true); // Set to true initially
//   const [drawingModeparent, setDrawingModeparent] = useState(false); // Set to true initially
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   console.log("hey i am drawing mode parent....", drawingModeparent);

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     // console.log("hey i am  handleMouseDown ...");
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect(); //This line gets the size and position of the canvas element relative
//       //  to the viewport and stores it in the rect variable.
//       console.log("heyyy i am reectttttttt", rect);
//       // console.log("rect width", rect.width);
//       // console.log("rect height", rect.height);

//       console.log(event, "hey i am evenytyyyyy");
//       const x = event.clientX - rect.left; // YAHOO BABA These lines calculate the mouse coordinates relative to the top-left corner of the canvas by subtracting the canvas position from the mouse position.
//       const y = event.clientY - rect.top;

//       // console.log("hey i am StartCoordinates", startCoordinates);
//       // console.log("hello i am endCoordinates", endCoordinates);

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       // console.log("heuuuyyyyy i am endCoordinates", endCoordinates); // fixed one
//       setDragging(true);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       // Save the coordinates of the current box
//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           // If child mode, create a simple child box without including children data
//           newBox = {
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };
//           console.log("heyy i am child outside");

//           // Check if the new child box is inside an existing parent box
//           const insideParent = boxes.some((box) => {
//             return (
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//             );
//           });

//           if (insideParent) {
//             // Find the index of the parent box
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );

//             // Add the child box to the parent box
//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);

//             // updatedBoxes.map((box, index) => {
//             //   console.log(`Box at index ${index}:`, box);
//             // });
//             // const childrenCount = updatedBoxes[parentIndex].children.length;
//             // console.log(
//             //   `Children inside Parent Box at index ${parentIndex}: ${
//             //     childrenCount > 0
//             //       ? JSON.stringify(updatedBoxes[parentIndex].children, null, 2)
//             //       : "Zero"
//             //   }`
//             // );

//             setBoxes(updatedBoxes);

//             // Avoid showing JSON data for child boxes inside a parent
//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);

//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = event.clientX - rect.left;
//       const y = event.clientY - rect.top;
//       setEndCoordinates({ x, y });

//       draw();
//     }
//   };
//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(image, 0, 0, canvas.width, canvas.height);
//     }

//     // Draw existing boxes
//     boxes.forEach((box) => {
//       if (box.mode === "parent") {
//         context.strokeStyle = "green"; // Set green color for parent boxes
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x,
//         box.start.y,
//         box.end.x - box.start.x,
//         box.end.y - box.start.y
//       );

//       if (box.mode === "parent") {
//         // Draw child boxes inside the parent box
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue"; // Set blue color for child boxes
//           context.strokeRect(
//             childBox.start.x,
//             childBox.start.y,
//             childBox.width,
//             childBox.height
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       const tempEndX = endCoordinates.x;
//       const tempEndY = endCoordinates.y;

//       context.strokeStyle = drawingModeparent ? "green" : "red";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x,
//         startCoordinates.y,
//         endCoordinates.x - startCoordinates.x,
//         endCoordinates.y - startCoordinates.y
//       );

//       // Reset to the original end coordinates
//       endCoordinates.x = tempEndX;
//       endCoordinates.y = tempEndY;
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [image, boxes, drawingMode]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     // console.log(drawingMode, "hey i am drawing mode");
//     // console.log(dragging, "hey i am dragginggggggg");

//     setDrawingMode(!drawingMode);
//     setDragging(false); // Reset dragging state when toggling drawing mode
//   };
//   const toggleDrawingModeparent = () => {
//     // console.log(drawingMode, "hey i am drawing mode");
//     // console.log(dragging, "hey i am dragginggggggg");
//     setDrawingModeparent(!drawingModeparent);
//     // setDrawingMode(!drawingMode);
//     setDragging(false); // Reset dragging state when toggling drawing mode

//     // this code is for when parent button is enable then if the child button is enabled then it will
//     //make it disable
//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };
//   const toggleDrawingModechild = () => {
//     // console.log(drawingMode, "hey i am drawing mode");
//     // console.log(dragging, "hey i am dragginggggggg");
//     setDrawingModechild(!drawingModechild);
//     // setDrawingMode(!drawingMode);
//     setDragging(false); // Reset dragging state when toggling drawing mode

//     // this code is for when child button is enable then if the parent button is enabled then it will
//     //make it disable
//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <button onClick={toggleDrawingMode}>
//         {drawingMode ? "Disable " : "Enable"}
//       </button>
//       <button onClick={toggleDrawingModeparent}>
//         {drawingModeparent ? "Disable parent" : "Enable parent"}
//       </button>
//       <button onClick={toggleDrawingModechild}>
//         {drawingModechild ? "Disable child" : "Enable child"}
//       </button>
//       <div className="col-12 col-md-8">
//         {/* <div className="mapping_image"> */}
//         <canvas
//           id="canvas"
//           width={800} // Set the width of the canvas as needed
//           height={1200} // Set the height of the canvas as needed
//           // className="w-100"
//           style={{ border: "1px solid green" }} // Add border for visualization
//           onMouseDown={handleMouseDown}
//           onMouseUp={handleMouseUp}
//           onMouseMove={handleMouseMove}
//         />
//       </div>
//       {/* </div> */}
//       <div>
//         {boxes.map((box, index) => (
//           <p key={index}>
//             Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//             {box.end.x}, {box.end.y})
//           </p>
//         ))}
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// First modification working code
// import React, { useEffect, useState } from "react";

// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };
//   const handleMouseDown = (event) => {
//     const canvas = document.getElementById("canvas");
//     const rect = canvas.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     setStartCoordinates({ x, y });
//     setEndCoordinates({ x, y });
//     setDragging(true);
//   };

//   const handleMouseUp = () => {
//     setDragging(false);

//     // Save the coordinates of the current box
//     if (startCoordinates.x !== null && endCoordinates.x !== null) {
//       setBoxes([
//         ...boxes,
//         { start: { ...startCoordinates }, end: { ...endCoordinates } },
//       ]);
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = event.clientX - rect.left;
//       const y = event.clientY - rect.top;

//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(image, 0, 0, canvas.width, canvas.height);
//     }

//     // Draw existing boxes
//     context.strokeStyle = "red";
//     context.lineWidth = 2;
//     boxes.forEach((box) => {
//       context.strokeRect(
//         box.start.x,
//         box.start.y,
//         box.end.x - box.start.x,
//         box.end.y - box.start.y
//       );
//     });

//     // Draw the current box being dragged
//     context.strokeRect(
//       startCoordinates.x,
//       startCoordinates.y,
//       endCoordinates.x - startCoordinates.x,
//       endCoordinates.y - startCoordinates.y
//     );
//   };

//   useEffect(() => {
//     draw();
//   }, [image, boxes]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);

//   return (
//     <>
//       <div className="col-12 col-md-8">
//         {/* <div className="mapping_image"> */}
//         <canvas
//           id="canvas"
//           width={800} // Set the width of the canvas as needed
//           height={1200} // Set the height of the canvas as needed
//           // className="w-100"
//           style={{ border: "1px solid green" }} // Add border for visualization
//           onMouseDown={handleMouseDown}
//           onMouseUp={handleMouseUp}
//           onMouseMove={handleMouseMove}
//         />
//       </div>
//       {/* </div> */}
//       <div>
//         {boxes.map((box, index) => (
//           <p key={index}>
//             Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//             {box.end.x}, {box.end.y})
//           </p>
//         ))}
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// *********************Do modification in this code only*****************
// import React, { useRef, useEffect, useState } from "react";

// function Templateimage({ images }) {
//   const [hi, setHi] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);

//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     setHi(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };
//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (hi) {
//       context.drawImage(
//         hi,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };
//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [copiedBox, setCopiedBox] = useState(null);

//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//   };

//   const handleCopyBoxClick = () => {
//     if (selectedBoxIndex !== null) {
//       const selectedBox = boxes[selectedBoxIndex];
//       setCopiedBox(selectedBox);
//       console.log("Box copied:", selectedBox);
//     }
//   };

//   const handlePasteBoxClick = () => {
//     if (copiedBox) {
//       const updatedBoxes = [...boxes, { ...copiedBox }];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", copiedBox);
//     }
//   };
//   // till here copy paste functionality

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images, boxes, drawingMode, zoomFactor, boxNameInput]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <button onClick={toggleDrawingMode}>
//         {drawingMode ? "Enable " : "Disable"}
//       </button>
//       <button onClick={toggleDrawingModeparent}>
//         {drawingModeparent ? "Disable parent" : "Enable parent"}
//       </button>
//       <button onClick={toggleDrawingModechild}>
//         {drawingModechild ? "Disable child" : "Enable child"}
//       </button>

//       <button onClick={handleCopyBoxClick} disabled={selectedBoxIndex === null}>
//         Copy Selected Box
//       </button>

//       <button onClick={handlePasteBoxClick} disabled={!copiedBox}>
//         Paste Box
//       </button>
//       <input
//         type="text"
//         placeholder="Enter box name"
//         value={boxNameInput}
//         onChange={(e) => setBoxNameInput(e.target.value)}
//       />
//       <div className="col-12 col-md-8">
//         <div className="mapping_image">
//           <canvas
//             id="canvas"
//             width={800} // Set the width of the canvas as needed
//             height={1200} // Set the height of the canvas as needed
//             className="w-100"
//             style={{ border: "5px solid green" }} // Add border for visualization
//             onMouseDown={handleMouseDown}
//             onMouseUp={handleMouseUp}
//             onMouseMove={handleMouseMove}
//           />
//         </div>
//       </div>
//       <div>
//         {boxes.map((box, index) => (
//           <div
//             key={index}
//             onClick={() => handleSelectBoxClick(index)}
//             style={{
//               border:
//                 selectedBoxIndex === index
//                   ? "2px solid orange"
//                   : "1px solid black",
//               margin: "5px",
//               padding: "5px",
//               display: "inline-block",
//             }}
//           >
//             <p>
//               Box {index + 1} ID: {box.id}
//               <br />
//               Box {index + 1} Name: {box.name}
//               <br />
//               Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//               {box.end.x}, {box.end.y})
//             </p>
//             {box.mode === "parent" && (
//               <div>
//                 <p>Child Boxes:</p>
//                 {box.children.map((childBox, childIndex) => (
//                   <p key={childIndex}>
//                     Box {childIndex + 1} ID: {childBox.id}
//                     <br />
//                     Child Box {childIndex + 1} Coordinates: ({childBox.start.x},{" "}
//                     {childBox.start.y}) - ({childBox.end.x}, {childBox.end.y})
//                   </p>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//       <div>
//         <button onClick={handleZoomIn}>Zoom In</button>
//         <button onClick={handleZoomOut}>Zoom Out</button>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// ****************************************************************
// import React, { useEffect, useState } from "react";

// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);

//   return (
//     <>
//       <div className="col-12 col-md-8">
//         <div className="mapping_image">
//           <canvas
//             id="canvas"
//             width={800} // Set the width of the canvas as needed
//             height={1200} // Set the height of the canvas as needed
//             border="3px solid red"
//           />
//         </div>
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// Last Modification on image upload

// import React, { useEffect, useState } from "react";

// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);

//   return (
//     <>
//       <canvas
//         id="canvas"
//         width={800} // Set the width of the canvas as needed
//         height={1200} // Set the height of the canvas as needed
//         className="w-100"
//         style={{ border: "1px solid #000" }} // Add border for visualization
//       />
//     </>
//   );
// }

// export default Templateimage;

// Last update
// import React, { useRef, useEffect, useState } from "react";
// import { CiEdit } from "react-icons/ci";
// import { FaSearch } from "react-icons/fa";
// import { PiCursorBold } from "react-icons/pi";

// function Templateimage({ images }) {
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const [image, setImage] = useState(null);

//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const canvasRef = useRef(null);

//   // Genetrate unique ID
//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     console.log("Hey i am image", image);
//     const canvas = canvasRef.current;
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);

//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     setImage(img);
//   };
//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };
//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };
//   // ZOOMIn and ZOOMOut
//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };
//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };
//   // ZOOMIn and ZOOMOut till here

//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [copiedBox, setCopiedBox] = useState(null);

//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//   };

//   const handleCopyBoxClick = () => {
//     if (selectedBoxIndex !== null) {
//       const selectedBox = boxes[selectedBoxIndex];
//       setCopiedBox(selectedBox);
//       console.log("Box copied:", selectedBox);
//     }
//   };

//   const handlePasteBoxClick = () => {
//     if (copiedBox) {
//       const updatedBoxes = [...boxes, { ...copiedBox }];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", copiedBox);
//     }
//   };
//   // till here copy paste functionality

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//     draw();
//   }, [images, boxes, drawingMode, zoomFactor, boxNameInput]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };
//   // parent
//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };
//   //child
//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <button onClick={toggleDrawingMode}>
//         {drawingMode ? "Enable " : "Disable"}
//       </button>
//       <button onClick={toggleDrawingModeparent}>
//         {drawingModeparent ? "Disable parent" : "Enable parent"}
//       </button>
//       <button onClick={toggleDrawingModechild}>
//         {drawingModechild ? "Disable child" : "Enable child"}
//       </button>

//       <button onClick={handleCopyBoxClick} disabled={selectedBoxIndex === null}>
//         Copy Selected Box
//       </button>

//       <button onClick={handlePasteBoxClick} disabled={!copiedBox}>
//         Paste Box
//       </button>
//       <input
//         type="text"
//         placeholder="Enter box name"
//         value={boxNameInput}
//         onChange={(e) => setBoxNameInput(e.target.value)}
//       />
//       <div className="col-12 col-md-8">
//         <div className="mapping_image">
//           <canvas
//             ref={canvasRef}
//             width={800} // Set the width of the canvas as needed
//             height={1200} // Set the height of the canvas as needed
//             className="w-100"
//             style={{ border: "1px solid #000" }} // Add border for visualization
//             onMouseDown={handleMouseDown}
//             onMouseUp={handleMouseUp}
//             onMouseMove={handleMouseMove}
//           />
//         </div>
//       </div>
//       <div>
//         <button onClick={handleZoomIn}>Zoom In</button>
//         <button onClick={handleZoomOut}>Zoom Out</button>
//       </div>
//       <div>
//         {boxes.map((box, index) => (
//           <div
//             key={index}
//             onClick={() => handleSelectBoxClick(index)}
//             style={{
//               border:
//                 selectedBoxIndex === index
//                   ? "2px solid orange"
//                   : "1px solid black",
//               margin: "5px",
//               padding: "5px",
//               display: "inline-block",
//             }}
//           >
//             <p>
//               Box {index + 1} ID: {box.id}
//               <br />
//               Box {index + 1} Name: {box.name}
//               <br />
//               Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//               {box.end.x}, {box.end.y})
//             </p>
//             {box.mode === "parent" && (
//               <div>
//                 <p>Child Boxes:</p>
//                 {box.children.map((childBox, childIndex) => (
//                   <p key={childIndex}>
//                     Child Box {childIndex + 1} ID: {childBox.id}
//                     <br />
//                     Child Box {childIndex + 1} Coordinates: ({childBox.start.x},{" "}
//                     {childBox.start.y}) - ({childBox.end.x}, {childBox.end.y})
//                   </p>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </>
//   );
// }

// export default Templateimage;

// last update
// import React, { useRef, useEffect } from "react";

// function Templateimage({ images }) {
//   const canvasRef = useRef(null);

//   const uploadImage = (image) => {
//     const canvas = canvasRef.current;
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);

//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//   };

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);

//   return (
//     <>
//       <canvas
//         ref={canvasRef}
//         width={800} // Set the width of the canvas as needed
//         height={1200} // Set the height of the canvas as needed
//         className="w-100"
//         style={{ border: "1px solid #000" }} // Add border for visualization
//       />
//     </>
//   );
// }

// export default Templateimage;

// import React from "react";

// function Templateimage({ images }) {
//   return (
//     <div>
//       {images && (
//         <img
//           src={URL.createObjectURL(images)}
//           alt="Mapping Image"
//           className="w-100"
//         />
//       )}
//     </div>
//   );
// }

// export default Templateimage;

//above ********23.02.2023*************************

// import React, { useEffect, useState } from "react";
// import { BsCheck, BsCheckAll } from "react-icons/bs";

// import { FaMinus, FaPlus, FaRegCopy, FaSearch } from "react-icons/fa";
// import { PiCursorBold } from "react-icons/pi";
// import map1 from "../data/map1.json";
// import { LuZoomIn, LuZoomOut } from "react-icons/lu";
// function Templateimage({ images }) {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true);
//   const [drawingModeparent, setDrawingModeparent] = useState(false);
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");
//   const [iconColor, setIconColor] = useState("");
//   const [iconColorzo, setIconColorzo] = useState("");

//   const handleMouseOver = () => {
//     setIconColor("yellow");
//   };

//   const handleMouseOut = () => {
//     setIconColor("");
//   };

//   const handleMouseOverzoomout = () => {
//     setIconColorzo("yellow");
//   };
//   const handleMouseOutzoomout = () => {
//     setIconColorzo("");
//   };

//   const [data, setData] = useState(map1);
//   const handleDropDown = (item) => {
//     console.log(item);
//   };

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const uploadImage = (image) => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");

//     const img = new Image();
//     img.src = URL.createObjectURL(image);
//     img.onload = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
//       context.drawImage(img, 0, 0, canvas.width, canvas.height);
//     };
//     // console.log("Hey i am image", image);
//     setImage(img);
//   };

//   const handleMouseDown = (event) => {
//     console.log("hey i am  handleMouseDown event", event);
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       console.log("heyyy i am start co-ordianate", startCoordinates);
//       console.log("heyyy i am end co-ordianate", endCoordinates);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           newBox = {
//             id: generateUniqueId(),
//             name: boxNameInput,
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };

//           const insideParent = boxes.some(
//             (box) =>
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//           );
//           console.log("insideParent", insideParent);

//           if (insideParent) {
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );
//             console.log("parentIndex", parentIndex);

//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);
//             setBoxes(updatedBoxes);

//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);
//         setBoxNameInput("");
//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;
//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//     // console.log(zoomFactor, "hey i am zoom out factor");
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     boxes.forEach((box) => {
//       //   console.log("hey i am bixxxx", box);

//       if (box.mode === "parent") {
//         context.strokeStyle = "green";
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         (box.end.x - box.start.x) * zoomFactor,
//         (box.end.y - box.start.y) * zoomFactor
//       );

//       if (box.mode === "parent") {
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue";
//           context.strokeRect(
//             childBox.start.x * zoomFactor,
//             childBox.start.y * zoomFactor,
//             childBox.width * zoomFactor,
//             childBox.height * zoomFactor
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       context.strokeStyle = drawingModeparent ? "pink" : "yellow";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );
//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   //   Copy paste functionality....
//   const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
//   const [copiedBox, setCopiedBox] = useState(null);
//   const [isBoxCopied, setIsBoxCopied] = useState(false);
//   const handleSelectBoxClick = (index) => {
//     setSelectedBoxIndex(index);
//     setIsBoxCopied(false);
//   };

//   const handleCopyBoxClick = () => {
//     if (selectedBoxIndex !== null) {
//       const selectedBox = boxes[selectedBoxIndex];
//       setCopiedBox(selectedBox);
//       setIsBoxCopied(true); // Set the flag to true when a box is copied
//       console.log("Box copied:", selectedBox);
//     }
//   };

//   const handlePasteBoxClick = () => {
//     if (copiedBox) {
//       const updatedBoxes = [...boxes, { ...copiedBox }];
//       setBoxes(updatedBoxes);
//       console.log("Box pasted:", copiedBox);
//     }
//   };
//   // till here copy paste functionality

//   useEffect(() => {
//     draw();
//   }, [image, boxes, drawingMode, zoomFactor, boxNameInput]);

//   useEffect(() => {
//     if (images) {
//       uploadImage(images);
//     }
//   }, [images]);
//   const toggleDrawingMode = () => {
//     setDrawingMode(!drawingMode);
//     setDragging(false);
//   };

//   const toggleDrawingModeparent = () => {
//     setDrawingModeparent(!drawingModeparent);
//     setDragging(false);

//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };

//   const toggleDrawingModechild = () => {
//     setDrawingModechild(!drawingModechild);
//     setDragging(false);

//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <>
//       <div className="map_header shadow">
//         <div className="container">
//           <ul>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Cursor"
//                 name="Cursor"
//                 onClick={toggleDrawingMode}
//               >
//                 {/* <PiCursorBold /> */}
//                 {drawingMode ? (
//                   <PiCursorBold />
//                 ) : (
//                   <PiCursorBold style={{ color: "yellow" }} />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker Group"
//                 name="parent"
//                 onClick={toggleDrawingModeparent}
//               >
//                 {drawingModeparent ? (
//                   <span style={{ color: "yellow" }}>CG</span>
//                 ) : (
//                   "CG"
//                 )}
//                 {/* {drawingModeparent ? "Dp" : "Ep"}    */}
//                 {/* <FaSearch /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Checker"
//                 name="Child"
//                 onClick={toggleDrawingModechild}
//               >
//                 {drawingModechild ? (
//                   <span style={{ color: "yellow" }}>C</span>
//                 ) : (
//                   "C"
//                 )}

//                 {/* {drawingModechild ? "Dc" : "Ec"} */}
//                 {/* <CiEdit /> */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Copy"
//                 name="copy"
//                 onClick={handleCopyBoxClick}
//                 disabled={selectedBoxIndex === null}
//               >
//                 {/* <FaSearch />C */}
//                 {/* <FaRegCopy /> */}
//                 {isBoxCopied ? (
//                   <FaRegCopy style={{ color: "yellow" }} />
//                 ) : (
//                   <FaRegCopy />
//                 )}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="Paste"
//                 name="paste"
//                 onClick={handlePasteBoxClick}
//                 disabled={!copiedBox}
//               >
//                 {/* <FaSearch /> */}P
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomIn"
//                 name="ZoomIn"
//                 onMouseOver={handleMouseOver}
//                 onMouseOut={handleMouseOut}
//                 onClick={handleZoomIn}
//               >
//                 <LuZoomIn style={{ color: iconColor }} />
//                 {/* style={{ color: iconColor }}  */}
//               </button>
//             </li>
//             <li>
//               <button
//                 className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
//                 title="ZoomOut"
//                 name="ZoomOut"
//                 onMouseOver={handleMouseOverzoomout}
//                 onMouseOut={handleMouseOutzoomout}
//                 onClick={handleZoomOut}
//               >
//                 {/* <FaSearch /> Zout */}
//                 <LuZoomOut style={{ color: iconColorzo }} />
//               </button>
//             </li>
//             <li>
//               <input
//                 type="text"
//                 placeholder="Enter box name"
//                 value={boxNameInput}
//                 onChange={(e) => setBoxNameInput(e.target.value)}
//                 className="form-control mt-3"
//               />
//             </li>
//           </ul>
//         </div>
//       </div>

//       <div className="container">
//         <div className="row">
//           <div className="col-12 col-md-8">
//             {/* <div className="mapping_image"> */}
//             <canvas
//               id="canvas"
//               width={800} // Set the width of the canvas as needed
//               height={1200} // Set the height of the canvas as needed
//               // className="w-100"
//               style={{
//                 border: "1px solid green",
//                 marginTop: "40px",
//                 marginRight: "100px",
//               }} // Add border for visualization
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//             />
//           </div>
//           <div className="col-12 col-md-4">
//             <div className="mapping_data">
//               <ul>
//                 {data &&
//                   data.map((item, i) => (
//                     <li key={i}>
//                       <p onClick={() => handleDropDown(item)}>
//                         {item?.type === "checker-group" ? (
//                           item?.isOpen ? (
//                             <>
//                               <FaPlus className="plusminus" />{" "}
//                               <BsCheckAll className="type" />{" "}
//                               <span>{item?.name}</span>
//                             </>
//                           ) : (
//                             <>
//                               <FaMinus className="plusminus" />{" "}
//                               <BsCheckAll className="type" />{" "}
//                               <span>{item?.name}</span>
//                             </>
//                           )
//                         ) : (
//                           <span>
//                             <BsCheck className="type" /> {item?.name}
//                           </span>
//                         )}
//                       </p>
//                       {item?.type === "checker-group" && (
//                         <ul className="drop">
//                           {item?.child.length > 0 &&
//                             item?.child.map((it, index) => (
//                               <li key={index}>{it?.name}</li>
//                             ))}
//                         </ul>
//                       )}
//                     </li>
//                   ))}
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div>
//         {boxes.map((box, index) => (
//           <div
//             key={index}
//             onClick={() => handleSelectBoxClick(index)}
//             style={{
//               border:
//                 selectedBoxIndex === index
//                   ? "2px solid orange"
//                   : "1px solid black",
//               margin: "5px",
//               padding: "5px",
//               display: "inline-block",
//             }}
//           >
//             <p>
//               Box {index + 1} ID: {box.id}
//               <br />
//               Box {index + 1} Name: {box.name}
//               <br />
//               Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//               {box.end.x}, {box.end.y})
//             </p>
//             {box.mode === "parent" && (
//               <div>
//                 <p>Child Boxes:</p>
//                 {box.children.map((childBox, childIndex) => (
//                   <p key={childIndex}>
//                     Box {childIndex + 1} ID: {childBox.id}
//                     <br />
//                     Child Box {childIndex + 1} Coordinates: ({childBox.start.x},{" "}
//                     {childBox.start.y}) - ({childBox.end.x}, {childBox.end.y})
//                   </p>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </>
//   );
// }

// export default Templateimage;

//above ********23.02.2023*************************

//****************last update of Templateimage ***************************/
// **********************************************************************

// import React, { useState, useEffect } from "react";

// const ImageSelector = () => {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [drawingMode, setDrawingMode] = useState(true); // Set to true initially
//   const [drawingModeparent, setDrawingModeparent] = useState(false); // Set to true initially
//   const [drawingModechild, setDrawingModechild] = useState(true);
//   console.log("hey i am drawing mode parent....", drawingModeparent);
//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     // console.log("fileeeeeeeeeeee", file);
//     const reader = new FileReader();

//     reader.onload = (e) => {
//       const img = new Image();
//       img.onload = () => {
//         const canvas = document.getElementById("canvas");
//         const context = canvas.getContext("2d");
//         context.drawImage(img, 0, 0, canvas.width, canvas.height);
//       };
//       img.src = e.target.result;
//       setImage(img);
//     };

//     if (file) {
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleMouseDown = (event) => {
//     // console.log("hey i am  handleMouseDown ...");
//     if (drawingModeparent || drawingModechild) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect(); //This line gets the size and position of the canvas element relative
//       //  to the viewport and stores it in the rect variable.
//       console.log("heyyy i am reectttttttt", rect);
//       // console.log("rect width", rect.width);
//       // console.log("rect height", rect.height);

//       console.log(event, "hey i am evenytyyyyy");
//       const x = event.clientX - rect.left; // YAHOO BABA These lines calculate the mouse coordinates relative to the top-left corner of the canvas by subtracting the canvas position from the mouse position.
//       const y = event.clientY - rect.top;

//       // console.log("hey i am StartCoordinates", startCoordinates);
//       // console.log("hello i am endCoordinates", endCoordinates);

//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       // console.log("heuuuyyyyy i am endCoordinates", endCoordinates); // fixed one
//       setDragging(true);
//     }
//   };

//   const handleMouseUp = () => {
//     if (drawingMode) {
//       setDragging(false);

//       // Save the coordinates of the current box
//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         let newBox;

//         if (drawingModeparent) {
//           newBox = {
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "parent",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             children: [],
//           };
//         } else {
//           // If child mode, create a simple child box without including children data
//           newBox = {
//             start: { ...startCoordinates },
//             end: { ...endCoordinates },
//             mode: "child",
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//           };
//           console.log("heyy i am child outside");

//           // Check if the new child box is inside an existing parent box
//           const insideParent = boxes.some((box) => {
//             return (
//               box.mode === "parent" &&
//               newBox.start.x > box.start.x &&
//               newBox.start.y > box.start.y &&
//               newBox.end.x < box.end.x &&
//               newBox.end.y < box.end.y
//             );
//           });

//           if (insideParent) {
//             // Find the index of the parent box
//             const parentIndex = boxes.findIndex(
//               (box) =>
//                 box.mode === "parent" &&
//                 newBox.start.x > box.start.x &&
//                 newBox.start.y > box.start.y &&
//                 newBox.end.x < box.end.x &&
//                 newBox.end.y < box.end.y
//             );

//             // Add the child box to the parent box
//             const updatedBoxes = [...boxes];
//             updatedBoxes[parentIndex].children.push(newBox);

//             // updatedBoxes.map((box, index) => {
//             //   console.log(`Box at index ${index}:`, box);
//             // });
//             // const childrenCount = updatedBoxes[parentIndex].children.length;
//             // console.log(
//             //   `Children inside Parent Box at index ${parentIndex}: ${
//             //     childrenCount > 0
//             //       ? JSON.stringify(updatedBoxes[parentIndex].children, null, 2)
//             //       : "Zero"
//             //   }`
//             // );

//             setBoxes(updatedBoxes);

//             // Avoid showing JSON data for child boxes inside a parent
//             return;
//           }
//         }

//         setBoxes([...boxes, newBox]);

//         console.log("Boxes data:", JSON.stringify([...boxes, newBox], null, 2));
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (drawingMode && dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = event.clientX - rect.left;
//       const y = event.clientY - rect.top;
//       setEndCoordinates({ x, y });

//       draw();
//     }
//   };
//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(image, 0, 0, canvas.width, canvas.height);
//     }

//     // Draw existing boxes
//     boxes.forEach((box) => {
//       if (box.mode === "parent") {
//         context.strokeStyle = "green"; // Set green color for parent boxes
//       } else {
//         context.strokeStyle = "red";
//       }

//       context.lineWidth = 2;
//       context.strokeRect(
//         box.start.x,
//         box.start.y,
//         box.end.x - box.start.x,
//         box.end.y - box.start.y
//       );

//       if (box.mode === "parent") {
//         // Draw child boxes inside the parent box
//         box.children.forEach((childBox) => {
//           context.strokeStyle = "blue"; // Set blue color for child boxes
//           context.strokeRect(
//             childBox.start.x,
//             childBox.start.y,
//             childBox.width,
//             childBox.height
//           );
//         });
//       }
//     });

//     if (drawingMode && dragging) {
//       const tempEndX = endCoordinates.x;
//       const tempEndY = endCoordinates.y;
//       // const tempStartX = startCoordinates.x;
//       // const tempStartY = startCoordinates.y;

//       // // Check for intersection with existing boxes
//       // let f = 0;
//       // boxes.forEach((box) => {
//       //   if (box.mode === "parent") {
//       //     if (
//       //       tempEndX > box.start.x &&
//       //       tempEndX < box.end.x &&
//       //       tempEndY > box.start.y &&
//       //       tempEndY < box.end.y &&
//       //       box.start.x < tempStartX &&
//       //       box.start.y < tempStartY &&
//       //       box.end.x > tempStartX &&
//       //       box.end.y > tempStartY
//       //     ) {

//       //       console.log("Child box inside parent box! Coordinates adjusted.");
//       //     } else {
//       //       f = 1;
//       //     }
//       //   }
//       // });

//       // if (f === 1) {
//       //   f = 0;
//       // }

//       context.strokeStyle = drawingModeparent ? "green" : "red";
//       context.lineWidth = 2;
//       context.strokeRect(
//         startCoordinates.x,
//         startCoordinates.y,
//         endCoordinates.x - startCoordinates.x,
//         endCoordinates.y - startCoordinates.y
//       );

//       // Reset to the original end coordinates
//       endCoordinates.x = tempEndX;
//       endCoordinates.y = tempEndY;
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [image, boxes, drawingMode]);

//   const toggleDrawingMode = () => {
//     // console.log(drawingMode, "hey i am drawing mode");
//     // console.log(dragging, "hey i am dragginggggggg");

//     setDrawingMode(!drawingMode);
//     setDragging(false); // Reset dragging state when toggling drawing mode
//   };
//   const toggleDrawingModeparent = () => {
//     // console.log(drawingMode, "hey i am drawing mode");
//     // console.log(dragging, "hey i am dragginggggggg");
//     setDrawingModeparent(!drawingModeparent);
//     // setDrawingMode(!drawingMode);
//     setDragging(false); // Reset dragging state when toggling drawing mode

//     // this code is for when parent button is enable then if the child button is enabled then it will
//     //make it disable
//     if (drawingModechild === true) {
//       setDrawingModechild(!drawingModechild);
//     }
//   };
//   const toggleDrawingModechild = () => {
//     // console.log(drawingMode, "hey i am drawing mode");
//     // console.log(dragging, "hey i am dragginggggggg");
//     setDrawingModechild(!drawingModechild);
//     // setDrawingMode(!drawingMode);
//     setDragging(false); // Reset dragging state when toggling drawing mode

//     // this code is for when child button is enable then if the parent button is enabled then it will
//     //make it disable
//     if (drawingModeparent === true) {
//       setDrawingModeparent(!drawingModeparent);
//     }
//   };

//   return (
//     <div>
//       <input type="file" accept="image/*" onChange={handleImageUpload} />
//       <button onClick={toggleDrawingMode}>
//         {drawingMode ? "Disable " : "Enable"}
//       </button>
//       <button onClick={toggleDrawingModeparent}>
//         {drawingModeparent ? "Disable parent" : "Enable parent"}
//       </button>
//       <button onClick={toggleDrawingModechild}>
//         {drawingModechild ? "Disable child" : "Enable child"}
//       </button>
//       <canvas
//         id="canvas"
//         width="400"
//         height="500"
//         onMouseDown={handleMouseDown}
//         onMouseUp={handleMouseUp}
//         onMouseMove={handleMouseMove}
//       ></canvas>

//       <div>
//         {boxes.map((box, index) => (
//           <p key={index}>
//             Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//             {box.end.x}, {box.end.y})
//           </p>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ImageSelector;

// import React, { useState, useEffect } from "react";

// const ImageSelector = () => {
//   const [image, setImage] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [startCoordinates, setStartCoordinates] = useState({
//     x: null,
//     y: null,
//   });
//   const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
//   const [dragging, setDragging] = useState(false);
//   const [draggedBoxIndex, setDraggedBoxIndex] = useState(null);
//   const [zoomFactor, setZoomFactor] = useState(1);
//   const [boxNameInput, setBoxNameInput] = useState("");

//   const generateUniqueId = () => {
//     const timestamp = Date.now();
//     const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
//     return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
//   };

//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     const reader = new FileReader();

//     reader.onload = (e) => {
//       const img = new Image();
//       img.onload = () => {
//         const canvas = document.getElementById("canvas");
//         const context = canvas.getContext("2d");
//         context.drawImage(img, 0, 0, canvas.width, canvas.height);
//       };
//       img.src = e.target.result;
//       setImage(img);
//     };

//     if (file) {
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleMouseDown = (event) => {
//     const canvas = document.getElementById("canvas");
//     const rect = canvas.getBoundingClientRect();
//     const x = (event.clientX - rect.left) / zoomFactor;
//     const y = (event.clientY - rect.top) / zoomFactor;

//     const clickedBoxIndex = boxes.findIndex(
//       (box) =>
//         x >= box.start.x * zoomFactor &&
//         x <= (box.start.x + box.dimensions.width) * zoomFactor &&
//         y >= box.start.y * zoomFactor &&
//         y <= (box.start.y + box.dimensions.height) * zoomFactor
//     );

//     if (clickedBoxIndex !== -1) {
//       setDragging(true);
//       setDraggedBoxIndex(clickedBoxIndex);
//     } else {
//       setStartCoordinates({ x, y });
//       setEndCoordinates({ x, y });
//       setDragging(true);
//       setDraggedBoxIndex(null);
//     }
//   };

//   const handleMouseUp = () => {
//     setDragging(false);

//     // If a box is being dragged, update its coordinates
//     if (draggedBoxIndex !== null) {
//       const updatedBoxes = [...boxes];
//       const draggedBox = updatedBoxes[draggedBoxIndex];
//       const deltaX = endCoordinates.x - startCoordinates.x;
//       const deltaY = endCoordinates.y - startCoordinates.y;

//       draggedBox.start.x += deltaX;
//       draggedBox.start.y += deltaY;
//       draggedBox.end.x += deltaX;
//       draggedBox.end.y += deltaY;

//       setBoxes(updatedBoxes);
//     } else {
//       // Save the coordinates and dimensions of the current box
//       if (startCoordinates.x !== null && endCoordinates.x !== null) {
//         const newBox = {
//           id: generateUniqueId(),
//           name: boxNameInput,
//           childs: [],
//           isOpen: false,
//           type: "parent",
//           start: { ...startCoordinates },
//           end: { ...endCoordinates },
//           dimensions: {
//             width: Math.abs(endCoordinates.x - startCoordinates.x),
//             height: Math.abs(endCoordinates.y - startCoordinates.y),
//           },
//         };

//         setBoxes([...boxes, newBox]);
//         setBoxNameInput(""); // Clear the input field after adding the box
//         console.log("New Box:", newBox);
//       }
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (dragging) {
//       const canvas = document.getElementById("canvas");
//       const rect = canvas.getBoundingClientRect();
//       const x = (event.clientX - rect.left) / zoomFactor;
//       const y = (event.clientY - rect.top) / zoomFactor;

//       setEndCoordinates({ x, y });
//       draw();
//     }
//   };

//   const handleZoomIn = () => {
//     setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
//   };

//   const handleZoomOut = () => {
//     setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
//   };

//   const draw = () => {
//     const canvas = document.getElementById("canvas");
//     const context = canvas.getContext("2d");
//     context.clearRect(0, 0, canvas.width, canvas.height);

//     if (image) {
//       context.drawImage(
//         image,
//         0,
//         0,
//         canvas.width * zoomFactor,
//         canvas.height * zoomFactor
//       );
//     }

//     // Draw existing boxes
//     context.strokeStyle = "red";
//     context.lineWidth = 2;
//     boxes.forEach((box) => {
//       context.strokeRect(
//         box.start.x * zoomFactor,
//         box.start.y * zoomFactor,
//         box.dimensions.width * zoomFactor,
//         box.dimensions.height * zoomFactor
//       );

//       // Display box name
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         box.name,
//         box.start.x * zoomFactor + 5,
//         box.start.y * zoomFactor + 15
//       );
//     });

//     // Draw the current box being dragged
//     if (dragging && draggedBoxIndex === null) {
//       context.strokeRect(
//         startCoordinates.x * zoomFactor,
//         startCoordinates.y * zoomFactor,
//         (endCoordinates.x - startCoordinates.x) * zoomFactor,
//         (endCoordinates.y - startCoordinates.y) * zoomFactor
//       );

//       // Display box name for the dragged box
//       context.fillStyle = "black";
//       context.font = "12px Arial";
//       context.fillText(
//         boxNameInput,
//         startCoordinates.x * zoomFactor + 5,
//         startCoordinates.y * zoomFactor + 15
//       );
//     }
//   };

//   useEffect(() => {
//     draw();
//   }, [image, boxes, zoomFactor, dragging, draggedBoxIndex, boxNameInput]);

//   return (
//     <div>
//       <input type="file" accept="image/*" onChange={handleImageUpload} />
//       <input
//         type="text"
//         placeholder="Enter box name"
//         value={boxNameInput}
//         onChange={(e) => setBoxNameInput(e.target.value)}
//       />
//       <canvas
//         id="canvas"
//         width="800"
//         height="1200"
//         onMouseDown={handleMouseDown}
//         onMouseUp={handleMouseUp}
//         onMouseMove={handleMouseMove}
//       ></canvas>
//       <div>
//         <button onClick={handleZoomIn}>Zoom In</button>
//         <button onClick={handleZoomOut}>Zoom Out</button>
//       </div>
//       <div>
//         {boxes.map((box, index) => (
//           <p key={index}>
//             Box {index + 1} ID: {box.id}
//             <br />
//             Box {index + 1} Name: {box.name}
//             <br />
//             Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) - (
//             {box.end.x}, {box.end.y})<br />
//             Box {index + 1} Dimensions: Width - {box.dimensions.width}, Height -
//             {box.dimensions.height}
//           </p>
//         ))}
//       </div>
//     </div>
//   );
// };
// export default ImageSelector;
