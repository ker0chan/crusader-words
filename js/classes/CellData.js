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
  }
}
