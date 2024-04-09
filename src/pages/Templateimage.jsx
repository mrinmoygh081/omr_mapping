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

      // Check if the click is inside the selected box
      if (selectedBoxIndex !== null) {
        const selectedBox = boxes[selectedBoxIndex];
        const { start, end } = selectedBox;

        // Calculate the coordinates relative to the canvas
        const x = (event.clientX - rect.left) / zoomFactor;
        const y = (event.clientY - rect.top) / zoomFactor;

        // Check if the click is inside the selected box
        if (x >= start.x && x <= end.x && y >= start.y && y <= end.y) {
          setDragging(true);
          setStartCoordinates({ x, y });
          setOriginalMousePosition({ x, y });
        }
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
    if (dragging && originalMousePosition) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor;
      const y = (event.clientY - rect.top) / zoomFactor;

      const deltaX = x - originalMousePosition.x;
      const deltaY = y - originalMousePosition.y;

      // Update the coordinates of the selected box
      if (selectedBoxIndex !== null) {
        const updatedBoxes = [...boxes];
        const selectedBox = updatedBoxes[selectedBoxIndex];
        selectedBox.start.x += deltaX;
        selectedBox.start.y += deltaY;
        selectedBox.end.x += deltaX;
        selectedBox.end.y += deltaY;

        // If the selected box is a parent, update the coordinates of its children
        if (selectedBox.mode === "parent") {
          selectedBox.children.forEach((childBox) => {
            childBox.start.x += deltaX;
            childBox.start.y += deltaY;
            childBox.end.x += deltaX;
            childBox.end.y += deltaY;
          });
        }

        setBoxes(updatedBoxes);
      }

      setOriginalMousePosition({ x, y });
      draw();
    } else if (drawingMode && dragging) {
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
    if (drMode) {
      setDrawingMode(false);
    } else {
      setDrawingMode(!drawingMode);
    }

    if (drawingMode) {
      setDragging(false);
    }
  };

  const toggleDrawingModeparent = () => {
    setDrawingModeparent(!drawingModeparent);
    setDragging(false);

    if (drawingModechild) {
      setDrawingModechild(!drawingModechild);
    }
  };

  const toggleDrawingModechild = () => {
    // if(drawingModechild == false){}
    setDrawingModechild(!drawingModechild);
    setDragging(false);

    if (drawingModeparent) {
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
// <div>
//   {boxes.map((box, index) => (
//     <div
//       key={index}
//       onClick={() => handleSelectBoxClick(index)}
//       style={{
//         border:
//           selectedBoxIndex === index
//             ? "2px solid orange"
//             : "1px solid black",
//         margin: "5px",
//         padding: "5px",
//         display: "inline-block",
//       }}
//     >
//       <p>
//         Box {index + 1} ID: {box.id}
//         <br />
//         Box {index + 1} Name: {box.name}
//         <br />
//         Box {index + 1} Coordinates: ({box.start.x}, {box.start.y})
//         - ({box.end.x}, {box.end.y})
//       </p>
//       {box.mode === "parent" && (
//         <div>
//           <p>Child Boxes:</p>
//           {box.children.map((childBox, childIndex) => (
//             <p key={childIndex}>
//               Box {childIndex + 1} ID: {childBox.id}
//               <br />
//               Child Box {childIndex + 1} Coordinates: (
//               {childBox.start.x}, {childBox.start.y}) - (
//               {childBox.end.x}, {childBox.end.y})
//             </p>
//           ))}
//         </div>
//       )}
//     </div>
//   ))}
// </div>
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
