var currentPuzzle;
var cellPixelSize;
var cellBindings; //d3 bindings to the current puzzle's cells
var currentDirection = true; //true: Across; false: Down
var autocheckMode = false;

//Create a virtual keyboard in #keyboard
var keyboard = new VirtualKeyboard(document.querySelector("#keyboard"));
//Bind the keyboard events to the appropriate event handlers
keyboard.on("input", inputHandler);
keyboard.on("rewind", rewindHandler);
keyboard.on ("backspace", backspaceHandler);
//Bind the prev/next-word buttons to their event handlers
document.querySelector("#prev-word").addEventListener("click", e => {
  prevWordHandler();
  //Stop the event from bubbling up the DOM tree and triggering a direction change (#prev-word is in #clue-container!)
  e.stopPropagation();
});
document.querySelector("#next-word").addEventListener("click", e => {
  nextWordHandler();
  //Stop the event from bubbling up the DOM tree and triggering a direction change (#next-word is in #clue-container!)
  e.stopPropagation();
});
//Use the clue as a button to switch between Across and Down
document.querySelector("#clue-container").addEventListener("click", changeDirectionHandler);

//Toolbar buttons
document.querySelector("#check-cell-button").addEventListener("click", checkCellHandler);
document.querySelector("#check-word-button").addEventListener("click", checkWordHandler);
document.querySelector("#check-puzzle-button").addEventListener("click", checkPuzzleHandler);
document.querySelector("#reveal-cell-button").addEventListener("click", revealCellHandler);
document.querySelector("#reveal-word-button").addEventListener("click", revealWordHandler);
document.querySelector("#autocheck-checkbox").addEventListener("change", e => {autocheckHandler(e.currentTarget.checked);});

//Match every .dropdown-button with its .dropdown
document.querySelectorAll(".dropdown-button").forEach(function(button){
  //On click,
  button.addEventListener("click", function(e){
    //if the corresponding dropdown isn't already open,
    if(!document.querySelector("#"+button.getAttribute("data-dropdown-id")).classList.contains("open"))
    {
      //open it
      openDropdown(button.getAttribute("data-dropdown-id"));
      //and stop the event from bubbling (otherwise it'll be caught as a random click and immediately close the dropdown!)
      e.stopPropagation();
    }
  })
})
//In response to any click event, if there's a dropdown open, close it.
document.addEventListener("click", function(e){
  if(document.querySelector(".dropdown.open") != null)
  {
    closeDropdowns();
  }
})
//Open the dropdown that matches ('#'+dropdownId)
function openDropdown(dropdownId)
{
  //Close any other dropdown
  closeDropdowns();
  //Show the dropdown container
  document.querySelector("#dropdown-container").classList.add("visible");
  //Show the .dropdown with this id
  document.querySelector("#"+dropdownId).classList.add("open");
  //Put the corrsponding .dropdown-button in its open state
  document.querySelector(".dropdown-button[data-dropdown-id='"+dropdownId+"']").classList.add("open");
}
//Close all dropdowns (open or not!)
function closeDropdowns()
{
  //Hide the dropdown container
  document.querySelector("#dropdown-container").classList.remove("visible");
  //Hide every .dropdown
  document.querySelectorAll(".dropdown").forEach(dd => dd.classList.remove("open"));
  //Reset every .dropdown-button to their closed state
  document.querySelectorAll(".dropdown-button").forEach(ddb => ddb.classList.remove("open"));
}

//Restore the current puzzle from local storage (if any)
if(localStorage.getItem("currentPuzzle") != null)
{
  //Deserialize the puzzle data
  var s = JSON.parse(localStorage.getItem("currentPuzzle"));
  //Rebuild the puzzle
  currentPuzzle = new Puzzle(s.width, s.height, s.blacks, s.words, s.circles, s.rawContent, s.cells);
  //Update the d3 bindings
  updateBindings();
}

