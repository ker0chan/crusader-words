class Puzzle
{
  constructor(width, height, blacks, words, rawContent)
  {
    this.width = width; //Width of the grid. Extracted from the .puz file.
    this.height = height; //Height of the grid. Extracted from the .puz file.
    this.blacks = blacks; //An array of {x, y} coordinates indicating black cells
    this.words = words; //An array of Words.
    this.rawContent = rawContent; //A string containing the entire grid, with one letter (or ".") per cell. Should have a length of width*height. Extracted from the .puz file.

    this.cells = []; //An array of CellData. Will be data-bound to d3 elements.
    this.selectedWord; //The currently selected word

    this.initCells();
    this.select(0, true);
  }

  //Initialize the array of CellData from the rawContent and array of words
  initCells()
  {
    //Empty the array
    this.cells = [];

    //Read the raw content and build cells from it
    for(let i = 0; i < (this.width * this.height); i++)
    {
      this.cells.push(new CellData(this.rawContent[i]));
    }

    //Iterate over the list of words to fill in the numbers in the cells that need it
    this.words.forEach(function(w){
      this.at(w.x, w.y).number = w.number;
    }, this)
  }

  //Return the cell at coordinates (x, y)
  at(x, y)
  {
    return this.cells[y*this.width+x];
  }

  //Clear the current selection
  clearSelection()
  {
    this.cells.forEach(function(c){
      c.selected = false;
      c.wordSelected = false;
    });
  }

  //Select a cell at the given index, along with all the letters in the same word in the given direction
  select(index, direction)
  {
    //...But first, clear the current selection.
    this.clearSelection()

    let x = index%this.width;
    let y = Math.floor(index/this.width);

    let i;
    if(direction) //ACROSS
    {
      //Iterate on every cell to the left of the one we clicked
      // (don't select cells on a different row though!)
      for(i = index; i >= 0 && Math.floor(i/this.width) == y; i--)
      {
        //If it's black: stop
        if(this.cells[i].black) break;
        //Otherwise: it's part of the selection
        this.cells[i].wordSelected = true;
      }
      //Iterate on every cell to the right of the one we clicked
      for(i = index; i < this.width*this.height && Math.floor(i/this.width) == y; i++)
      {
        if(this.cells[i].black) break;
        this.cells[i].wordSelected = true;
      }
    } else //DOWN
    {
      //Iterate on every cell above the one we clicked
      for(i = index; i >= 0 /*&& index%this.width == x*/; i -= this.width)
      {
        if(this.cells[i].black) break;
        this.cells[i].wordSelected = true;
      }
      //Iterate on every cell below the one we clicked
      for(i = index; i < this.width*this.height /*&& index%this.width == x*/; i += this.width)
      {
        if(this.cells[i].black) break;
        this.cells[i].wordSelected = true;
      }
    }

    //Of course, select the cell at the given index
    this.cells[index].selected = true;

    //Find the word that's selected; we'll need to display its clue, and know which one is next/previous
    //Filter the only possible word from the wordList:
    this.selectedWord = this.words.filter(function(w){
      if(w.direction != direction) return false; //Exclude a word that's in the wrong direction
      if(direction) // Across
      {
        if(w.y != y) return false; //Exclude a word that's on another row
        if(w.x > x) return false; //Exclude a word that starts after our selection
        if(w.x + w.answer.length-1 < x) return false; //Exclude a word that ends before our selection
        return true;
      } else // Down
      {
        if(w.x != x) return false; //Exclude a word that's on another column
        if(w.y > y) return false; //Exclude a word that starts after our selection
        if(w.y + w.answer.length-1 < y) return false; //Exclude a word that ends before our selection
        return true;
      }
    })[0];
  }

  stringify()
  {
    return JSON.stringify({
      "width":this.width,
      "height":this.height,
      "blacks":this.blacks,
      "words":this.words,
      "rawContent":this.rawContent
    });
  }
}
