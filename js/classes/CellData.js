class CellData
{
  constructor(content, number = '')
  {
    this.selected = false; //Is this cell selected?
    this.wordSelected = false; //Is this cell part of a word that is selected?
    this.content = content; //(Expected) content of the cell ('.' for black cells)
    this.black = (content == ".");
    this.userContent = ''; //User-inputted content for this cell
    this.number = number; //If a word starts on this cell, this is its number

    this.error = false; //A cell is tagged as "error" if it has been checked and had the wrong content.
    this.validated = false; //A cell is tagged as "validated" if it has been checked and had the right content.
    this.cheated = false; //A cell is tagged as "cheated" if it has been revealed and while it didn't have the right content.
    this.corrected = false; //A cell is tagged as "corrected" if it has been checked, had the wrong content, and has changed content since.
    //Note: names are HARD, okay. "cheating" isn't really cheating, and "corrected" cells might still be incorrect.
  }

  //Checks if a cell has the right content
  check()
  {
    //The cell has already been validated: it has the right content.
    if(this.validated) return true;
    //The cell is empty: it doesn't have the right content, but don't set its error/validated state (it's not "wrong" or "right", it's "nothing")
    if(this.userContent == '') return false;
    //Is there an error in the input (user content != expected content)?
    this.error = this.userContent != this.content;
    //No error upon checking: validate the cell
    this.validated = !this.error;
    return this.error;
  }

  //Reveals the content of a cell
  reveal()
  {
    //Did this cell have the right content already? Otherwise, consider the cell "cheated".
    this.cheated = (this.userContent != this.content);
    //Set the userContent to be the expected content of the cell
    this.userContent = this.content;
    //It's obviously not in an error state anymore
    this.error = false;
    //Validate this cell, it won't be checkable or editable anymore
    this.validated = true;
  }

  //Fill this cell with some input
  fill(input)
  {
    //If the cell is already validated, ignore this input
    if(this.validated) return;
    //If the cell was in an error state, note the attempt at correcting it
    if(this.error) this.corrected = true;
    //We don't know if it's wrong anymore, until we check; but we'll assume it's not, because optimism is good.
    this.error = false;
    //Set the user content for this cell to be the given input
    this.userContent = input;
  }
}