//Make it pretty ✨
//(with CSS variables)
//TODO: handle multiple color schemes
var colorScheme = {
  "--page-bg-color":"#ffffff",
  "--toolbar-bg-color":"#376888",
  "--toolbar-text-color":"#8CD0E5",

  "--grid-bg-color":"#FCDDC9",
  "--grid-line-color":"#826B88",

  "--cell-black-bg-color":"#826B88",
  "--cell-selected-bg-color":"#DE786A",
  "--cell-word-selected-bg-color":"#F8B976",

  "--cell-default-text-color":"#585872",
  "--cell-validated-text-color":"#417C52",
  "--cell-cheated-marker-color":"#C50F0F",
  "--cell-corrected-marker-color":"#000000",
  "--cell-error-marker-color":"#C50F0F",

  "--clue-bg-color":"#376888",
  "--clue-text-color":"#8CD0E5",
  "--clue-icon-color":"#ffffff",

  "--keyboard-bg-color":"#8CD0E5",
  "--keyboard-keys-bg-color":"#ffffff",
  "--keyboard-keys-shadow-color":"#376888",
  "--keyboard-keys-text-color":"#376888"
}
for(let c in colorScheme){document.querySelector('body').style.setProperty(c, colorScheme[c])};

//Update the data binding between the current puzzle cells and the .cell elements using d3
function updateBindings()
{
  //Remove every existing cell element
  document.querySelectorAll("#grid .cell").forEach(a => a.remove());

  //Create the cell elements
  cellBindings = d3.select("#grid")
  .selectAll(".cell")
  .data(currentPuzzle.cells)
  .enter()
  .append("div")
  .classed("cell", true)
  .classed("black", d => d.black)
  .on('click', cellClickHandler)

  //Add a content element in each cell
  cellBindings.append("span")
  .classed("content", true)

  //Add a number element in each cell
  cellBindings.append("div")
  .classed("number", true)
  .text(d => d.number)

  //Add a circle element in circled cells
  cellBindings
  .filter(d=>d.circle)
  .append("div")
  .classed("circle", true)

  //Display the changes
  render();
}

//On click on a cell
function cellClickHandler(cell, index)
{
  //It's black: Do nothing.
  if(cell.black) return;

  //It's already selected: switch Accross<>Down
  if(cell.selected) currentDirection = !currentDirection;

  //Select the appropriate cells
  currentPuzzle.select(index, currentDirection);
  //Display the changes
  render();
}

//On keyboard input
function inputHandler(letter)
{
  let indexBeforeInput = currentPuzzle.selectedIndex;

  //Input the current letter in the puzzle, in the currentDirection.
  if(currentPuzzle.input(letter, currentDirection))
  {
    //If Puzzle::input returns true, it changed the direction (probably reached the end of the last word of the grid in the currentDirection)
    currentDirection = !currentDirection;
  }
  //If autocheck is enabled, check the cell as well (use indexBeforeInput, because calling input() means we have selected a new cell!)
  if(autocheckMode)
  {
    currentPuzzle.cells[indexBeforeInput].check();
  }
  //Display the changes
  render();
  //Autosave
  save();
}

//On keyboard rewind
function rewindHandler()
{
  //Rewind the selection (select the first letter of the currently selected word)
  currentPuzzle.rewind(currentDirection);
  //Display the changes
  render();
}

//On keyboard backspace
function backspaceHandler()
{
  //Backspace in the puzzle, in the currentDirection.
  if(currentPuzzle.backspace(currentDirection))
  {
    //If Puzzle::backspace return true, it changed the direction (backspaced at the beginning of the first word of the grid, which was empty)
    currentDirection = !currentDirection;
  }
  //Display the changes
  render();
  //Autosave
  save();
};

