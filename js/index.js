var currentPuzzle;
var gridPixelWidth;
var gridPixelHeight;
var cellBindings; //d3 bindings to the current puzzle's cells
var currentDirection = true; //true: Across; false: Down

resizeGrid(); //Initialize the grid size

//Create a virtual keyboard in #keyboard
var keyboard = new VirtualKeyboard(document.querySelector("#keyboard"));
//Bind the keyboard events to the appropriate event handlers
keyboard.on("input", inputHandler);
keyboard.on("rewind", rewindHandler);
keyboard.on ("backspace", backspaceHandler);

//Basic local storage restore
if(localStorage.getItem("currentPuzzle") != null)
{
  var s = JSON.parse(localStorage.getItem("currentPuzzle"));
  currentPuzzle = new Puzzle(s.width, s.height, s.blacks, s.words, s.rawContent);
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
  "--letter-default-color":"#585872",
  "--cell-black":"#826B88",
  "--cell-selected":"#DE786A",
  "--cell-word-selected":"#F8B976",

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
  //Input the current letter in the puzzle, in the currentDirection.
  if(currentPuzzle.input(letter, currentDirection))
  {
    //If Puzzle::input returns true, it changed the direction (probably reached the end of the last word of the grid in the currentDirection)
    currentDirection = !currentDirection;
  }
  //Display the changes
  render();
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
};

//Resizes the grid element
function resizeGrid()
{
  //Figure out the width and height for the (assumed square) grid.
  //Use the width or height (depending on which is smaller) of its container.
  var gridContainer = document.querySelector("#grid-flex-container");
  gridPixelWidth = gridPixelHeight = Math.min(gridContainer.offsetWidth, gridContainer.offsetHeight);

  //Style the grid element
  d3.select("#grid")
  .style("width", gridPixelWidth+"px")
  .style("height", gridPixelHeight+"px")
  .style("min-height", gridPixelHeight+"px")
}
function render()
{
  //Resize the grid element (could be done in a window resize event, but at least now it's done "often enough" ¯\_(ツ)_/¯)
  resizeGrid();

  //Figure out the width and height of each cell.
  var cellPixelWidth = gridPixelWidth/currentPuzzle.width;
  var cellPixelHeight = gridPixelHeight/currentPuzzle.height;
  //Ratio of the cell height that'll be applied to get a font size.
  //1 = letters fit perfectly, no margins, not pretty
  var fontSizeRatio = 0.7;
  //Ratio of the cell dimensions that'll be applied to get the number label dimensions
  //Keep it small, but readable.
  var numberLabelRatio = 0.32;
  //Ratio of the left margin that'll be applied to position the number
  var numberMarginRatio = 0.05;

  //Style the cell elements
  cellBindings.style("width", cellPixelWidth+"px")
  .style("height", cellPixelHeight+"px")
  .style("line-height", cellPixelHeight+"px")
  .style("font-size", (cellPixelHeight*fontSizeRatio)+"px")

  //Display the content of this cell
  cellBindings.selectAll(".content")
  .text(d => d.userContent)

  //Style the number element in this cell (might be empty, but styled nonetheless ¯\_(ツ)_/¯)
  cellBindings.selectAll(".number")
  .style("width", (cellPixelWidth*numberLabelRatio)+"px")
  .style("left", (cellPixelWidth*numberMarginRatio)+"px")
  .style("height", (cellPixelHeight*numberLabelRatio)+"px")
  .style("line-height", (cellPixelHeight*numberLabelRatio)+"px")
  .style("font-size", (cellPixelHeight*numberLabelRatio*fontSizeRatio)+"px")

  //Apply selection classes
  cellBindings
  .classed("selected", d => d.selected)
  .classed("word-selected", d => d.wordSelected)

  //Display the current clue
  document.querySelector("#clue").innerHTML = currentPuzzle.selectedWord.clue;
}

//Basic local storage save
function save()
{
  localStorage.setItem("currentPuzzle", currentPuzzle.stringify());
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
