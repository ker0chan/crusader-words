function parsePuz(buffer)
{
  // --- 0x00 to 0x2B: A bunch of magic numbers and checksums/checksum padding, ignore those ---

  // --- Puzzle settings ---
  //0x2C: The width of the board as a byte
  var width = buffer[0x2C];
  //0x2D: The height of the board as a byte
  var height = buffer[0x2D];
  //0x2E, 0x2F: Little-Endian short of the number of clues for this board
  var cluesCount = ((buffer[0x2F] & 0xFF << 8) | (buffer[0x2E] & 0xFF));

  // --- Grid Data ---

  //Solution:
  //0x34: A flat string of bytes, one for each cell in the board.
  // Rasters from the top left corner across the board, then to the second row, etc.
  // Non-playable (ie: black) cells are denoted by '.'

  //Read width*height bytes
  var gridData = buffer.slice(
    0x34,
    0x34+width*height
  )
  .reduce(
    // join each of them as individual chars
    (prev, c) => { return prev + String.fromCharCode(c); },
    ""
  );

  var words = [];
  var blacks = [];
  var n = 0;
  //For each cell
  for(let i = 0; i < gridData.length; i++)
  {
    let x = i%width;
    let y = Math.floor(i/width);

    //Found a black cell
    if(gridData[i] == ".")
    {
      //Store its position
      blacks.push({"x":x, "y":y});

      //Keep going~
      continue;
    }

    let foundAWordAcross = false;

    //Left border OR the cell on the left is black?
    if(i%width == 0 || gridData[i-1] == ".")
    {
      //Remember that we found a word on this cell, and increment the count
      foundAWordAcross = true;
      n++;
      //That's a word Across!
      words.push(new Word(x, y, n, true, readWord(gridData, x, y, width, height, true)));
    }

    //Top border OR the cell on top is black?
    if(i<width || gridData[i-width] == ".")
    {
      //Increment the count if it's the first word we found on this cell
      if(!foundAWordAcross)
      {
        n++;
      }
      //That's a word Down!
      words.push(new Word(x, y, n, false, readWord(gridData, x, y, width, height, false)));
    }
  }

  // --- Entering NUL-terminated territory ---

  //We'll use iterator as an out-parameter while reading from the buffer - it needs to be an object.
  var iterator = {pos:0}; // (I'm pretty sure there's a cleaner way to do this?!)

  //Title
  //0x34+2*width*height: A NUL-terminated string containing the title of the puzzle.
  iterator.pos = 0x34+2*(width*height);
  var title = readLine(buffer, iterator);

  //Author
  //A NUL-terminated string containing the author of the puzzle.
  var author = readLine(buffer, iterator);

  //Copyright
  //A NUL-terminated string, containing the copyright statement for the puzzle.
  var copyright = readLine(buffer, iterator);

  //Clues
  // A string of #-of-clues NUL-terminated strings, one right after the other.
  words.forEach(function(w){
    //Match each clue with its word - they should be in the same order!
    w.clue = readLine(buffer, iterator);
  })

  return new Puzzle(
    width,
    height,
    blacks,
    words,
    gridData.split("")
  );;
}

//Read in buffer (array of bytes) at the position of iterator, until the next NUL, and return a string
function readLine(buffer, iterator)
{
  var start = iterator.pos;

  //Move the iterator to the next NUL
  iterator.pos = getNextNul(buffer, start)+1;

  //Get the bytes from [start to NUL[
  return buffer.slice(
    start,
    iterator.pos-1
  ).reduce(
    //And join them as individual chars
    (prev, c) => { return prev + String.fromCharCode(c); },
    ""
  );
}

//Starting from start, find the next NUL in buffer (array of bytes)
function getNextNul(buffer, start)
{
  var i = start;
  for(; i < buffer.length; i++)
  {
    if(buffer[i] == 0) break;
  }
  return i;
}

//Read in gridData (string of w*h characters) starting at position (x,y), across or down, until the next dot, and return a string
function readWord(gridData, x, y, w, h, direction /* true: Across; false: Down */)
{
  var word = "";
  var l;
  //Read a letter until we reach a "." (out of bounds also returns ".")
  do
  {
    //Read one letter
    l = readLetter(gridData, x, y, w, h);

    //Is it a dot?
    if(l != ".")
    {
      //We're still going; append that letter to the current word
      word += l;

      //And move...
      if(direction)
      {
        // Across
        x++;
      } else
      {
        // Down
        y++;
      }
    }
  } while (l != ".") //Stop on dots

  return word;
}

//Read in gridData (string of w*h characters) at position (x,y)
function readLetter(gridData, x, y, w, h)
{
  //Check bounds
  if(x < 0 ||
    x >= w ||
    y < 0 ||
    y >= h) return ".";

  //Get the letter at this position
  return gridData[w*y+x];
}