function prevWordHandler()
{
  //Select the previous word
  if(currentPuzzle.selectPrevWord(currentDirection))
  {
    //If Puzzle::selectPrevWord returns true, it changed the direction (we were on the first word in the grid)
    currentDirection = !currentDirection;
  }
  //Display the changes
  render();
}
function nextWordHandler()
{
  //Select the next word
  if(currentPuzzle.selectNextWord(currentDirection))
  {
    //If Puzzle::selectNextWord returns true, it changed the direction (we were on the last word in the grid)
    currentDirection = !currentDirection;
  }
  //Display the changes
  render();
}
function changeDirectionHandler()
{
  //Change the direction
  currentDirection = !currentDirection;
  //Re-trigger select on the current selectedIndex
  currentPuzzle.select(currentPuzzle.selectedIndex, currentDirection);
  //Display the changes
  render();
}
//Resizes the grid element
function resizeGrid()
{
  var gridContainer = document.querySelector("#grid-flex-container");
  //Figure out the maximum possible pixel size for cells, that will let us fit the grid in the available space
  cellPixelSize = Math.min(
    gridContainer.offsetWidth/currentPuzzle.width, //It needs to be at least this small to fit horizontally,
    gridContainer.offsetHeight/currentPuzzle.height //and at least this small to fit vertically.
  );

  //Style the grid element
  d3.select("#grid")
  .style("width", cellPixelSize*currentPuzzle.width+"px")
  .style("height", cellPixelSize*currentPuzzle.height+"px")
  .style("min-height", cellPixelSize*currentPuzzle.height+"px")
}
function render()
{
  //Resize the grid element (could be done in a window resize event, but at least now it's done "often enough" ¯\_(ツ)_/¯)
  resizeGrid();

  //Ratio of the cell height that'll be applied to get a font size.
  //1 = letters fit perfectly, no margins, not pretty
  var fontSizeRatio = 0.7;

  //Style the cell elements
  cellBindings.style("width", cellPixelSize+"px")
  .style("height", cellPixelSize+"px")
  .style("line-height", cellPixelSize+"px")
  .style("font-size", (cellPixelSize*fontSizeRatio)+"px")
  //Apply the state styles
  .style("--cell-marker-size", (cellPixelSize/3.0/2.0)+"px")
  .classed("validated", d=>d.validated) //Validated cells
  .classed("cheated", d=>d.cheated) //Cheated cells
  .classed("error", d=>(d.error && d.userContent != '')) //Error cells (empty cells don't show as error)
  .classed("corrected", d=>(d.corrected && !d.error && !d.cheated)) //Corrected cells (cells that have an error or have been cheatedly revealed don't show as corrected)
  //Apply selection classes
  cellBindings
  .classed("selected", d => d.selected) //The selected cell
  .classed("word-selected", d => d.wordSelected) //Cells that are part of the same word as the selected cell

  //Display the content of this cell
  cellBindings.selectAll(".content")
  .text(d => d.userContent)

  //Display the current clue
  document.querySelector("#clue").innerHTML = currentPuzzle.selectedWord.clue;
}

function checkCellHandler()
{
  //Check the state of the selected cell
  currentPuzzle.cells[currentPuzzle.selectedIndex].check();
  //Save and display changes
  save();
  render();
}

function checkWordHandler()
{
  //Check the state of every cell in the selected word
  currentPuzzle.cells.forEach(cell => {
    if(cell.wordSelected) cell.check();
  })
  //Save and display changes
  save();
  render();
}

function checkPuzzleHandler()
{
  //Check the state of every non-black cell in the puzzle
  currentPuzzle.cells.forEach(cell => {
    if(!cell.black) cell.check();
  })
  //Save and display changes
  save();
  render();
}

function revealCellHandler()
{
  //Reveal the selected cell
  currentPuzzle.cells[currentPuzzle.selectedIndex].reveal();
  //Save and display changes
  save();
  render();
}

function revealWordHandler()
{
  //Reveal every cell in the selected word
  currentPuzzle.cells.forEach(cell => {
    if(cell.wordSelected) cell.reveal();
  })
  //Save and display changes
  save();
  render();
}

function autocheckHandler(checked)
{
  autocheckMode = checked;
}

//Basic local storage save
function save()
{
  //Serialize currentPuzzle into local storage (calls Puzzle.prototype.toString)
  localStorage.setItem("currentPuzzle", currentPuzzle);
}

//Event listener for the file upload
document.querySelector("#upload").addEventListener("change", function(e){
  if(!window.FileReader) return; //Browser is not compatible => abort, sorry
  var reader = new FileReader();
  reader.onload = function(evt) {
    //TODO: Some kind of error checking maybe (wrong file type, no file selected, etc...)

    var data = reader.result;
    var puzBuffer = new Int8Array(data);
    currentPuzzle = parsePuz(puzBuffer);
    updateBindings();
  };
  reader.readAsArrayBuffer(e.target.files[0]);
})
