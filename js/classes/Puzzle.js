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
    this.selectedIndex; //The currently selected index
    this.selectedWord; //The currently selected word

    this.initCells(); //Initialize the cells data using the rawContent and Words array
    this.select(0, true); //Select the first (top-left) cell
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
    return this.cells[this.coordsToIndex(x,y)];
  }

  //Transform (x, y) coordinates into a cell index
  coordsToIndex(x, y)
  {
    return y*this.width+x;
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

    //Update selectedIndex
    this.selectedIndex = index;

    //Transform this index into x and y coordinates
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

  //Input the given letter at the current index, in the given direction
  input(letter, direction)
  {
    //Set the letter as the current cell's user content
    this.cells[this.selectedIndex].userContent = letter;
    if(direction) //Across
    {
      this.selectedIndex++; //Increment the index
      //Have we gone past the current words' last cell?
      if(this.selectedIndex >= this.coordsToIndex(this.selectedWord.x, this.selectedWord.y) + this.selectedWord.answer.length)
      {
        //Yes! Select the next one!
        //Return whatever selectNextWord returns, because this might change the current direction
        return this.selectNextWord(direction);
      } else
      {
        //No! Call select() with this new index to update the cells selected/wordSelected state
        this.select(this.selectedIndex, direction);
      }
    } else
    {
      this.selectedIndex += this.width; //Increment the index (vertically, by adding the puzzle's width)
      if(this.selectedIndex >= this.coordsToIndex(this.selectedWord.x, this.selectedWord.y) + this.selectedWord.answer.length*this.width)
      {
        return this.selectNextWord(direction);
      } else
      {
        this.select(this.selectedIndex, direction);
      }
    }

    //We didn't change the current direction, it's common courtesy to mention it.
    return false;
  }

  //Rewind (select the first letter of the currently selected word)
  rewind(direction)
  {
    this.select(this.coordsToIndex(this.selectedWord.x, this.selectedWord.y), direction);
  }

  //Backspace
  backspace(direction)
  {
    if(this.cells[this.selectedIndex].userContent != '')
    {
      //The current cell isn't empty its content
      this.cells[this.selectedIndex].userContent = '';
    } else
    {
      //The current cell is empty: go back to the previous cell and erase this one instead!

      //Decrement the index (depending on the direction, -1 or -width)
      this.selectedIndex -= (direction?1:this.width);
      //Have we gone past the current word's first cell?
      if(this.selectedIndex < this.coordsToIndex(this.selectedWord.x, this.selectedWord.y))
      {
        //Yes! Select the last cell of the previous word!
        return this.selectPrevWord(direction, true);
      } else
      {
        //No! Call select() with this new index to update the cells selected/wordSelected state
        this.select(this.selectedIndex, direction);
      }

      //And now, empty the cell's content èwé
      this.cells[this.selectedIndex].userContent = '';
    }

    //We didn't change direction.
    return false;
  }

  //Select the previous word (in the given direction, if available)
  //Optionally, select the last cell of the word (e.g. if we're backspacing)
  selectPrevWord(direction, selectLastCell = false)
  {
    let directionChanged = false; //We'll return true if we had to change directions

    //Find a word that has a number that's lower than the current word's number, in the same diretion.
    let currentNumber = this.selectedWord.number;
    //use reverse() on a copy (given by slice()) of our array. Find will return the first match, which is necessarily the previous word...
    let prevWord = this.words.slice().reverse().find(w=>w.number < currentNumber && w.direction == direction);
    //... or nothing at all.
    if(prevWord == undefined)
    {
      //We were on the first word of the grid in that direction.
      //Change directions,
      direction = !direction;
      directionChanged = true;
      // and find the first word, from the end of the list, in this new direction.
      prevWord = this.words.slice().reverse().find(w=>w.direction == direction);
    }

    if(selectLastCell)
    {
      //Select the last cell of this word (index + length - 1, directionally aware)
      this.select(this.coordsToIndex(prevWord.x, prevWord.y) + (direction?1:this.width)*(prevWord.answer.length-1), direction);
    } else
    {
      //Select the first cell of this word
      this.select(this.coordsToIndex(prevWord.x, prevWord.y), direction);
    }

    //Notify whoever called us that this action led to a change of direction
    return directionChanged;
  }

  //Select the next word (in the given direction, if available)
  selectNextWord(direction)
  {
    let directionChanged = false;

    //Find a word that has a number that's higher than the current word's number, in the same direction
    let currentNumber = this.selectedWord.number;
    //The first possible match is the next word...
    let nextWord = this.words.find(w=>w.number > currentNumber && w.direction == direction);
    //... or nothing at all.
    if(nextWord == undefined)
    {
      //We were on the last word of the grid in that direction.
      //Change directions,
      direction = !direction;
      directionChanged = true;
      // and find the first available word in the new direction.
      nextWord = this.words.find(w=>w.direction == direction);
    }

    //Select the first cell of this word
    this.select(this.coordsToIndex(nextWord.x, nextWord.y), direction);

    //And notify any direction change
    return directionChanged;
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
